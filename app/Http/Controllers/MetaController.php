<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\ServicesByBusiness;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
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
            ->join('services', 'services_by_businesses.service_id', '=', 'services.id')
            ->where('services.correlative', env('APP_CORRELATIVE'))
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

            if ($entry['id'] == $entry['messaging']['sender']['id']) return;

            $userId = $entry['messaging']['sender']['id'];
            $fields = ['id', 'first_name', 'last_name', 'name', 'profile_pic', 'locale', 'timezone', 'gender'];
            $accessToken = 'EAATRvPtpfZAMBO8FM65hJK1Vw1NAlZADDJvSzvWZAsqd4hgPwJMohfaCRFG7oD3ZBhpJZCWUTABWjaqJwUKgymaqYIluYJ9fEyk41O6UZAptOYozu5l58hz6A9Nmpb1qEEZBndqpZBTGukTvf6qV0giz5ViZCLaNoJtipvIyOdFLOGZAvk3vRvk8ZAUquFEbAj4Xtmq';
            $profileRest = new Fetch(env('META_GRAPH_URL') . "/{$userId}?fields={$fields}&access_token={$accessToken}");
            $profileData = $profileRest->json();

            dump($profileData);

            if ($entry['id'] != $entry['messaging']['sender']['id']) {
                dump($entry['messaging']['message']['text']);
            }
        });
        dump($response->toArray());
        return response($response->toArray(), 200);
    }
}
