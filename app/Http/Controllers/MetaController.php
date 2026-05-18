<?php

namespace App\Http\Controllers;

use App\Jobs\MetaAssistantJob;
use App\Models\Ad;
use App\Models\AdSet;
use App\Models\Atalaya\Business;
use App\Models\Atalaya\ServicesByBusiness;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Setting;
use App\Models\Task;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Crypto;
use SoDe\Extend\Fetch;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

class MetaController extends Controller
{
    public static function getInstagramProfile(string $id, string $accessToken, bool $external = false)
    {
        if ($external) {
            $igRest = new Fetch(env('INSTAGRAM_GRAPH_URL') . "/{$id}?fields=id,name,username&access_token={$accessToken}");
            $igData = $igRest->json();

            if (isset($igData['error'])) throw new Exception('Error, token de acceso inválido');

            return $igData;
        }

        $igMeRest = new Fetch(env('INSTAGRAM_GRAPH_URL') . "/me?fields=id,name,username&access_token={$accessToken}");
        $igRest = new Fetch(env('INSTAGRAM_GRAPH_URL') . "/{$id}?fields=id,name,username&access_token={$accessToken}");

        $igMeData = $igMeRest->json();
        $igData = $igRest->json();

        if (isset($igMeData['error']) || isset($igData['error'])) throw new Exception('Error, token de acceso inválido');
        if ($igMeData['id'] != $igData['id']) throw new Exception('Error, el token de acceso no pertenece al negocio');

        return $igData;
    }
    public static function getFacebookProfile(string $id, string $accessToken, bool $external = false)
    {
        if ($external) {
            $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?access_token={$accessToken}");
            $fbData = $fbRest->json();

            if (isset($fbData['error'])) throw new Exception('Error, token de acceso inválido');

            return $fbData;
        }

        $fbMeRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/me?fields=id,name,username,picture&access_token={$accessToken}");
        $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?fields=id,name,username,picture&access_token={$accessToken}");

        $fbMeData = $fbMeRest->json();
        $fbData = $fbRest->json();

        if (isset($fbMeData['error']) || isset($fbData['error'])) throw new Exception('Error, token de acceso inválido');
        if ($fbMeData['id'] != $fbData['id']) throw new Exception('Error, el token de acceso no pertenece al negocio');

        return $fbData;
    }
    public static function getMetaProfile(string $id, string $accessToken, bool $external = false)
    {
        if ($external) {
            $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?access_token={$accessToken}");
            $fbData = $fbRest->json();

            if (isset($fbData['error'])) throw new Exception('Error, token de acceso inválido');

            return $fbData;
        }

        $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?fields=id,name,username,picture&access_token={$accessToken}");

        $fbData = $fbRest->json();

        if (isset($fbData['error'])) throw new Exception($fbData['error']['message'] ?? 'Error, token de acceso inválido');

        return $fbData;
    }
    public static function getWhatsAppProfile(string $id, string $accessToken)
    {
        $rest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?fields=id,name,currency,owner_business_info&access_token={$accessToken}");
        $data = $rest->json();

        if (isset($data['error'])) throw new Exception($data['error']['message'] ?? 'Error, token inválido o sin permisos');

        return $data;
    }
    public function verify(Request $request, string $origin, string $business_uuid)
    {
        $response = Response::simpleTryCatch(function () use ($request, $origin, $business_uuid) {
            $challenge = $request->query('hub_challenge');
            $verify_token = $request->query('hub_verify_token');

            Log::info('Meta webhook verification attempt', [
                'origin' => $origin,
                'business_uuid' => $business_uuid,
                'verify_token' => $verify_token
            ]);

            if (!in_array($origin, ['messenger', 'instagram', 'whatsapp', 'forms'])) {
                Log::warning('Webhook verification failed: invalid origin', ['origin' => $origin]);
                return response('Error, origen no permitido', 403);
            }

            $sbbJpa = ServicesByBusiness::query()
                ->join('businesses', 'services_by_businesses.business_id', '=', 'businesses.id')
                ->join('services', 'services_by_businesses.service_id', '=', 'services.id')
                ->where('services.correlative', env('APP_CORRELATIVE'))
                ->where('businesses.uuid', $business_uuid)
                ->where('businesses.status', true)
                ->first();

            if (!$sbbJpa) {
                Log::warning('Webhook verification failed: business not found or inactive', ['uuid' => $business_uuid]);
                return response('Error, negocio no encontrado o inactivo', 403);
            }

            $expected_token = hash('sha256', $business_uuid);
            if ($expected_token != $verify_token) {
                Log::warning('Webhook verification failed: token mismatch', [
                    'expected' => $expected_token,
                    'received' => $verify_token
                ]);
                return response('Error, token de validación incorrecto', 403);
            }

            Log::info('Webhook verification successful', ['origin' => $origin]);
            return $challenge;
        });

        return response($response->data, 200);
    }

