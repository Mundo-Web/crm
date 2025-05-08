<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Exception;
use Illuminate\Http\Request;

class IntegrationController extends BasicController
{
    public $model = Integration::class;
    public $throwMediaError = true;

    public function beforeSave(Request $request)
    {
        $integrationJpa = Integration::find($request->id);
        if (!$integrationJpa) throw new Exception('Error, integración no encontrada');

        $metaBusiness = ['error' => 'No se pudo obtener el perfil del negocio'];
        if ($integrationJpa->meta_service == 'messenger') {
            $metaBusiness = MetaController::getFacebookProfile($integrationJpa->meta_business_id, $request->meta_access_token);
        } else if ($integrationJpa->meta_service == 'instagram') {
            $metaBusiness = MetaController::getInstagramProfile($integrationJpa->meta_business_id, $request->meta_access_token);
        }

        dump($metaBusiness);

        $metaBusinessProfile = null;
        if (isset($metaBusiness['picture']['data']['url'])) {
            // Create directory if it doesn't exist
            $directory = storage_path('app/images/integration');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Get image content and generate filename
            $imageContent = file_get_contents($metaBusiness['picture']['data']['url']);
            $filename = $integrationJpa->meta_business_id . '.jpg';
            $fullPath = $directory . '/' . $filename;

            // Save image to storage
            file_put_contents($fullPath, $imageContent);

            $metaBusinessProfile =  $filename;
        }

        return [
            'id' => $integrationJpa->id,
            'meta_business_id' => $metaBusiness['id'],
            'meta_business_name' => $metaBusiness['name'] . (isset($metaBusiness['username']) ? ' (@' . $metaBusiness['username'] . ')' : ''),
            'meta_business_profile' => $metaBusinessProfile,
            'meta_access_token' => $request->meta_access_token,
        ];
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        return $jpa;
    }
}
