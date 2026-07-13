<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Integration;
use App\Models\Campaign;
use App\Models\AdSet;
use App\Models\Ad;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Setting;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class GoogleAdsController extends Controller
{
    private $client;

    public function __construct()
    {
        $this->client = new \Google\Client();
        $this->client->setAuthConfig(storage_path('app/google/credentials.json'));
        $this->client->setRedirectUri(route('google-ads.callback'));
        $this->client->addScope('https://www.googleapis.com/auth/adwords');
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function connect(Request $request)
    {
        $businessUuid = $request->query('state');
        if (!$businessUuid) {
            return response('Falta el parámetro de estado (state)', 400);
        }
        $this->client->setState($businessUuid);
        return redirect($this->client->createAuthUrl());
    }

    public function callback(Request $request)
    {
        try {
            $code = $request->query('code');
            $businessUuid = $request->query('state');

            if (!$code) {
                throw new \Exception('Falta el código de autorización de Google');
            }
            if (!$businessUuid) {
                throw new \Exception('Falta el parámetro de estado (UUID del negocio)');
            }

            $business = Business::where('uuid', $businessUuid)->first();
            if (!$business) {
                throw new \Exception('Negocio no encontrado');
            }

            $token = $this->client->fetchAccessTokenWithAuthCode($code);
            if (isset($token['error'])) {
                throw new \Exception('Error al intercambiar código: ' . ($token['error_description'] ?? $token['error']));
            }

            $accessToken = $token['access_token'] ?? null;
            $refreshToken = $token['refresh_token'] ?? null;

            if (!$accessToken) {
                throw new \Exception('No se recibió el access token de Google');
            }

            $accounts = [];
            $developerToken = env('GOOGLE_ADS_DEVELOPER_TOKEN') ?: Setting::get('google-ads-developer-token');
            
            if ($developerToken) {
                $url = "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers";
                $res = new Fetch($url, [
                    'method' => 'GET',
                    'headers' => [
                        'Authorization' => "Bearer {$accessToken}",
                        'developer-token' => $developerToken
                    ]
                ]);
                $listData = $res->json();
                
                if (isset($listData['resourceNames'])) {
                    foreach ($listData['resourceNames'] as $resName) {
                        $cId = str_replace('customers/', '', $resName);
                        $profileUrl = "https://googleads.googleapis.com/v17/customers/{$cId}/googleAds:search";
                        $profileRes = new Fetch($profileUrl, [
                            'method' => 'POST',
                            'headers' => [
                                'Authorization' => "Bearer {$accessToken}",
                                'developer-token' => $developerToken,
                                'Content-Type' => 'application/json'
                            ],
                            'body' => [
                                'query' => "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1"
                            ]
                        ]);
                        $profileData = $profileRes->json();
                        $custName = 'Cuenta de Google Ads ' . $cId;
                        if (isset($profileData['results'][0]['customer']['descriptiveName'])) {
                            $custName = $profileData['results'][0]['customer']['descriptiveName'];
                        }
                        $accounts[] = [
                            'id' => $cId,
                            'name' => $custName
                        ];
                    }
                }
            }

            $payload = base64_encode(json_encode([
                'service' => 'google-ads',
                'accounts' => $accounts,
                'user_token' => $refreshToken ?? $accessToken,
                'access_token' => $accessToken
            ]));

            return view('google_ads_callback', ['payload' => $payload]);

        } catch (\Throwable $th) {
            Log::error('Error en callback de Google Ads: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString()
            ]);
            return response('Error de autenticación con Google Ads: ' . $th->getMessage(), 500);
        }
    }

    public static function getCustomerProfile(string $customerId, string $refreshToken)
    {
        try {
            $cleanCustomerId = str_replace('-', '', $customerId);
            
            $developerToken = env('GOOGLE_ADS_DEVELOPER_TOKEN') ?: Setting::get('google-ads-developer-token');
            if (!$developerToken) {
                throw new \Exception('Falta configurar el Google Ads Developer Token en el servidor.');
            }
            
            $client = new \Google\Client();
            $client->setAuthConfig(storage_path('app/google/credentials.json'));
            $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);
            $accessToken = $token['access_token'] ?? null;
            
            if (!$accessToken) {
                throw new \Exception('No se pudo autenticar con Google. Token expirado o inválido.');
            }
            
            $url = "https://googleads.googleapis.com/v17/customers/{$cleanCustomerId}/googleAds:search";
            $res = new Fetch($url, [
                'method' => 'POST',
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                    'developer-token' => $developerToken,
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'query' => "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1"
                ]
            ]);
            
            $json = $res->json();
            
            if (isset($json['error'])) {
                $errorMsg = $json['error']['message'] ?? 'Error desconocido al obtener perfil';
                return ['error' => $errorMsg];
            }
            
            $results = $json['results'] ?? [];
            if (!empty($results)) {
                $customer = $results[0]['customer'];
                return [
                    'id' => $customer['id'],
                    'name' => $customer['descriptiveName'] ?? 'Cuenta de Google Ads',
                    'picture' => [
                        'data' => [
                            'url' => '/assets/img/google-ads.svg'
                        ]
                    ]
                ];
            }
            
            return ['error' => 'No se encontró la cuenta de Google Ads con el Customer ID especificado.'];
        } catch (\Throwable $e) {
            return ['error' => $e->getMessage()];
        }
    }

    public function webhook(Request $request, string $business_uuid)
    {
        $data = $request->all();
        
        Log::info('Google Ads webhook received', [
            'business_uuid' => $business_uuid,
            'payload' => $data
        ]);
        
        $business = Business::where('uuid', $business_uuid)
            ->where('status', true)
            ->first();
            
        if (!$business) {
            Log::error('Google Ads webhook error: business not found', ['uuid' => $business_uuid]);
            return response()->json(['error' => 'Business not found'], 404);
        }
        
        $expectedKey = $business_uuid;
        $receivedKey = $data['google_key'] ?? '';
        
        if ($expectedKey !== $receivedKey) {
            Log::error('Google Ads webhook error: google_key mismatch', [
                'expected' => $expectedKey,
                'received' => $receivedKey
            ]);
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $integration = Integration::where('meta_service', 'google-ads')
            ->where('business_id', $business->id)
            ->where('status', true)
            ->first();
            
        if (!$integration) {
            Log::error('Google Ads webhook error: integration not active', ['business_id' => $business->id]);
            return response()->json(['error' => 'Integration not active'], 404);
        }
        
        $columns = $data['user_column_data'] ?? [];
        $leadId = $data['lead_id'] ?? 'google_' . uniqid();
        $campaignId = $data['campaign_id'] ?? null;
        $adgroupId = $data['adgroup_id'] ?? null;
        $creativeId = $data['creative_id'] ?? null;
        
        $email = null;
        $phone = null;
        $fullName = null;
        $firstName = null;
        $lastName = null;
        $companyName = null;
        $formAnswers = [];
        
        foreach ($columns as $col) {
            $colId = $col['column_id'] ?? '';
            $colName = $col['column_name'] ?? '';
            $colVal = $col['string_value'] ?? '';
            
            $formAnswers[$colName] = $colVal;
            
            switch ($colId) {
                case 'EMAIL':
                case 'WORK_EMAIL':
                    if (empty($email)) $email = $colVal;
                    break;
                case 'PHONE_NUMBER':
                case 'WORK_PHONE':
                    if (empty($phone)) $phone = $colVal;
                    break;
                case 'FULL_NAME':
                    if (empty($fullName)) $fullName = $colVal;
                    break;
                case 'FIRST_NAME':
                    $firstName = $colVal;
                    break;
                case 'LAST_NAME':
                    $lastName = $colVal;
                    break;
                case 'COMPANY_NAME':
                    $companyName = $colVal;
                    break;
            }
        }
        
        if (empty($fullName)) {
            if (!empty($firstName) || !empty($lastName)) {
                $fullName = trim($firstName . ' ' . $lastName);
            } else {
                $fullName = 'Google User ' . substr($leadId, -6);
            }
        }
        
        if (!empty($phone)) {
            $phone = preg_replace('/\D/', '', $phone);
        } else {
            $phone = '';
        }
        
        $localCampaignId = null;
        if ($campaignId) {
            $campaign = Campaign::where('business_id', $business->id)
                ->where(function ($q) use ($campaignId) {
                    $q->where('code', $campaignId)
                      ->orWhere('meta_id', $campaignId);
                })
                ->first();
                
            if (!$campaign) {
                $campaign = Campaign::create([
                    'business_id' => $business->id,
                    'code' => $campaignId,
                    'meta_id' => $campaignId,
                    'source' => 'google-ads',
                    'title' => 'Campaña Google Ads ' . $campaignId,
                    'status' => true
                ]);
            }
            $localCampaignId = $campaign->id;
        }
        
        $adsetName = 'Ad Group ' . $adgroupId;
        $adName = 'Ad Creative ' . $creativeId;
        
        $client = Client::create([
            'integration_id' => $integration->id,
            'integration_user_id' => $leadId,
            'business_id' => $business->id,
            'name' => $fullName,
            'contact_name' => $fullName,
            'contact_phone' => $phone,
            'contact_email' => $email,
            'tradename' => $companyName,
            'message' => 'Lead capturado desde formulario de Google Ads.',
            'source' => 'Google Ads',
            'date' => date('Y-m-d'),
            'time' => date('H:i:s'),
            'status_id' => Setting::get('default-lead-status', $business->id),
            'manage_status_id' => Setting::get('default-manage-lead-status', $business->id),
            'origin' => 'Google Ads',
            'lead_origin' => 'google-ads',
            'source_channel' => 'Google Lead Form',
            'triggered_by' => 'Google Webhook',
            'status' => true,
            'complete_registration' => true,
            'complete_form' => true,
            'form_answers' => $formAnswers,
            'campaign_id' => $localCampaignId,
            'adset_name' => $adsetName,
            'ad_name' => $adName,
            'ip' => request()->ip() ?? '127.0.0.1'
        ]);
        
        $note = ClientNote::create([
            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
            'client_id' => $client->id,
            'name' => 'Lead Nuevo Google Ads',
            'description' => "Se ha recibido un nuevo cliente potencial de Google Ads.\nFormulario:\n" . json_encode($formAnswers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        ]);
        
        Task::create([
            'model_id' => ClientNote::class,
            'note_id' => $note->id,
            'name' => 'Revisar lead Google Ads',
            'description' => 'Debes revisar los requerimientos del lead capturado de Google Ads',
            'ends_at' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
            'status' => 'Pendiente',
            'asignable' => true
        ]);
        
        $hasApikey = Setting::get('gemini-api-key', $business->id);
        $firstMessage = Setting::get('gemini-first-message', $business->id);
        
        if ($hasApikey && $firstMessage && !empty($phone)) {
            try {
                $waIntegration = Integration::where('meta_service', 'whatsapp')
                    ->where('business_id', $business->id)
                    ->where('status', true)
                    ->first();
                if ($waIntegration) {
                    MetaController::sendWithOrigin($business, $client, $firstMessage, '', 'evoapi');
                }
            } catch (\Throwable $th) {
                Log::error('Error triggering welcome message: ' . $th->getMessage());
            }
        }
        
        return response()->json(['success' => true]);
    }

    public function queryGoogleAds(string $customerId, string $accessToken, string $developerToken, string $gaql)
    {
        $cleanCustomerId = str_replace('-', '', $customerId);
        $url = "https://googleads.googleapis.com/v17/customers/{$cleanCustomerId}/googleAds:search";
        
        $res = new Fetch($url, [
            'method' => 'POST',
            'headers' => [
                'Authorization' => "Bearer {$accessToken}",
                'developer-token' => $developerToken,
                'Content-Type' => 'application/json'
            ],
            'body' => [
                'query' => $gaql
            ]
        ]);
        
        $data = $res->json();
        if (isset($data['error'])) {
            throw new \Exception($data['error']['message'] ?? 'Error desconocido al consultar Google Ads API');
        }
        
        return $data['results'] ?? [];
    }

    public function syncGoogleAdsCampaigns(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = Auth::user()->business_id;
            
            $integration = Integration::where('meta_service', 'google-ads')
                ->where('business_id', $businessId)
                ->where('status', true)
                ->first();
                
            if (!$integration || !$integration->meta_access_token) {
                throw new \Exception('No hay una integración activa de Google Ads.');
            }
            
            $refreshToken = $integration->meta_app_token ?? $integration->meta_access_token;
            
            $developerToken = env('GOOGLE_ADS_DEVELOPER_TOKEN') ?: Setting::get('google-ads-developer-token');
            if (!$developerToken) {
                throw new \Exception('Falta configurar el Google Ads Developer Token.');
            }
            
            $customerId = $integration->meta_business_id;
            if (!$customerId) {
                throw new \Exception('No se ha configurado la cuenta publicitaria (Customer ID) de Google Ads.');
            }
            
            $client = new \Google\Client();
            $client->setAuthConfig(storage_path('app/google/credentials.json'));
            $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);
            $accessToken = $token['access_token'] ?? null;
            
            if (!$accessToken) {
                throw new \Exception('No se pudo obtener el token de acceso de Google Ads.');
            }
            
            // 1. Obtener Campañas
            $campaignGaql = "SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks FROM campaign";
            $campaignResults = $this->queryGoogleAds($customerId, $accessToken, $developerToken, $campaignGaql);
            
            // 2. Obtener Ad Groups (ad sets)
            $adGroupGaql = "SELECT campaign.id, ad_group.id, ad_group.name, ad_group.status, metrics.cost_micros, metrics.impressions, metrics.clicks FROM ad_group";
            $adGroupResults = $this->queryGoogleAds($customerId, $accessToken, $developerToken, $adGroupGaql);
            
            // 3. Obtener Ads
            $adGaql = "SELECT ad_group.id, ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status, metrics.cost_micros, metrics.impressions, metrics.clicks FROM ad_group_ad";
            $adResults = $this->queryGoogleAds($customerId, $accessToken, $developerToken, $adGaql);
            
            // 4. Registrar / actualizar campañas
            $localCampaignMap = [];
            foreach ($campaignResults as $row) {
                $c = $row['campaign'];
                $m = $row['metrics'] ?? [];
                
                $camp = Campaign::updateOrCreate([
                    'business_id' => $businessId,
                    'code' => $c['id']
                ], [
                    'meta_id' => $c['id'],
                    'title' => $c['name'],
                    'source' => 'google-ads',
                    'status' => ($c['status'] ?? 'ENABLED') === 'ENABLED',
                    'spend' => floatval(($m['costMicros'] ?? 0) / 1000000),
                    'impressions' => intval($m['impressions'] ?? 0),
                    'clicks' => intval($m['clicks'] ?? 0)
                ]);
                $localCampaignMap[$c['id']] = $camp->id;
            }
            
            // 5. Registrar / actualizar adgroups
            $localAdSetMap = [];
            foreach ($adGroupResults as $row) {
                $ag = $row['adGroup'];
                $cId = $row['campaign']['id'] ?? null;
                $m = $row['metrics'] ?? [];
                
                $localCampaignId = $localCampaignMap[$cId] ?? null;
                if (!$localCampaignId) continue;
                
                $adSet = AdSet::updateOrCreate([
                    'business_id' => $businessId,
                    'meta_id' => $ag['id']
                ], [
                    'campaign_id' => $localCampaignId,
                    'name' => $ag['name'],
                    'status' => $ag['status'] ?? 'ENABLED',
                    'spend' => floatval(($m['costMicros'] ?? 0) / 1000000)
                ]);
                $localAdSetMap[$ag['id']] = $adSet->id;
            }
            
            // 6. Registrar / actualizar ads
            foreach ($adResults as $row) {
                $ad = $row['adGroupAd']['ad'];
                $adStatus = $row['adGroupAd']['status'] ?? 'ENABLED';
                $agId = $row['adGroup']['id'] ?? null;
                $m = $row['metrics'] ?? [];
                
                $localAdSetId = $localAdSetMap[$agId] ?? null;
                if (!$localAdSetId) continue;
                
                Ad::updateOrCreate([
                    'business_id' => $businessId,
                    'meta_id' => $ad['id']
                ], [
                    'ad_set_id' => $localAdSetId,
                    'name' => $ad['name'] ?? 'Google Ad ' . $ad['id'],
                    'status' => $adStatus,
                    'spend' => floatval(($m['costMicros'] ?? 0) / 1000000),
                    'form_name' => 'Google Lead Form'
                ]);
            }
            
            return ['success' => true];
        });
        
        return response($response->toArray(), $response->status);
    }
}