    public function webhook(Request $request, string $origin, string $business_uuid)
    {
        $response = Response::simpleTryCatch(function () use ($request, $origin, $business_uuid) {
            $data = $request->all();

            try {
                if (!in_array($origin, ['messenger', 'instagram', 'whatsapp', 'forms'])) throw new Exception('Error, origen no permitido');

                $entry = $data['entry'][0] ?? [];

                Log::info('Meta webhook received', [
                    'origin' => $origin,
                    'business_uuid' => $business_uuid,
                    'payload' => $data
                ]);

            $businessJpa = Business::query()
                ->where('uuid', $business_uuid)
                ->where('status', true)
                ->first();
            if (!$businessJpa) {
                Log::error('Webhook error: business not found', ['uuid' => $business_uuid]);
                throw new Exception('Error, negocio no encontrado o inactivo');
            }

            $integrationJpa = Integration::query()
                ->where('meta_service', $origin)
                ->where('business_id', $businessJpa->id)
                ->where('status', true)
                ->first();

            if ($origin === 'forms') {
                $leadgenId = $entry['changes'][0]['value']['leadgen_id'] ?? null;
                if (!$leadgenId) {
                    Log::error('Webhook Meta Forms sin leadgen_id');
                    return;
                }

                $leadData = [];
                try {
                    $facebookGraphUrl = env('FACEBOOK_GRAPH_URL');
                    $accessToken = $integrationJpa->meta_access_token;

                    // Step 1: Try to get Page Access Token if it's a user token
                    $pageId = $entry['changes'][0]['value']['page_id'] ?? $integrationJpa->meta_business_id;
                    $pageRes = new Fetch("{$facebookGraphUrl}/{$pageId}?fields=access_token", [
                        'headers' => ['Authorization' => 'Bearer ' . $accessToken]
                    ]);
                    $pageData = $pageRes->json();
                    
                    if (isset($pageData['access_token'])) {
                        $accessToken = $pageData['access_token'];
                        Log::info('Using Page Access Token for lead retrieval');
                    }

                    // Step 2: Fetch Lead Data
                    $leadRes = new Fetch($facebookGraphUrl . '/' . $leadgenId . '?fields=created_time,platform,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,field_data', [
                        'headers' => ['Authorization' => 'Bearer ' . $accessToken]
                    ]);
                    $leadData = $leadRes->json();
                    Log::info('Meta Lead Data Response', ['leadData' => $leadData]);
                } catch (\Exception $e) {
                    Log::error('Error consultando detalles del lead en Meta', ['error' => $e->getMessage()]);
                }

                // Parse lead data to extract form fields
                $fieldData = [];
                foreach ($leadData['field_data'] ?? [] as $field) {
                    $fieldData[$field['name']] = $field['values'][0] ?? null;
                }

                $fullName = $fieldData['full_name'] ?? $fieldData['nombre_completo'] ?? $fieldData['nombre'] ?? 'Sin nombre';
                $phone = Text::keep($fieldData['phone_number'] ?? $fieldData['telefono'] ?? $fieldData['movil'] ?? '', '0123456789');
                $email = $fieldData['email'] ?? $fieldData['correo'] ?? null;

                // Check if client already exists (By Phone or Email, since lead_id is unique per form)
                $clientJpa = Client::query()
                    ->where('business_id', $businessJpa->id)
                    ->where('status', true)
                    ->where(function($q) use ($phone, $email) {
                        if ($phone) $q->where('contact_phone', $phone);
                        if ($email) $q->orWhere('contact_email', $email);
                    })
                    ->first();

                if ($clientJpa && $clientJpa->campaign_id) {
                    Log::info('Lead already exists and has a campaign, skipping', ['client_id' => $clientJpa->id]);
                    return;
                }

                $platforms = [
                    'ig' => 'Instagram',
                    'fb' => 'Facebook',
                    'instagram' => 'Instagram',
                    'facebook' => 'Facebook'
                ];
                $platformKey = strtolower($leadData['platform'] ?? '');
                $originName = $platforms[$platformKey] ?? 'Facebook';

                // Clean Meta IDs from prefixes (c:, as:, ag:, f:, l:)
                $rawCampaignId = $leadData['campaign_id'] ?? null;
                $cleanCampaignId = $rawCampaignId ? trim(preg_replace('/^[a-z]+:/i', '', $rawCampaignId)) : 'external';
                
                $campaignJpa = Campaign::updateOrCreate([
                    'business_id' => $businessJpa->id,
                    'code' => $cleanCampaignId
                ], [
                    'title' => $leadData['campaign_name'] ?? 'Campaña Externa',
                    'source' => strtolower($originName)
                ]);

                // Registrar AdSet para Formularios
                $adSetId = preg_replace('/^[a-z]+:/i', '', $leadData['adset_id'] ?? '');
                $adSetJpa = \App\Models\AdSet::updateOrCreate([
                    'campaign_id' => $campaignJpa->id,
                    'meta_id' => $adSetId
                ], [
                    'name' => $leadData['adset_name'] ?? 'Conjunto de anuncios Form',
                    'status' => 'ACTIVE',
                    'business_id' => $businessJpa->id
                ]);

                // Registrar Ad para Formularios
                $adIdClean = preg_replace('/^[a-z]+:/i', '', $leadData['ad_id'] ?? '');
                if ($adIdClean) {
                    \App\Models\Ad::updateOrCreate([
                        'ad_set_id' => $adSetJpa->id,
                        'meta_id' => $adIdClean
                    ], [
                        'name' => $leadData['ad_name'] ?? 'Anuncio de Formulario',
                        'status' => 'ACTIVE',
                        'business_id' => $businessJpa->id
                    ]);
                }

                $fullName = $fieldData['full_name'] ?? $fieldData['nombre_completo'] ?? $fieldData['nombre'] ?? 'Sin nombre';
                $phone = $fieldData['phone_number'] ?? $fieldData['telefono'] ?? $fieldData['movil'] ?? '';
                $email = $fieldData['email'] ?? $fieldData['correo'] ?? null;

                if ($clientJpa) {
                    // Actualizar atribución para lead existente sin campaña
                    $clientJpa->update([
                        'campaign_id' => $campaignJpa->id,
                        'adset_name' => $adSetJpa->name,
                        'ad_name' => $leadData['ad_name'] ?? $adIdClean,
                        'source' => 'Meta',
                        'origin' => $originName,
                        'lead_origin' => $originName,
                        'triggered_by' => "Formulario {$originName}",
                        'source_channel' => "{$originName} Form"
                    ]);
                    Log::info('Existing lead updated via Form', ['client_id' => $clientJpa->id]);
                } else {
                    // Create new client
                    $clientJpa = Client::create([
                        'integration_id' => $integrationJpa->id,
                        'integration_user_id' => $leadData['id'] ?? $leadgenId,
                        'business_id' => $businessJpa->id,
                        'name' => $fullName,
                        'contact_name' => $fullName,
                        'contact_phone' => Text::keep($phone, '0123456789'),
                        'contact_email' => $email,
                        'message' => 'Sin mensaje',
                        'source' => 'Meta',
                        'date' => Trace::getDate('date'),
                        'time' => Trace::getDate('time'),
                        'ip' => $request->ip(),
                        'status_id' => Setting::get('default-lead-status', $businessJpa->id),
                        'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
                        'origin' => $originName,
                        'lead_origin' => $originName,
                        'triggered_by' => "Formulario {$originName}",
                        'campaign_id' => $campaignJpa->id,
                        'adset_name' => $adSetJpa->name,
                        'ad_name' => $leadData['ad_name'] ?? $adIdClean,
                        'status' => true,
                        'complete_registration' => true,
                        'source_channel' => "{$originName} Form"
                    ]);
                    Log::info('New lead created from Form', ['client_id' => $clientJpa->id]);
                }

                // Build form answers note, ignoring full_name, phone_number and email
                $formString = "<b>Formulario {$originName} Forms</b><br>";
                $questionIndex = 1;
                foreach ($leadData['field_data'] ?? [] as $field) {
                    $fieldName = $field['name'] ?? '';
                    // Skip ignored fields
                    if (in_array($fieldName, ['full_name', 'phone_number', 'email'])) {
                        continue;
                    }
                    $fieldValue = $field['values'][0] ?? '';
                    $formString .= $questionIndex . '. ' . $fieldName . '<br>&emsp;' . $fieldValue . '<br>';
                    $questionIndex++;
                }

                // Create note with form answers
                ClientNote::create([
                    'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                    'client_id' => $clientJpa->id,
                    'name' => "Formulario {$originName} Forms",
                    'description' => $formString,
                ]);
                Log::info('Lead created and note added');

                return;
            };
            $messaging = $entry['messaging'][0] ?? [];

            if ($origin == 'whatsapp') {
                if (!isset($entry['changes'][0]['value']['messages'][0])) {
                    Log::info('Whatsapp event without messages, skipping');
                    return;
                }
                $message = $entry['changes'][0]['value']['messages'][0];
                $inOut = 'in';
                $waId = $message['from'];
                $messageId = $message['id'] ?? null;
                $messageType = $message['type'] ?? 'text';
                $messageContent = '';
                $mask = null;

                if ($messageType == 'text') {
                    $messageContent = $message['text']['body'] ?? '';
                } else {
                    $mediaId = $message[$messageType]['id'] ?? null;
                    $mask = $message[$messageType]['filename'] ?? null;
                    $caption = $message[$messageType]['caption'] ?? '';

                    if ($mediaId && $integrationJpa) {
                        $filename = $this->getAndSaveMediaFromMeta($integrationJpa, $mediaId, $messageType);
                        if ($filename) {
                            switch ($messageType) {
                                case 'image':
                                case 'video':
                                    $messageContent = trim("/image:{$filename}\n{$caption}");
                                    break;
                                case 'audio':
                                case 'voice':
                                    $messageContent = "/audio:{$filename}";
                                    break;
                                case 'document':
                                    $messageContent = trim("/document:{$filename}\n{$caption}");
                                    break;
                                default:
                                    $messageContent = "[Media: {$messageType}]";
                                    break;
                            }
                        } else {
                            $messageContent = "[Error al descargar media: {$messageType}]";
                        }
                    } else {
                        $messageContent = "[Media recibida: {$messageType}]";
                    }
                }
                $referral = $message['referral'] ?? null;
            } else {
                $inOut = $entry['id'] == $messaging['sender']['id'] ? 'out' : 'in';
                $waId = $inOut == 'in' ? $messaging['sender']['id'] : $messaging['recipient']['id'];
                $messageId = $messaging['message']['mid'] ?? null;
                $messageContent = $messaging['message']['text'] ?? '';
                $mask = null;

                // Handle Messenger/Instagram attachments if present
                if (isset($messaging['message']['attachments'][0])) {
                    $attachment = $messaging['message']['attachments'][0];
                    $type = $attachment['type'];
                    $url = $attachment['payload']['url'] ?? null;
                    if ($url) {
                        // For Messenger/Instagram, we could also download and save, 
                        // but for now let's just prefix it if it's an image.
                        if ($type == 'image') {
                            $messageContent = "/attachment:{$url}\n" . ($messageContent ?: 'Foto');
                        } else {
                            $messageContent = "/attachment:{$url}\n" . ($messageContent ?: 'Archivo');
                        }
                    }
                }
            }

            Log::info('Identifying event', [
                'inOut' => $inOut,
                'waId' => $waId,
                'messageContent' => $messageContent
            ]);

            $messageJpa = Message::create([
                'wa_id' => $waId,
                'role' => $inOut == 'in' ? 'Human' : 'AI',
                'message' => $messageContent,
                'mask' => $mask,
                'message_id' => $messageId,
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => $businessJpa->id
            ]);

            if ($inOut == 'out') {
                Log::info('Outgoing message recorded, processing finished');
                return;
            }

            if (!$integrationJpa) {
                $integrationJpa = Integration::updateOrCreate([
                    'meta_service' => $origin,
                    'meta_business_id' => $entry['id'],
                    'business_id' => $businessJpa->id,
                ]);
            } else {
                $integrationJpa->update(['meta_business_id' => $entry['id']]);
            }

            if (!$integrationJpa->meta_access_token) {
                Log::warning('Webhook abortado: La integración de ' . $origin . ' no tiene meta_access_token configurado.', ['business_id' => $businessJpa->id]);
                return;
            }

            switch ($origin) {
                case 'messenger':
                    $profileData = MetaController::getFacebookProfile($messaging['sender']['id'], $integrationJpa->meta_access_token, true);
                    $profileData['fullname'] = $profileData['first_name'] . ' ' . $profileData['last_name'];
                    break;
                case 'instagram':
                    $profileData = MetaController::getInstagramProfile($messaging['sender']['id'], $integrationJpa->meta_access_token, true);
                    $profileData['fullname'] = $profileData['first_name'] . ' ' . $profileData['last_name'];
                    break;
                case 'whatsapp':
                    $profileData = [
                        'id' => $entry['changes'][0]['value']['contacts'][0]['wa_id'],
                        'fullname' => $entry['changes'][0]['value']['contacts'][0]['profile']['name'],
                    ];
                    break;
                case 'forms':
                    $profileData = MetaController::getMetaProfile($messaging['sender']['id'], $integrationJpa->meta_access_token, true);
                    $profileData['fullname'] = $profileData['first_name'] . ' ' . $profileData['last_name'];
                    break;
                default:
                    $profileData = MetaController::getFacebookProfile($messaging['sender']['id'], $integrationJpa->meta_access_token, true);
                    $profileData['fullname'] = $profileData['first_name'] . ' ' . $profileData['last_name'];
                    break;
            }

            $referralData = null;
            if (isset($referral['source_id'])) {
                $token = $integrationJpa->meta_access_token;
                if (!$token) {
                    $formsIntegration = Integration::query()
                        ->where('business_id', $businessJpa->id)
                        ->where('meta_service', 'forms')
                        ->where('status', true)
                        ->first();
                    $token = $formsIntegration->meta_access_token ?? null;
                }

                if ($token) {
                    try {
                        $adId = preg_replace('/^[a-z]+:/i', '', $referral['source_id']);
                        $facebookGraphUrl = config('services.meta.facebook_graph_url', 'https://graph.facebook.com/v19.0');
                        $adRes = new Fetch("{$facebookGraphUrl}/{$adId}?" . http_build_query([
                            'fields' => 'name,adset{id,name},campaign{id,name}',
                            'access_token' => $token
                        ]));
                        $referralData = $adRes->json();
                    } catch (\Exception $e) {
                        Log::error('Error fetching referral ad data', ['error' => $e->getMessage()]);
                    }
                }
            }

            $alreadyExists = Client::query()
                ->where('business_id', $businessJpa->id)
                ->where(function ($q) use ($profileData) {
                    $q->where('contact_phone', 'like', '%' . $profileData['id'] . '%')
                      ->orWhere('integration_user_id', $profileData['id']);
                })
                ->where('status', true)
                ->first();

            // Si el cliente existe, ya no hacemos "return" prematuro aquí, 
            // permitiendo que el sistema actualice su integration_id al nuevo canal (WhatsApp)

            $hasApikey = Setting::get('gemini-api-key', $businessJpa->id);

            $preClient = [
                'message' => $messaging['message']['text'] ?? 'Sin mensaje',
                'contact_name' => $profileData['fullname'],
                'contact_phone' => $origin == 'whatsapp' ? $profileData['id'] : null,
                'name' => $profileData['fullname'],
                'source' => 'Organico',
                'date' => Trace::getDate('date'),
                'time' => Trace::getDate('time'),
                'ip' => $request->ip(),
                'status_id' => Setting::get('default-lead-status', $businessJpa->id),
                'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
                'origin' => Text::toTitleCase($origin),
                'triggered_by' => 'Whatsapp API',
                'status' => true,
                'complete_registration' => false,
            ];

            if (!$alreadyExists) {
                $preClient['last_message'] = $messageJpa->message;
                $preClient['last_message_microtime'] = $messageJpa->microtime;
            }

            if ($referralData && !isset($referralData['error'])) {
                $rawCampaignId = $referralData['campaign']['id'] ?? 'external';
                $cleanCampaignId = trim(preg_replace('/^[a-z]+:/i', '', $rawCampaignId));
                
                $campaignJpa = Campaign::updateOrCreate([
                    'business_id' => $businessJpa->id,
                    'code' => $cleanCampaignId
                ], [
                    'title' => $referralData['campaign']['name'] ?? 'Campaña WhatsApp Ads',
                    'source' => strtolower($origin)
                ]);

                // Registrar AdSet
                $adSetId = preg_replace('/^[a-z]+:/i', '', $referralData['adset']['id'] ?? '');
                $adSetJpa = \App\Models\AdSet::updateOrCreate([
                    'campaign_id' => $campaignJpa->id,
                    'meta_id' => $adSetId
                ], [
                    'name' => $referralData['adset']['name'] ?? 'Conjunto de anuncios WhatsApp',
                    'status' => 'ACTIVE',
                    'business_id' => $businessJpa->id
                ]);

                // Registrar Ad
                $adIdClean = preg_replace('/^[a-z]+:/i', '', $referralData['id'] ?? $referralData['ad_id'] ?? '');
                if ($adIdClean) {
                    \App\Models\Ad::updateOrCreate([
                        'ad_set_id' => $adSetJpa->id,
                        'meta_id' => $adIdClean
                    ], [
                        'name' => $referralData['name'] ?? 'Anuncio de WhatsApp',
                        'status' => 'ACTIVE',
                        'business_id' => $businessJpa->id
                    ]);
                }

                $preClient['campaign_id'] = $campaignJpa->id;
                $preClient['adset_name'] = $referralData['adset']['name'] ?? null;
                $preClient['ad_name'] = $referralData['name'] ?? null;
                $preClient['triggered_by'] = 'Click to WhatsApp';
                $preClient['source'] = 'Meta';
                
                // Detectar plataforma (FB o IG) desde la URL de referral
                $platform = 'Facebook';
                $sourceUrl = $referral['source_url'] ?? '';
                if (str_contains($sourceUrl, 'instagram.com')) {
                    $platform = 'Instagram';
                }

                $preClient['origin'] = $platform; 
                $preClient['lead_origin'] = $platform;
                $preClient['source_channel'] = "WhatsApp Ad ({$platform})";

                // Guardar información del anuncio en una nota para que la IA tenga contexto
                $adContext = "<b>Origen: Anuncio Click to WhatsApp</b><br>";
                $adContext .= "<b>Campaña:</b> " . ($referralData['campaign']['name'] ?? 'Desconocida') . "<br>";
                $adContext .= "<b>Anuncio:</b> " . ($referralData['name'] ?? 'Desconocido') . "<br>";
                if (isset($referral['body'])) {
                    $adContext .= "<b>Texto del anuncio:</b> " . $referral['body'] . "<br>";
                }

                $preClient['ad_context_note'] = $adContext; // Usaremos esto después del create
            }

            if ($alreadyExists) {
                // Actualizar cliente existente protegiendo su origen original
                $updateData = [
                    'integration_id' => $integrationJpa->id,
                    'integration_user_id' => $profileData['id'],
                    'status' => true
                ];

                // Solo si el cliente actual no tiene una campaña y ahora nos escribe DESDE un anuncio (referral),
                // permitimos actualizar la atribución. Si ya tenía una campaña, respetamos la primera.
                if (!$alreadyExists->campaign_id && isset($preClient['campaign_id'])) {
                    $updateData['campaign_id'] = $preClient['campaign_id'];
                    $updateData['adset_name'] = $preClient['adset_name'];
                    $updateData['ad_name'] = $preClient['ad_name'];
                    $updateData['triggered_by'] = $preClient['triggered_by'];
                    $updateData['source'] = $preClient['source'];
                    $updateData['origin'] = $preClient['origin'];
                    $updateData['lead_origin'] = $preClient['lead_origin'];
                    $updateData['source_channel'] = $preClient['source_channel'];
                }

                $alreadyExists->update($updateData);
                $clientJpa = $alreadyExists;
                Log::info('Lead omnicanal actualizado exitosamente', ['client_id' => $clientJpa->id, 'phone' => $profileData['id']]);
            } else {
                // Crear cliente totalmente nuevo
                $clientJpa = Client::create(array_merge([
                    'integration_id' => $integrationJpa->id,
                    'integration_user_id' => $profileData['id'],
                    'business_id' => $businessJpa->id,
                ], $preClient));
                Log::info('Nuevo lead creado desde WhatsApp', ['client_id' => $clientJpa->id, 'phone' => $profileData['id']]);
            }

            $hasApikey = Setting::get('gemini-api-key', $businessJpa->id);

            if ($hasApikey && !$clientJpa->complete_registration) {
                // Si es un lead de anuncio, le ponemos la nota de contexto antes de que Gemini responda
                if (isset($preClient['ad_context_note'])) {
                    \App\Models\ClientNote::create([
                        'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211', // Tipo 'Nota'
                        'client_id' => $clientJpa->id,
                        'name' => 'Contexto de Anuncio Meta',
                        'description' => $preClient['ad_context_note'],
                    ]);
                }
                MetaAssistantJob::dispatchAfterResponse($clientJpa, $messageJpa, $origin);
            }

            if ($alreadyExists) return;
            $noteJpa = ClientNote::create([
                'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                'client_id' => $clientJpa->id,
                'name' => 'Lead nuevo',
                'description' => UtilController::replaceData(
                    Setting::get('whatsapp-new-lead-notification-message', $clientJpa->business_id),
                    $clientJpa->toArray()
                )
            ]);

            Task::create([
                'model_id' => ClientNote::class,
                'note_id' => $noteJpa->id,
                'name' => 'Revisar lead',
                'description' => 'Debes revisar los requerimientos del lead',
                'ends_at' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'status' => 'Pendiente',
                'asignable' => true
            ]);
            } catch (\Throwable $th) {
                Log::error('Error crítico no manejado en Meta Webhook: ' . $th->getMessage(), [
                    'file' => $th->getFile(),
                    'line' => $th->getLine()
                ]);
                throw $th;
            }
        });
        return response($response->toArray(), 200);
    }

