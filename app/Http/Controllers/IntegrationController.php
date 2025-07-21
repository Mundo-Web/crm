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
            ->where('status', true)
            ->exists();

        if ($currentIntegration) throw new Exception('Ya tienes una integración activa con este servicio');

        $metaBusiness = ['error' => 'No se pudo obtener el perfil del negocio'];
        if ($request->service == 'messenger') {
            $metaBusiness = MetaController::getFacebookProfile($request->accountId, $request->accessToken);
        } else if ($request->service == 'instagram') {
            $metaBusiness = MetaController::getInstagramProfile($request->accountId, $request->accessToken);
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
            'meta_business_name' => $metaBusiness['name'] . (isset($metaBusiness['username']) ? ' (@' . $metaBusiness['username'] . ')' : ''),
            'meta_business_profile' => $metaBusinessProfile,
            'meta_access_token' => $request->accessToken,
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
            } else {
                throw new Exception('Invalid service type');
            }

            return  $profile;
        });
        return response($response->toArray(), $response->status);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        return $jpa;
    }
}
