<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\ServicesByBusiness;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class MetaController extends Controller
{
    public function verify(Request $request, string $origin, string $business_id)
    {
        $challenge = $request->query('hub_challenge');
        $verify_token = $request->query('hub_verify_token');

        if (!in_array($origin, ['messenger', 'instagram'])) return response('Error, origen no permitido', 403);

        $businessExists = ServicesByBusiness::query()
            ->join('businesses', 'services_by_businesses.business_id', '=', 'businesses.id')
            ->where('businesses.uuid', $business_id)
            ->where('businesses.status', true)
            ->exists();
        if (!$businessExists) return response('Error, negocio no encontrado o inactivo', 403);

        if (hash('sha256', $business_id) != $verify_token) return response('Error, token de validación incorrecto', 403);

        return response($challenge, 200);
    }

    public function webhook(Request $request, string $origin, string $business_id)
    {
        $response = Response::simpleTryCatch(function () use ($request, $origin, $business_id) {
            if (!in_array($origin, ['messenger', 'instagram'])) throw new Exception('Error, origen no permitido');

            $data = $request->all();
            $entry = $data['entry'] ?? [];
            dump("{$origin} ({$business_id}): " . JSON::stringify($entry, true));
            switch ($origin) {
                case 'messenger':
                    if ($entry['id'] != $entry['messaging']['sender']['id']) {
                        dump($entry['messaging']['message']['text']);
                    }
                    break;
    
                default:
                    # code...
                    break;
            }
        });
        return response($response->toArray(), 200);
    }
}