    public function exchangeToken(Request $request)
    {
        $request->validate([
            'short_token' => 'required',
            'app_id' => 'required',
            'app_secret' => 'required'
        ]);

        $integration = $request->integration_id ? Integration::find($request->integration_id) : null;
        
        $facebookGraphUrl = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v20.0');
        
        $url = "{$facebookGraphUrl}/oauth/access_token?" . http_build_query([
            'grant_type' => 'fb_exchange_token',
            'client_id' => $request->app_id,
            'client_secret' => $request->app_secret,
            'fb_exchange_token' => $request->short_token
        ]);

        try {
            $response = file_get_contents($url);
            $data = json_decode($response, true);

            if (isset($data['access_token'])) {
                if ($integration) {
                    $integration->update([
                        'meta_access_token' => $data['access_token'],
                        'meta_app_id' => $request->app_id,
                        'meta_app_secret' => $request->app_secret
                    ]);
                }
                return response()->json([
                    'status' => 'success', 
                    'message' => $integration ? 'Token de larga duración generado y guardado correctamente' : 'Token de larga duración generado correctamente', 
                    'token' => $data['access_token']
                ]);
            }

            return response()->json([
                'status' => 'error', 
                'message' => 'No se pudo generar el token: ' . ($data['error']['message'] ?? 'Error desconocido')
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Error de conexión con Meta: ' . $e->getMessage()
            ], 500);
        }
    }

