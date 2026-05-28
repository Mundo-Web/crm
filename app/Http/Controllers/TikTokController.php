<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Integration;
use App\Models\Campaign;
use App\Models\AdSet;
use App\Models\Ad;
use App\Models\Client;
use App\Models\Message;
use App\Models\ClientNote;
use App\Models\Setting;
use App\Jobs\FetchTikTokLeadJob;
use App\Jobs\MetaAssistantJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;
use SoDe\Extend\Text;

class TikTokController extends Controller
{
    // 1. Guardar credenciales de la app en la DB antes del OAuth
    public function saveAppCredentials(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = Auth::user()->business_id;
            
            if (!$request->client_key || !$request->client_secret) {
                throw new \Exception('Faltan credenciales (Client Key / Secret)');
            }

            $integration = Integration::updateOrCreate([
                'meta_service' => 'tiktok',
                'business_id' => $businessId
            ], [
                'meta_app_id' => $request->client_key,
                'meta_app_secret' => $request->client_secret,
                'status' => false // Inactivo hasta que se seleccione el Advertiser ID
            ]);

            return ['success' => true];
        });

        return response($response->toArray(), $response->status);
    }

    // 2. OAuth Callback de TikTok
    public function handleTikTokCallback(Request $request)
    {
        try {
            $code = $request->query('code');
            $businessUuid = $request->query('state');

            if (!$code) {
                throw new \Exception('Falta el código de autorización de TikTok');
            }
            if (!$businessUuid) {
                throw new \Exception('Falta el parámetro de estado (UUID del negocio)');
            }

            // Buscar el negocio
            $business = Business::where('uuid', $businessUuid)->first();
            if (!$business) {
                throw new \Exception('Negocio no encontrado');
            }

            // Obtener la integración temporal para sacar las credenciales de la app
            $integration = Integration::where('meta_service', 'tiktok')
                ->where('business_id', $business->id)
                ->first();

            if (!$integration || !$integration->meta_app_id || !$integration->meta_app_secret) {
                throw new \Exception('No se encontraron credenciales de TikTok guardadas para este negocio');
            }

            // Intercambiar auth_code por access_token
            $tokenUrl = "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/";
            $tokenRes = new Fetch($tokenUrl, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'app_id' => $integration->meta_app_id,
                    'secret' => $integration->meta_app_secret,
                    'auth_code' => $code
                ]
            ]);

            $tokenData = $tokenRes->json();

            if (isset($tokenData['code']) && $tokenData['code'] !== 0) {
                $errorMsg = $tokenData['message'] ?? 'Error desconocido en intercambio de token';
                throw new \Exception("Error de TikTok API: [{$tokenData['code']}] {$errorMsg}");
            }

            $data = $tokenData['data'] ?? [];
            $accessToken = $data['access_token'] ?? null;
            $refreshToken = $data['refresh_token'] ?? null;
            $advertiserIds = $data['advertiser_ids'] ?? [];

            if (!$accessToken) {
                throw new \Exception('No se recibió access_token de TikTok');
            }

            // Actualizar integración con tokens provisionales
            $integration->update([
                'meta_access_token' => $accessToken,
                'meta_app_token' => $refreshToken, // Guardamos el refresh_token aquí
            ]);

            // Obtener perfiles detallados de los Advertiser IDs
            $advertisers = [];
            if (!empty($advertiserIds)) {
                $advUrl = "https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=" . urlencode(json_encode($advertiserIds));
                $advRes = new Fetch($advUrl, [
                    'method' => 'GET',
                    'headers' => [
                        'Access-Token' => $accessToken,
                        'Content-Type' => 'application/json'
                    ]
                ]);
                $advData = $advRes->json();
                if (isset($advData['code']) && $advData['code'] === 0 && !empty($advData['data']['list'])) {
                    foreach ($advData['data']['list'] as $adv) {
                        $advertisers[] = [
                            'id' => $adv['advertiser_id'],
                            'name' => $adv['advertiser_name'] ?? 'Cuenta de TikTok ' . $adv['advertiser_id'],
                            'avatar_url' => $adv['avatar_url'] ?? null
                        ];
                    }
                } else {
                    foreach ($advertiserIds as $id) {
                        $advertisers[] = [
                            'id' => $id,
                            'name' => 'Cuenta de TikTok ' . $id,
                            'avatar_url' => null
                        ];
                    }
                }
            }

            // Codificar payload para la vista callback
            $payload = base64_encode(json_encode([
                'service' => 'tiktok',
                'advertisers' => $advertisers,
                'user_token' => $accessToken,
                'refresh_token' => $refreshToken
            ]));

            return view('tiktok_callback', ['payload' => $payload]);

        } catch (\Throwable $th) {
            Log::error('Error en callback de TikTok: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString()
            ]);
            return response('Error de autenticación con TikTok: ' . $th->getMessage(), 500);
        }
    }

    // 3. Obtener el perfil de la cuenta de TikTok (usado por IntegrationController)
    public static function getAdvertiserProfile(string $advertiserId, string $accessToken)
    {
        try {
            $url = "https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=" . urlencode(json_encode([$advertiserId]));
            $res = new Fetch($url, [
                'method' => 'GET',
                'headers' => [
                    'Access-Token' => $accessToken,
                    'Content-Type' => 'application/json'
                ]
            ]);
            $json = $res->json();
            if (isset($json['code']) && $json['code'] === 0 && !empty($json['data']['list'])) {
                $adv = $json['data']['list'][0];
                return [
                    'id' => $adv['advertiser_id'],
                    'name' => $adv['advertiser_name'] ?? 'Cuenta de TikTok',
                    'picture' => [
                        'data' => [
                            'url' => $adv['avatar_url'] ?? null
                        ]
                    ]
                ];
            } else {
                $errorMsg = $json['message'] ?? 'Error desconocido al obtener perfil';
                return ['error' => $errorMsg];
            }
        } catch (\Throwable $e) {
            return ['error' => $e->getMessage()];
        }
    }

    // 4. Webhook Receptor de Webhooks de TikTok (Leads y Mensajes)
    public function webhook(Request $request, string $business_uuid)
    {
        $data = $request->all();

        Log::info('TikTok webhook received', [
            'business_uuid' => $business_uuid,
            'payload' => $data
        ]);

        // Verificación de Webhook (challenge)
        if (isset($data['event']) && $data['event'] === 'verify') {
            return response()->json([
                'challenge' => $data['challenge'] ?? null
            ]);
        }
        if ($request->has('challenge')) {
            return response($request->input('challenge'));
        }

        // Buscar negocio
        $business = Business::where('uuid', $business_uuid)
            ->where('status', true)
            ->first();

        if (!$business) {
            Log::error('TikTok webhook error: business not found', ['uuid' => $business_uuid]);
            return response()->json(['error' => 'Business not found'], 404);
        }

        $event = $data['event'] ?? '';
        $advertiserId = $data['advertiser_id'] ?? null;

        if (!$advertiserId) {
            return response()->json(['error' => 'Missing advertiser_id'], 400);
        }

        // Buscar la integración activa para este advertiser y negocio
        $integration = Integration::where('meta_service', 'tiktok')
            ->where('business_id', $business->id)
            ->where('status', true)
            ->where(function ($q) use ($advertiserId) {
                $q->where('meta_business_id', $advertiserId)
                  ->orWhere('meta_ad_account_id', $advertiserId);
            })
            ->first();

        if (!$integration) {
            Log::error('TikTok webhook error: integration not found', [
                'business_id' => $business->id,
                'advertiser_id' => $advertiserId
            ]);
            return response()->json(['error' => 'Integration not found'], 404);
        }

        // Caso 1: Captura de Leads (Formularios)
        if ($event === 'lead.create') {
            $leadData = $data['data'] ?? [];
            $leadId = $leadData['lead_id'] ?? null;
            $formId = $leadData['form_id'] ?? null;

            if ($leadId && $formId) {
                // Despachar Job asíncrono para descargar, descomprimir y parsear el Lead
                FetchTikTokLeadJob::dispatch($integration, $leadId, $formId);
                return response()->json(['success' => true]);
            }
        }

        // Caso 2: Mensajería Directa (Chats Orgánicos)
        if ($event === 'im.message.receive' || $event === 'im.message.receive_v1') {
            $msgData = $data['data'] ?? [];
            $senderOpenId = $msgData['sender_openid'] ?? null;
            $messageId = $msgData['message_id'] ?? null;
            $rawContent = $msgData['content'] ?? null; // JSON String

            if (!$senderOpenId || !$rawContent) {
                return response()->json(['error' => 'Invalid message data'], 400);
            }

            // Parsear contenido del mensaje
            $content = json_decode($rawContent, true);
            $messageText = $content['text'] ?? '';

            if (empty($messageText)) {
                return response()->json(['success' => true, 'message' => 'Skipping empty or unsupported message type']);
            }

            // Buscar o crear cliente
            $client = Client::where('business_id', $business->id)
                ->where('integration_user_id', $senderOpenId)
                ->where('status', true)
                ->first();

            if (!$client) {
                $client = Client::create([
                    'integration_id' => $integration->id,
                    'integration_user_id' => $senderOpenId,
                    'business_id' => $business->id,
                    'name' => 'TikTok User ' . substr($senderOpenId, 0, 8),
                    'contact_name' => 'TikTok User ' . substr($senderOpenId, 0, 8),
                    'contact_phone' => '',
                    'contact_email' => null,
                    'message' => 'Chat iniciado desde TikTok',
                    'source' => 'TikTok',
                    'date' => date('Y-m-d'),
                    'time' => date('H:i:s'),
                    'status_id' => Setting::get('default-lead-status', $business->id),
                    'manage_status_id' => Setting::get('default-manage-lead-status', $business->id),
                    'origin' => 'TikTok',
                    'lead_origin' => 'TikTok',
                    'triggered_by' => 'TikTok DM',
                    'status' => true,
                    'complete_registration' => false,
                    'source_channel' => 'TikTok DM'
                ]);
            }

            // Crear el mensaje en la DB
            $message = Message::create([
                'wa_id' => $senderOpenId,
                'role' => 'Human',
                'message' => $messageText,
                'business_id' => $business->id,
                'microtime' => (int) (microtime(true) * 1_000_000)
            ]);

            // Disparar asistente Gemini si está configurada la API key
            $hasApikey = Setting::get('gemini-api-key', $business->id);
            if ($hasApikey) {
                MetaAssistantJob::dispatch($client, $message, 'tiktok');
            }

            return response()->json(['success' => true]);
        }

        return response()->json(['success' => true, 'message' => 'Unhandled event']);
    }

    // 5. Enviar mensaje saliente desde el CRM
    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = Auth::user()->business_id;

            if (!$request->client_id || !$request->message) {
                throw new \Exception('Faltan parámetros requeridos (client_id / message)');
            }

            $client = Client::where('id', $request->client_id)
                ->where('business_id', $businessId)
                ->first();

            if (!$client) {
                throw new \Exception('Cliente no encontrado');
            }

            $integration = Integration::find($client->integration_id);
            if (!$integration || $integration->meta_service !== 'tiktok' || !$integration->meta_access_token) {
                throw new \Exception('Integración de TikTok no configurada o inactiva');
            }

            $advertiserId = $integration->meta_ad_account_id ?? $integration->meta_business_id;
            $recipientOpenId = $client->integration_user_id;

            // Consumir API de TikTok Business IM
            $sendUrl = "https://business-api.tiktok.com/open_api/v1.3/business/im/message/send/";
            $sendRes = new Fetch($sendUrl, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Access-Token' => $integration->meta_access_token
                ],
                'body' => [
                    'advertiser_id' => $advertiserId,
                    'open_id' => $recipientOpenId,
                    'msg_type' => 'TEXT',
                    'content' => json_encode(['text' => $request->message])
                ]
            ]);

            $sendData = $sendRes->json();

            if (isset($sendData['code']) && $sendData['code'] !== 0) {
                $errorMsg = $sendData['message'] ?? 'Error desconocido al enviar mensaje';
                throw new \Exception("Error TikTok API: [{$sendData['code']}] {$errorMsg}");
            }

            // Guardar en base de datos local
            Message::create([
                'wa_id' => $recipientOpenId,
                'role' => 'User',
                'message' => $request->message,
                'business_id' => $businessId,
                'microtime' => (int) (microtime(true) * 1_000_000)
            ]);

            return ['success' => true];
        });

        return response($response->toArray(), $response->status);
    }

    // 6. Sincronizar campañas y reportes
    public function syncTikTokCampaigns(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = Auth::user()->business_id;

            $integration = Integration::where('meta_service', 'tiktok')
                ->where('business_id', $businessId)
                ->where('status', true)
                ->first();

            if (!$integration || !$integration->meta_access_token) {
                throw new \Exception('No hay una integración activa de TikTok.');
            }

            $accessToken = $integration->meta_access_token;
            $advertiserId = $integration->meta_ad_account_id ?? $integration->meta_business_id;

            if (!$advertiserId) {
                throw new \Exception('No se ha configurado la cuenta publicitaria (Advertiser ID) de TikTok.');
            }

            // Sincronizar campañas
            $campaignsUrl = "https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id={$advertiserId}&page_size=100";
            $campaignsRes = new Fetch($campaignsUrl, [
                'method' => 'GET',
                'headers' => [
                    'Access-Token' => $accessToken,
                    'Content-Type' => 'application/json'
                ]
            ]);
            $campaignsData = $campaignsRes->json();
            $tiktokCampaigns = $campaignsData['data']['list'] ?? [];

            // Sincronizar adgroups (ad sets)
            $adGroupsUrl = "https://business-api.tiktok.com/open_api/v1.3/adgroup/get/?advertiser_id={$advertiserId}&page_size=100";
            $adGroupsRes = new Fetch($adGroupsUrl, [
                'method' => 'GET',
                'headers' => [
                    'Access-Token' => $accessToken,
                    'Content-Type' => 'application/json'
                ]
            ]);
            $adGroupsData = $adGroupsRes->json();
            $tiktokAdGroups = $adGroupsData['data']['list'] ?? [];

            // Sincronizar ads (anuncios)
            $adsUrl = "https://business-api.tiktok.com/open_api/v1.3/ad/get/?advertiser_id={$advertiserId}&page_size=100";
            $adsRes = new Fetch($adsUrl, [
                'method' => 'GET',
                'headers' => [
                    'Access-Token' => $accessToken,
                    'Content-Type' => 'application/json'
                ]
            ]);
            $adsData = $adsRes->json();
            $tiktokAds = $adsData['data']['list'] ?? [];

            // Sincronizar Métricas / Reportes
            // Usamos /report/integrated/get/ para spend, impressions, clicks por ad
            $reportUrl = "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id={$advertiserId}&report_type=BASIC&data_level=AUCTION_AD&dimensions=" . urlencode(json_encode(["ad_id"])) . "&metrics=" . urlencode(json_encode(["spend", "impressions", "clicks"])) . "&page_size=100";
            $reportRes = new Fetch($reportUrl, [
                'method' => 'GET',
                'headers' => [
                    'Access-Token' => $accessToken,
                    'Content-Type' => 'application/json'
                ]
            ]);
            $reportData = $reportRes->json();
            $tiktokReports = $reportData['data']['list'] ?? [];

            $adMetrics = [];
            foreach ($tiktokReports as $report) {
                $metrics = $report['metrics'] ?? [];
                $adMetrics[$report['dimensions']['ad_id']] = [
                    'spend' => floatval($metrics['spend'] ?? 0),
                    'impressions' => intval($metrics['impressions'] ?? 0),
                    'clicks' => intval($metrics['clicks'] ?? 0)
                ];
            }

            // Registrar en base de datos local
            // 1. Guardar / actualizar campañas
            $localCampaignMap = [];
            foreach ($tiktokCampaigns as $tc) {
                $camp = Campaign::updateOrCreate([
                    'business_id' => $businessId,
                    'code' => $tc['campaign_id']
                ], [
                    'title' => $tc['campaign_name'] ?? 'Campaña TikTok',
                    'source' => 'tiktok',
                    'status' => ($tc['opt_status'] ?? 'ENABLE') === 'ENABLE'
                ]);
                $localCampaignMap[$tc['campaign_id']] = $camp->id;
            }

            // 2. Guardar / actualizar adgroups (ad sets)
            $localAdSetMap = [];
            foreach ($tiktokAdGroups as $tg) {
                $campaignId = $localCampaignMap[$tg['campaign_id']] ?? null;
                if (!$campaignId) continue;

                $adSet = AdSet::updateOrCreate([
                    'business_id' => $businessId,
                    'meta_id' => $tg['adgroup_id']
                ], [
                    'campaign_id' => $campaignId,
                    'name' => $tg['adgroup_name'] ?? 'Ad Set TikTok',
                    'status' => $tg['opt_status'] ?? 'ACTIVE'
                ]);
                $localAdSetMap[$tg['adgroup_id']] = $adSet->id;
            }

            // 3. Guardar / actualizar anuncios (ads) y sus métricas
            foreach ($tiktokAds as $ta) {
                $adSetId = $localAdSetMap[$ta['adgroup_id']] ?? null;
                if (!$adSetId) continue;

                $metrics = $adMetrics[$ta['ad_id']] ?? ['spend' => 0, 'impressions' => 0, 'clicks' => 0];

                Ad::updateOrCreate([
                    'business_id' => $businessId,
                    'meta_id' => $ta['ad_id']
                ], [
                    'ad_set_id' => $adSetId,
                    'name' => $ta['ad_name'] ?? 'Ad TikTok',
                    'status' => $ta['opt_status'] ?? 'ACTIVE',
                    'spend' => $metrics['spend'],
                    'form_name' => 'TikTok Lead Form'
                ]);
            }

            // 4. Sumarizar spends y métricas jerárquicamente
            // AdSets
            $localAdSets = AdSet::where('business_id', $businessId)->get();
            foreach ($localAdSets as $adSet) {
                $sumSpend = Ad::where('ad_set_id', $adSet->id)->sum('spend');
                $adSet->update(['spend' => $sumSpend]);
            }

            // Campaigns
            $localCampaigns = Campaign::where('business_id', $businessId)->where('source', 'tiktok')->get();
            foreach ($localCampaigns as $camp) {
                $adSetIds = AdSet::where('campaign_id', $camp->id)->pluck('id');
                $sumSpend = AdSet::whereIn('id', $adSetIds)->sum('spend');
                
                $adMetaIds = Ad::whereIn('ad_set_id', $adSetIds)->pluck('meta_id');
                $sumImpressions = 0;
                $sumClicks = 0;
                foreach ($adMetaIds as $mId) {
                    if (isset($adMetrics[$mId])) {
                        $sumImpressions += $adMetrics[$mId]['impressions'];
                        $sumClicks += $adMetrics[$mId]['clicks'];
                    }
                }

                $camp->update([
                    'spend' => $sumSpend,
                    'impressions' => $sumImpressions,
                    'clicks' => $sumClicks
                ]);
            }

            return ['success' => true];
        });

        return response($response->toArray(), $response->status);
    }
}
