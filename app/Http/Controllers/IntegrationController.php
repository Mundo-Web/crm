<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use SoDe\Extend\Response;

class IntegrationController extends BasicController
{
    public $model = Integration::class;
    public $throwMediaError = true;
    public $softDeletion = true;

    public function beforeSave(Request $request)
    {
        $currentIntegration = Integration::query()
            ->where('meta_service', $request->service)
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true);

        if ($request->id) {
            $currentIntegration->where('id', '!=', $request->id);
        }

        if ($currentIntegration->exists()) throw new Exception('Ya tienes una integración activa con este servicio');

        $metaBusiness = ['error' => 'No se pudo obtener el perfil del negocio'];
        if ($request->service == 'messenger') {
            $metaBusiness = MetaController::getFacebookProfile($request->accountId, $request->accessToken);
        } else if ($request->service == 'instagram') {
            $metaBusiness = MetaController::getInstagramProfile($request->accountId, $request->accessToken);
        } else if ($request->service == 'whatsapp') {
            $metaBusiness = MetaController::getWhatsAppProfile($request->accountId, $request->accessToken);
        } else if ($request->service == 'forms') {
            $metaBusiness = MetaController::getMetaProfile($request->accountId, $request->accessToken);
        }

        $metaBusinessProfile = null;
        if (isset($metaBusiness['picture']['data']['url'])) {
            // Create directory if it doesn't exist
            $directory = storage_path('app/images/integration');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Get image content and generate filename
            $imageContent = file_get_contents($metaBusiness['picture']['data']['url']);
            $filename = $request->accountId . '.jpg';
            $fullPath = $directory . '/' . $filename;

            // Save image to storage
            file_put_contents($fullPath, $imageContent);

            $metaBusinessProfile =  $filename;
        }

        $integration = [
            'meta_service' => $request->service,
            'meta_business_id' => $metaBusiness['id'],
            'meta_number_id' => $request->service  === 'whatsapp' ? $request->phoneId : null,
            'meta_business_name' => $metaBusiness['name'] . (isset($metaBusiness['username']) ? ' (@' . $metaBusiness['username'] . ')' : ''),
            'meta_business_profile' => $metaBusinessProfile,
            'meta_access_token' => $request->accessToken,
            'meta_app_token' => $request->appToken ?? null,
            'meta_ad_account_id' => $request->adAccountId ?? null,
            'meta_app_id' => $request->meta_app_id ?? null,
            'meta_app_secret' => $request->meta_app_secret ?? null,
        ];

        $integrationJpa = Integration::query()
            ->where('meta_service', $request->service)
            ->where('business_id', Auth::user()->business_id)
            ->where('meta_business_id', $metaBusiness['id'])
            ->first();

        if ($integrationJpa) {
            $integration['id'] = $integrationJpa->id;
            $integration['status'] = true;
        }

        return $integration;
    }

    public function getProfile(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            if (!$request->service || !$request->accountId || !$request->accessToken) {
                throw new Exception('Missing required parameters');
            }

            $profile = [];
            if ($request->service == 'messenger') {
                $profile = MetaController::getFacebookProfile($request->accountId, $request->accessToken);
            } else if ($request->service == 'instagram') {
                $profile = MetaController::getInstagramProfile($request->accountId, $request->accessToken);
            } else if ($request->service == 'whatsapp') {
                $profile = MetaController::getWhatsAppProfile($request->accountId, $request->accessToken);
            } else if ($request->service == 'forms') {
                $profile = MetaController::getMetaProfile($request->accountId, $request->accessToken);
            } else {
                throw new Exception('Invalid service type');
            }

            return  $profile;
        });
        return response($response->toArray(), $response->status);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if ($request->service === 'whatsapp') {
            $wabaId = $jpa->meta_business_id;
            $accessToken = $jpa->meta_access_token;

            $res = new \SoDe\Extend\Fetch(config('services.meta.facebook_graph_url') . "/{$wabaId}/subscribed_apps", [
                'method' => 'POST',
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}"
                ]
            ]);

            $data = $res->json();

            if (!($data['success'] ?? false)) {
                $errorMsg = $data['error']['message'] ?? 'Error desconocido al suscribir WABA a la App';
                $errorCode = $data['error']['code'] ?? 0;

                // Delete the just-created integration so it doesn't stay in a broken state
                $jpa->forceDelete();

                throw new \Exception("❌ La App de Meta no está validada o el token no tiene permisos suficientes. [{$errorCode}] {$errorMsg}");
            }
        }

        if ($request->service === 'forms') {
            $pageId = $jpa->meta_business_id;
            $systemUserToken = $jpa->meta_access_token;

            $facebookGraphUrl = config('services.meta.facebook_graph_url', env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v20.0'));

            // PASO 1: Obtener el Page Access Token usando el System User Token
            \Illuminate\Support\Facades\Log::info('Meta Forms: Getting page access token', [
                'page_id' => $pageId
            ]);

            $getPageTokenUrl = "{$facebookGraphUrl}/{$pageId}?fields=access_token&access_token={$systemUserToken}";
            $pageTokenRes = new \SoDe\Extend\Fetch($getPageTokenUrl);
            $pageTokenData = $pageTokenRes->json();

            if (!isset($pageTokenData['access_token'])) {
                $errorMsg = $pageTokenData['error']['message'] ?? 'No se pudo obtener el Page Access Token';
                $errorCode = $pageTokenData['error']['code'] ?? 0;
                
                \Illuminate\Support\Facades\Log::error('Meta Forms: Failed to get page access token', [
                    'page_id' => $pageId,
                    'code' => $errorCode,
                    'message' => $errorMsg
                ]);

                // No eliminamos la integración, solo avisamos
                return $jpa;
            }

            $pageAccessToken = $pageTokenData['access_token'];

            // PASO 2: Vincular la App a la Página usando el Page Access Token
            \Illuminate\Support\Facades\Log::info('Meta Forms: Subscribing app to page', [
                'page_id' => $pageId
            ]);

            $res = new \SoDe\Extend\Fetch("{$facebookGraphUrl}/{$pageId}/subscribed_apps", [
                'method' => 'POST',
                'headers' => [
                    'Authorization' => "Bearer {$pageAccessToken}",
                    'Content-Type'  => 'application/json'
                ],
                'body' => ['subscribed_fields' => 'leadgen']
            ]);

            $data = $res->json();

            \Illuminate\Support\Facades\Log::info('Meta Forms subscribed_apps response', [
                'page_id' => $pageId,
                'response' => $data
            ]);

            if (!($data['success'] ?? false)) {
                $errorMsg = $data['error']['message'] ?? 'Error al vincular la App a la Página';
                $errorCode = $data['error']['code'] ?? 0;
                \Illuminate\Support\Facades\Log::warning('Meta Forms subscribed_apps failed', [
                    'code' => $errorCode,
                    'message' => $errorMsg
                ]);
                // No eliminamos la integración, solo avisamos. El token puede no tener permisos de suscripción
                // pero la integración puede seguir funcionando si el webhook ya estaba suscrito antes.
            }
        }

        return $jpa;
    }
}