    public function syncMetaHierarchy(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = \Illuminate\Support\Facades\Auth::user()->business_id;

            $integrationJpa = Integration::query()
                ->where('business_id', $businessId)
                ->where('meta_service', 'forms')
                ->where('status', true)
                ->first();

            if (!$integrationJpa) {
                throw new Exception('No hay una integración de Meta activa (Forms) para este negocio');
            }

            // meta_app_token: ads_management/ads_read permissions
            // meta_access_token: fallback (leads_retrieval)
            $token = $integrationJpa->meta_app_token ?? $integrationJpa->meta_access_token;
            if (!$token) {
                throw new Exception('Configure el App Token en la integración para sincronizar campañas.');
            }

            $facebookGraphUrl = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
            $syncedCount = 0;

            // meta_access_token: discovers ad accounts (it has user-level authority)
            // meta_app_token: reads campaign hierarchy (has ads_management permissions)
            $discoveryToken  = $integrationJpa->meta_access_token;
            $campaignToken   = $integrationJpa->meta_app_token ?? $discoveryToken;

            // STEP 1: Determine which ad accounts to sync
            // Priority: use stored meta_ad_account_id, fallback to /me/adaccounts discovery
            if ($integrationJpa->meta_ad_account_id) {
                $rawId = trim($integrationJpa->meta_ad_account_id);
                $cleanId = str_starts_with($rawId, 'act_') ? $rawId : 'act_' . $rawId;
                $adAccounts = [['id' => $cleanId]];
                Log::info('Using stored Ad Account ID', ['account' => $cleanId]);
            } else {
                Log::info('Fetching all ad accounts from Meta (no specific ID configured)');
                $adAccountsRes = new Fetch("{$facebookGraphUrl}/me/adaccounts?fields=id,name,account_status&limit=50", [
                    'headers' => ['Authorization' => 'Bearer ' . $discoveryToken]
                ]);
                $adAccountsData = $adAccountsRes->ok ? $adAccountsRes->json() : [];

                if (!$adAccountsRes->ok || isset($adAccountsData['error'])) {
                    throw new Exception('Error obteniendo cuentas publicitarias: ' . ($adAccountsData['error']['message'] ?? 'Respuesta de red inválida'));
                }

                $adAccounts = $adAccountsData['data'] ?? [];
            }

            Log::info('Ad accounts to sync', ['count' => count($adAccounts)]);

            if (empty($adAccounts)) {
                throw new Exception('No se encontraron cuentas publicitarias asociadas al token.');
            }

            // STEP 2: For each Ad Account, fetch campaigns with full hierarchy
            foreach ($adAccounts as $adAccount) {
                $adAccountId = $adAccount['id']; // already has 'act_' prefix

                Log::info('Sincronizando cuenta publicitaria', ['account' => $adAccountId]);

                $campaignsRes = new Fetch(
                    "{$facebookGraphUrl}/{$adAccountId}/campaigns?" . http_build_query([
                        'fields' => 'id,name,status,adsets{id,name,status,ads{id,name,status}}',
                        'limit'  => 100
                    ]),
                    ['headers' => ['Authorization' => 'Bearer ' . $campaignToken]]
                );
                $campaignsData = $campaignsRes->ok ? $campaignsRes->json() : [];

                if (!$campaignsRes->ok || isset($campaignsData['error'])) {
                    Log::error('Meta rechazó la consulta de campañas', [
                        'account' => $adAccountId,
                        'message' => $campaignsData['error']['message'] ?? 'Error de conexión'
                    ]);
                    continue;
                }

                foreach ($campaignsData['data'] ?? [] as $metaCampaign) {
                    // STEP 3: Upsert Campaign in local DB
                    $metaCampaignId = trim($metaCampaign['id']);
                    $campaignJpa = Campaign::updateOrCreate(
                        ['business_id' => $businessId, 'code' => $metaCampaignId],
                        [
                            'meta_id' => $metaCampaign['id'],
                            'title'   => $metaCampaign['name'],
                            'source'  => 'facebook',
                            'status'  => ($metaCampaign['status'] ?? '') === 'ACTIVE'
                        ]
                    );

                    // STEP 4: Upsert AdSets
                    foreach ($metaCampaign['adsets']['data'] ?? [] as $metaAdSet) {
                        $adSetJpa = AdSet::updateOrCreate(
                            ['business_id' => $businessId, 'meta_id' => $metaAdSet['id']],
                            [
                                'campaign_id' => $campaignJpa->id,
                                'name'        => $metaAdSet['name'],
                                'status'      => $metaAdSet['status'] ?? null
                            ]
                        );

                        // STEP 5: Upsert Ads
                        foreach ($metaAdSet['ads']['data'] ?? [] as $metaAd) {
                            Ad::updateOrCreate(
                                ['business_id' => $businessId, 'meta_id' => $metaAd['id']],
                                [
                                    'ad_set_id' => $adSetJpa->id,
                                    'name'      => $metaAd['name'],
                                    'status'    => $metaAd['status'] ?? null
                                ]
                            );
                        }
                    }

                    $syncedCount++;
                    Log::info('Campaña sincronizada', ['campaign' => $metaCampaign['name'], 'id' => $metaCampaign['id']]);
                }

                // Sincronización masiva de TODAS las métricas y creatividades para esta cuenta publicitaria
                try {
                    Log::info('Iniciando sincronización masiva de métricas y formularios para la cuenta', ['account' => $adAccountId]);
                    \App\Http\Controllers\CampaignController::syncAllMetricsForAdAccount($businessId, $adAccountId, $campaignToken);
                    Log::info('Sincronización masiva completada');
                } catch (\Exception $e) {
                    Log::error('Error en sincronización masiva de métricas', ['account' => $adAccountId, 'error' => $e->getMessage()]);
                }
            }

            return "Se sincronizaron {$syncedCount} campañas desde Meta con éxito.";
        });
        return response($response->toArray(), $response->status);
    }


    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $clientId = $request->input('client_id');
            $message = $request->input('message');

            // Get client with their business ID
            $clientJpa = Client::query()
                ->where('id', $clientId)
                ->where('status', true)
                ->first();

            if (!$clientJpa) throw new Exception('Client not found');

            // Get integration details
            $integrationJpa = Integration::query()
                ->where('id', $clientJpa->integration_id)
                ->where('business_id', $clientJpa->business_id)
                ->where('status', true)
                ->first();

            if (!$integrationJpa) throw new Exception('Integration not found');
            if (!$integrationJpa->meta_access_token) throw new Exception('Access token not found');

            // Determine API URL based on meta service
            $baseUrl = $integrationJpa->meta_service === 'instagram'
                ? env('INSTAGRAM_GRAPH_URL')
                : env('FACEBOOK_GRAPH_URL');

            // Send message
            $messageEndpoint = "{$baseUrl}/me/messages";
            $messageData = [
                'recipient' => ['id' => $clientJpa->integration_user_id],
                'message' => ['text' => $message]
            ];

            $sendRest = new Fetch($messageEndpoint, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => "Bearer {$integrationJpa->meta_access_token}"
                ],
                'body' => $messageData
            ]);

            $result = $sendRest->json();

            if (isset($result['error'])) {
                throw new Exception('Failed to send message: ' . $result['error']['message']);
            }

            // Store message in database
            Message::create([
                'wa_id' => $clientJpa->integration_user_id,
                'role' => 'AI',
                'message' => $message,
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => $clientJpa->business_id
            ]);

            return $result;
        });
        return response($response->toArray(), $response->status);
    }

    private static function timeToSleep(string $message): int
    {
        // Contar palabras (usando str_word_count para separar correctamente)
        $numPalabras = str_word_count($message);

        // Velocidad promedio: 2.5 palabras/segundo → 400ms por palabra
        $tiempoBase = $numPalabras * 400;

        // Aleatoriedad ±0–500ms
        $random = rand(-500, 500);

        // Calcular total en milisegundos
        $tiempo = $tiempoBase + $random;

        // Limitar entre 0ms y 30000ms (30s)
        $tiempo = max(0, min($tiempo, 30000));

        return $tiempo;
    }

    public static function sendWithOrigin(Business $businessJpa, Client $clientJpa, string $message, string $prompt2save, ?string $origin = null)
    {
        if ($origin == 'evoapi') {
            new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $businessJpa->person->document_number, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'apikey' => $businessJpa->uuid
                ],
                'body' => [
                    'number' => $clientJpa->contact_phone,
                    'text' => Text::html2wa($message),
                    'delay' => self::timeToSleep($message)
                ]
            ]);
        } else {
            // Send message through Meta integration
            $integrationJpa = Integration::find($clientJpa->integration_id);

            if ($integrationJpa && $integrationJpa->meta_access_token) {
                if ($integrationJpa->meta_service === 'whatsapp') {
                    // WhatsApp Cloud API v22.0
                    $messageEndpoint = env('FACEBOOK_GRAPH_URL') . "/{$integrationJpa->meta_number_id}/messages";
                    $messageData = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $clientJpa->contact_phone,
                        'type' => 'text',
                        'text' => ['body' => Text::html2wa($message)]
                    ];
                } else {
                    // Messenger / Instagram
                    $baseUrl = $integrationJpa->meta_service === 'instagram'
                        ? env('INSTAGRAM_GRAPH_URL')
                        : env('FACEBOOK_GRAPH_URL');

                    $messageEndpoint = "{$baseUrl}/me/messages";
                    $messageData = [
                        'recipient' => ['id' => $clientJpa->integration_user_id],
                        'message' => ['text' => Text::html2wa($message)]
                    ];
                }

                new Fetch($messageEndpoint, [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Authorization' => "Bearer {$integrationJpa->meta_access_token}"
                    ],
                    'body' => $messageData
                ]);
            }
        }

        // Store message in database
        Message::create([
            'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
            'role' => 'AI',
            'message' => Text::html2wa($message),
            'prompt' => $prompt2save,
            'microtime' => (int) (microtime(true) * 1_000_000),
            'business_id' => $clientJpa->business_id
        ]);
    }

    private static function getFlowItems($businessId)
    {
        $raw = Setting::get('gemini-extra-questions', $businessId);
        if (!$raw || !is_string($raw)) return [null, false];

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) return [null, false];

        return count($decoded) > 0
            ? [array_values($decoded), true]
            : [null, false];
    }

    private static function runFlow(Business $businessJpa, Client $clientJpa, ?string $origin = null, string $prompt2save = '', string $prefix = '')
    {
        $flowItems = $clientJpa->form_answers ?? [];
        $hasIncompleteItems = false;
        $firstMessageSent = false;

        foreach ($flowItems as $index => &$item) {
            if ($item['completed'] ?? false) continue;

            $hasIncompleteItems = true;

            if ($item['type'] === 'form') {
                if (isset($item['questions']) && is_array($item['questions']) && count($item['questions']) > 0) {
                    // Send first question
                    $question = $item['questions'][0];
                    $welcomeMessage = ($firstMessageSent ? '' : $prefix) . $question['text'];
                    if ($question['closed'] ?? false) {
                        try {
                            foreach ($question['answers'] as $aIdx => $value) {
                                $welcomeMessage .= Text::lineBreak() . ($aIdx + 1) . ". {$value}";
                            }
                        } catch (\Throwable $th) {
                        }
                    }

                    Message::create([
                        'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                        'role' => 'Form',
                        'message' => 'Formulario: ' . $item['title'],
                        'microtime' => (int) (microtime(true) * 1_000_000),
                        'business_id' => $clientJpa->business_id
                    ]);

                    self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, $prompt2save, $origin);
                    break; // STOP here, wait for user response
                } else {
                    $item['completed'] = true; // Skip empty form
                }
            } else if ($item['type'] === 'default_message') {
                $msgId = $item['message_id'] ?? null;
                $defaultMsg = \App\Models\DefaultMessage::find($msgId);
                if ($defaultMsg) {
                    $text = ($firstMessageSent ? '' : $prefix) . strip_tags($defaultMsg->description);
                    self::sendWithOrigin($businessJpa, $clientJpa, $text, $prompt2save, $origin);
                    $firstMessageSent = true;
                    $prefix = '';
                }
                $item['completed'] = true;
            } else if ($item['type'] === 'repository' || $item['type'] === 'file') {
                $fileId = $item['file_id'] ?? null;
                $repoFile = \App\Models\Repository::find($fileId);
                if ($repoFile) {
                    $domain = env('APP_URL');
                    $fileUrl = $domain . '/storage/' . $repoFile->file;
                    $msg = ($firstMessageSent ? '' : $prefix) . "Enviando archivo: {$repoFile->name}" . Text::lineBreak() . $fileUrl;
                    self::sendWithOrigin($businessJpa, $clientJpa, $msg, $prompt2save, $origin);
                    $firstMessageSent = true;
                    $prefix = '';
                }
                $item['completed'] = true;
            } else {
                $item['completed'] = true; // Skip unknown type
            }
        }

        $clientJpa->update([
            'form_answers' => $flowItems,
            'complete_form' => !$hasIncompleteItems
        ]);

        if (!$hasIncompleteItems) {
            $welcomeMessage = Setting::get('whatsapp-new-lead-notification-message-client', $clientJpa->business_id);
            if (!$welcomeMessage) {
                $welcomeMessage = "¡Gracias! Tu información ha sido registrada exitosamente. Un asesor se pondrá en contacto contigo pronto.";
            }
            $clientData = $clientJpa->toArray();
            unset($clientData['form_answers']);
            $welcomeMessage = Text::replaceData($welcomeMessage, $clientData);
            self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, $prompt2save, $origin);

            Message::create([
                'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                'role' => 'Form',
                'message' => '✓ Formulario completado',
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => $clientJpa->business_id
            ]);

            // Save notes
            $formString = '';
            foreach ($flowItems as $f) {
                if ($f['type'] !== 'form') continue;
                $formString .= "<b>{$f['title']}</b><br>";
                foreach ($f['questions'] as $qIdx => $question) {
                    $ans = $question['answer'] ?? 'N/A';
                    $formString .= ($qIdx + 1) . ". {$question['text']}<br>&emsp;{$ans}<br>";
                }
                $formString .= '<br>';
            }
            ClientNote::create([
                'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                'client_id' => $clientJpa->id,
                'name' => 'Respuesta de formulario',
                'description' => $formString
            ]);
        }
    }

    public static function assistant(Client $clientJpa, Message $messageJpa, ?string $origin = null)
    {
        try {
            while (true) {
                /*
                // Get latest message for this client
                $latestMessage = Message::query()
                    ->where('wa_id', $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id)
                    ->where('business_id', $clientJpa->business_id)
                    ->orderBy('microtime', 'desc')
                    ->first();

                // If latest message is different from current message, stop processing
                if ($latestMessage->id !== $messageJpa->id) {
                    break;
                }

                // Calculate time difference in seconds
                $timeDiff = (microtime(true) * 1_000_000 - $latestMessage->microtime) / 1_000_000;

                // If less than 10 seconds have passed, wait and continue checking
                if ($timeDiff < 15) {
                    sleep(5);
                    continue;
                }

                // Check if registration is already complete
                if ($clientJpa->complete_registration) {
                    break;
                }
                */

                // Get last 40 messages
                $messagesQuery = Message::query()
                    ->where('wa_id', $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id)
                    ->where('business_id', $clientJpa->business_id)
                    ->orderBy('microtime', 'desc');

                if ($clientJpa->complete_registration) {
                    $waId = $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id;
                    $lastMessageMicrotime = Message::where('role', 'Form')
                        ->where('wa_id', $waId)
                        ->where('business_id', $clientJpa->business_id)
                        ->orderBy('microtime', 'desc')
                        ->value('microtime');
                    if ($lastMessageMicrotime) {
                        $messagesQuery->where('microtime', '>', $lastMessageMicrotime);
                    }
                }

                $messages = $messagesQuery->limit(40)
                    ->get();

                // Get Gemini API key from settings
                $apiKey = Setting::get('gemini-api-key', $clientJpa->business_id);

                $businessJpa = Business::with(['person'])
                    ->where('id', $clientJpa->business_id)
                    ->first();

                $businessEmail = Setting::get('email-new-lead-notification-message-owneremail', $businessJpa->id);
                $businessServices = Setting::get('gemini-what-business-do', $businessJpa->id);
                $personalidad = Setting::get('gemini-personality', $clientJpa->business_id);

                $prompt = File::get('../storage/app/utils/gemini-prompt.txt');
                $prompt = Text::replaceData($prompt, [
                    'nombreEmpresa' => $businessJpa->name,
                    'correoEmpresa' => $businessEmail ?? 'hola@mundoweb.pe',
                    'servicios' => $businessServices ?? 'algunos servicios',
                    'personalidad' => $personalidad ? Text::lineBreak() . 'Personalidad General: ' . $personalidad . Text::lineBreak() : Text::lineBreak()
                ]);

                $messagesList = [];
                foreach ($messages->sortBy('microtime') as $msg) {
                    $messagesList[] = [
                        'parts' => [['text' => $msg->message]],
                        'role' => $msg->role == 'Human' ? 'user' : 'model'
                    ];
                }
                $formId = null;
                if ($clientJpa->complete_registration) {
                    $forms = $clientJpa->form_answers;
                    $targetForm = null;
                    foreach ($forms as $form) {
                        $completed = $form['completed'] ?? false;
                        if (!$completed) {
                            $targetForm = $form;
                            break;
                        }
                    }
                    if (!$targetForm) break;
                    $formId = $targetForm['id'];
                    $properties = [];
                    foreach ($targetForm['questions'] as $index => $question) {
                        $paramName = 'answer_' . ($index + 1);
                        $properties[$paramName] = [
                            "type" => "string",
                            "description" => $question['text'] . ($question['closed'] ? ' (Pregunta cerrada: Respuestas admitidas →  ' . implode(', ', array_map(fn($k, $v) => ($k + 1) . '. ' . $v, array_keys($question['answers']), $question['answers'])) . ')' : '')
                        ];
                    }
                    $functionToCall = 'saveFormAnswers';
                    $functionToCallDescription = 'Guarda las respuestas del formulario de registro de ' . $businessJpa->name;
                } else {
                    $properties = [
                        "nombreCliente" => [
                            "type" => "string",
                            "description" => "Nombre completo del cliente."
                        ],
                        "correoCliente" => [
                            "type" => "string",
                            "description" => "Correo electrónico del cliente."
                        ],
                        "fuenteCliente" => [
                            "type" => "string",
                            "description" => "Fuente de referencia, muestralo como lista enumerada. Opciones válidas: Google, Facebook, Instagram, TikTok, Por un amigo, Otros (detalle exacto)."
                        ]
                    ];
                    if ($origin !== 'whatsapp') {
                        $properties['telefonoCliente'] = [
                            "type" => "string",
                            "description" => "Número de teléfono del cliente incluyendo el código de área."
                        ];
                    }
                    $functionToCall = 'saveClientData';
                    $functionToCallDescription = 'Guarda la información del cliente que desea registrarse con ' . $businessJpa->name;
                }
                $body = [
                    "system_instruction" => [
                        "parts" => [["text" => $prompt]]
                    ],
                    "contents" => $messagesList,
                    "tools" => [["functionDeclarations" => [
                        [
                            "name" => $functionToCall,
                            "description" => $functionToCallDescription,
                            "parameters" => [
                                "type" => "object",
                                "properties" => $properties,
                                "required" => array_keys($properties)
                            ]
                        ]
                    ]]]
                ];

                \Illuminate\Support\Facades\Log::info('Sending request to Gemini', [
                    'client_id' => $clientJpa->id,
                    'messages_count' => count($messagesList),
                    'last_message' => end($messagesList),
                    'function_to_call' => $functionToCall
                ]);

                $attempts = 0;
                $maxAttempts = 3;
                $geminiResponse = null;

                do {
                    $geminiRest = new Fetch(env('GEMINI_API_URL'), [
                        'method' => 'POST',
                        'headers' => [
                            'Content-Type' => 'application/json',
                            'X-goog-api-key' => $apiKey
                        ],
                        'body' => $body
                    ]);
                    $geminiResponse = $geminiRest->json();

                    \Illuminate\Support\Facades\Log::info('Gemini Response received', [
                        'client_id' => $clientJpa->id,
                        'response' => $geminiResponse
                    ]);

                    if (isset($geminiResponse['error']['message'])) {
                        throw new \Exception($geminiResponse['error']['message']);
                    }

                    $answer = $geminiResponse['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    $function = $geminiResponse['candidates'][0]['content']['parts'][0]['functionCall'] ?? null;
                    $function_name = $function['name'] ?? null;

                    // Check if response starts with "print(default_api."
                    if ($answer && strpos(trim($answer), 'print(default_api.') === 0) {
                        $attempts++;
                        if ($attempts >= $maxAttempts) {
                            // Save fallback message
                            $answer = 'Me podrías proporcionar la información nuevamente';
                            $function = null;
                            $function_name = null;
                            break;
                        }
                        // Retry
                        continue;
                    }
                    break;
                } while ($attempts < $maxAttempts);

                if ($function && $function_name == 'saveClientData') {
                    $prompt2save = JSON::stringify($body, true) . "/n/nFunction: " . JSON::stringify($function, true);
                    $data2Save = [
                        'contact_name' => $function['args']['nombreCliente'],
                        'contact_email' => $function['args']['correoCliente'],
                        'source_channel' => $function['args']['fuenteCliente'],
                        'complete_registration' => true
                    ];
                    if ($origin !== 'whatsapp') {
                        $data2Save['contact_phone'] = $function['args']['telefonoCliente'];
                    }

                    [$flowItems, $hasFlow] = self::getFlowItems($clientJpa->business_id);

                    if ($hasFlow) {
                        $data2Save['form_answers'] = $flowItems;
                        $data2Save['complete_form'] = false;
                    }

                    $clientJpa->update($data2Save);
                    $clientJpa->refresh();

                    if ($hasFlow) {
                        // Mensaje de transición simplificado
                        $firstName = explode(' ', trim($data2Save['contact_name']))[0];
                        $prefix = "¡Perfecto, {$firstName}! Continuemos con unas breves preguntas:" . Text::lineBreak(2);
                        // Iniciar flujo con el prefijo
                        self::runFlow($businessJpa, $clientJpa, $origin, $prompt2save, $prefix);
                    } else {
                        $welcomeMessage = Setting::get('whatsapp-new-lead-notification-message-client', $clientJpa->business_id);
                        $welcomeMessage = Text::replaceData($welcomeMessage, $clientJpa->toArray());
                        self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, $prompt2save, $origin);
                    }
                } else if ($function && $function_name == 'saveFormAnswers') {
                    $prompt2save = JSON::stringify($body, true) . Text::lineBreak(2) . "Function: " . JSON::stringify($function, true);
                    $formAnswers = $function['args'];

                    // Obtener formularios actuales
                    $forms = $clientJpa->form_answers ?? [];

                    // Buscar el formulario por formId y marcarlo como completado
                    foreach ($forms as $f_index => $form) {
                        if ($form['id'] == $formId) {
                            $forms[$f_index]['completed'] = true;

                            // Actualizar respuestas en cada pregunta
                            $questionIndex = 0;
                            foreach ($form['questions'] as $q_index => $question) {
                                $answerKey = 'answer_' . ($questionIndex + 1);
                                if (isset($formAnswers[$answerKey])) {
                                    $forms[$f_index]['questions'][$q_index]['answer'] = $formAnswers[$answerKey];
                                }
                                $questionIndex++;
                            }
                            break;
                        }
                    }

                    $clientJpa->update(['form_answers' => $forms]);
                    $clientJpa->refresh();
                    self::runFlow($businessJpa, $clientJpa, $origin, $prompt2save);
                } else if ($answer) {
                    $prompt2save = JSON::stringify($body, true) . Text::lineBreak(2) . "Output: " . $answer;
                    self::sendWithOrigin($businessJpa, $clientJpa, $answer, $prompt2save, $origin);
                }

                break;
            }
        } catch (\Throwable $th) {
            \Illuminate\Support\Facades\Log::error('Error in MetaController::assistant: ' . $th->getMessage(), [
                'exception' => $th,
                'client_id' => $clientJpa->id,
                'line' => $th->getLine()
            ]);
        }
    }

    /**
     * Search for commands enclosed in double curly braces and extract them
     * @param string $input The input string to search for commands
     * @return array Array containing found status, commands array and cleaned message
     */
    public static function searchCommand(string $input): array
    {
        try {
            $pattern = '/{{(.*?)}}/';
            preg_match_all($pattern, $input, $matches);

            $commands = !empty($matches[1]) ? $matches[1] : [];

            $cleanMessage = preg_replace($pattern, '', $input);

            return [
                'found' => count($commands) > 0,
                'commands' => $commands,
                'message' => trim($cleanMessage)
            ];
        } catch (\Exception $error) {
            return [
                'found' => false,
                'commands' => [],
                'message' => $input
            ];
        }
    }

    /**
     * Converts a pseudo-formatted string into an associative array
     * Format example: "field1: value1; field2: value2"
     * @param string $pseudo The pseudo-formatted string to convert
     * @param bool $clean Whether to strictly clean the values or just keep certain characters
     * @return array The resulting associative array
     */
    public static function pseudoToObject(string $pseudo, bool $clean = false): array
    {
        try {
            $result = [];

            // Split by semicolon and trim
            $pairs = array_map('trim', explode(';', trim($pseudo)));

            foreach ($pairs as $pair) {
                if (empty($pair)) continue;

                // Split each pair by colon
                if (preg_match('/(.+):(.+)/', $pair, $matches)) {
                    $field = trim($matches[1]);
                    $value = trim($matches[2]);

                    // Remove quotes if present
                    $value = trim($value, '"\'');

                    if ($clean) {
                        // Strict cleaning - only alphanumeric and spaces
                        $value = preg_replace('/[^a-zA-Z0-9\s]/', '', $value);
                    } else {
                        // Keep specific characters
                        $value = preg_replace(
                            '/[^a-zA-Z0-9\sÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛÑÇãàáäâèéëêìíïîòóöôùúüûñç@\-_.,]/',
                            '',
                            $value
                        );
                    }

                    $result[$field] = $value;
                }
            }

            return $result;
        } catch (\Exception $e) {
            return [];
        }
    }

    public function getAndSaveMediaFromMeta($integrationJpa, $mediaId, $type)
    {
        try {
            $accessToken = $integrationJpa->meta_access_token;
            if (!$accessToken) throw new Exception('Token de Meta no configurado');

            $facebookGraphUrl = env('FACEBOOK_GRAPH_URL');

            // 1. Obtener la URL de descarga
            $infoRes = new Fetch("{$facebookGraphUrl}/{$mediaId}", [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}"
                ]
            ]);

            if (!$infoRes->ok) throw new Exception('Error al obtener info del media: ' . $infoRes->text());

            $info = $infoRes->json();
            $downloadUrl = $info['url'] ?? null;
            $mimeType = $info['mime_type'] ?? '';

            if (!$downloadUrl) throw new Exception('No se encontró URL de descarga');

            // 2. Descargar el archivo
            $mediaRes = new Fetch($downloadUrl, [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}"
                ]
            ]);

            if (!$mediaRes->ok) throw new Exception('Error al descargar el archivo: ' . $mediaRes->text());

            $fileContent = $mediaRes->blob();

            // 3. Determinar extensión
            $cleanMimeType = explode(';', $mimeType)[0];
            $extension = File::getExtention($cleanMimeType);
            if ($extension == 'sode') $extension = 'bin';
            if ($extension == 'jpe') $extension = 'jpeg';

            // Guardar en /storage/app/images/whatsapp/
            $storagePath = storage_path('app/images/whatsapp');
            if (!is_dir($storagePath)) mkdir($storagePath, 0755, true);

            $savedFilename = $type . '-' . Crypto::short() . '.' . $extension;
            $fullPath = $storagePath . '/' . $savedFilename;
            file_put_contents($fullPath, $fileContent);

            return $savedFilename;
        } catch (\Throwable $th) {
            Log::error('Error in MetaController::getAndSaveMediaFromMeta: ' . $th->getMessage());
            return null;
        }
    }
}
