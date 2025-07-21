<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Atalaya\ServicesByBusiness;
use App\Models\Client;
use App\Models\Integration;
use App\Models\Setting;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

class MetaController extends Controller
{
    public static function getInstagramProfile(string $id, string $accessToken)
    {
        $igMeRest = new Fetch(env('INSTAGRAM_GRAPH_URL'). "/me?fields,id,name,username&access_token={$accessToken}");
        $igRest = new Fetch(env('INSTAGRAM_GRAPH_URL'). "/{$id}?fields=id,name,username&access_token={$accessToken}");

        $igMeData = $igMeRest->json();
        $igData = $igRest->json();
        
        if (isset($igMeData['error']) || isset($igData['error'])) throw new Exception('Error, token de acceso inválido');
        if ($igMeData['id'] != $igData['id']) throw new Exception('Error, el token de acceso no pertenece al negocio');

        return $igData;
    }
    public static function getFacebookProfile(string $id, string $accessToken) {
        $fbMeRest = new Fetch(env('FACEBOOK_GRAPH_URL'). "/me?fields,id,name,username,picture&access_token={$accessToken}");
        $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL'). "/{$id}?fields=id,name,username,picture&access_token={$accessToken}");

        $fbMeData = $fbMeRest->json();
        $fbData = $fbRest->json();
        
        if (isset($fbMeData['error']) || isset($fbData['error'])) throw new Exception('Error, token de acceso inválido');
        if ($fbMeData['id'] != $fbData['id']) throw new Exception('Error, el token de acceso no pertenece al negocio');

        return $fbData;
    }
    public function verify(Request $request, string $origin, string $business_uuid)
    {
        $challenge = $request->query('hub_challenge');
        $verify_token = $request->query('hub_verify_token');

        if (!in_array($origin, ['messenger', 'instagram'])) return response('Error, origen no permitido', 403);

        $sbbJpa = ServicesByBusiness::query()
            ->join('businesses', 'services_by_businesses.business_id', '=', 'businesses.id')
            ->join('services', 'services_by_businesses.service_id', '=', 'services.id')
            ->where('services.correlative', env('APP_CORRELATIVE'))
            ->where('businesses.uuid', $business_uuid)
            ->where('businesses.status', true)
            ->first();

        if (!$sbbJpa) return response('Error, negocio no encontrado o inactivo', 403);

        if (hash('sha256', $business_uuid) != $verify_token) return response('Error, token de validación incorrecto', 403);

        Integration::updateOrCreate([
            'meta_service' => $origin,
            'business_id' => $sbbJpa->business_id,
        ]);

        dump($challenge);

        return response($challenge, 200);
    }

    public function webhook(Request $request, string $origin, string $business_uuid)
    {
        $response = Response::simpleTryCatch(function () use ($request, $origin, $business_uuid) {
            $data = $request->all();
            dump($data);

            if (!in_array($origin, ['messenger', 'instagram'])) throw new Exception('Error, origen no permitido');


            $entry = $data['entry'][0] ?? [];
            $messaging = $entry['messaging'][0] ?? [];

            if ($entry['id'] == $messaging['sender']['id']) return;

            $businessJpa = Business::query()
                ->where('uuid', $business_uuid)
                ->where('status', true)
                ->first();
            if (!$businessJpa) throw new Exception('Error, negocio no encontrado o inactivo');

            $integrationJpa = Integration::query()
                ->where('meta_service', $origin)
                ->where('business_id', $businessJpa->id)
                ->whereNull('meta_business_id')
                ->first();

            if (!$integrationJpa) {
                $integrationJpa = Integration::updateOrCreate([
                    'meta_service' => $origin,
                    'meta_business_id' => $entry['id'],
                    'business_id' => $businessJpa->id,
                ]);
            } else {
                $integrationJpa->update(['meta_business_id' => $entry['id']]);
            }

            if (!$integrationJpa->meta_access_token) return;

            $userId = $messaging['sender']['id'];
            $fields = ['id', 'first_name', 'last_name', 'name', 'profile_pic', 'locale', 'timezone', 'gender'];
            $fieldsStr = implode(',', $fields);
            $profileRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$userId}?fields={$fieldsStr}&access_token={$integrationJpa->meta_access_token}");
            $profileData = $profileRest->json();

            if ($entry['id'] != $messaging['sender']['id']) {
                Client::updateOrCreate([
                    'integration_id' => $integrationJpa->id,
                    'integration_user_id' => $profileData['id'],
                    'business_id' => $businessJpa->id,
                ], [
                    'message' => $messaging['message']['text']?? 'Sin mensaje',
                    'contact_name' => $profileData['name'],
                    'name' => $profileData['name'],
                    'source' => 'Externo',
                    'date' => Trace::getDate('date'),
                    'time' => Trace::getDate('time'),
                    'ip' => $request->ip(),
                    'status_id' => Setting::get('default-lead-status', $businessJpa->id),
                    'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
                    'origin' => Text::toTitleCase($origin),	
                    'triggered_by' => 'Gemini AI'
                ]);
            }
        }, function ($res, $th) {dump($th);});
        return response($response->toArray(), 200);
    }
}
