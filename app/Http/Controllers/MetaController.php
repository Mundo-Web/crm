<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\ServicesByBusiness;
use Illuminate\Http\Request;
use SoDe\Extend\JSON;

class MetaController extends Controller
{
    public function verify(Request $request, string $origin, string $business_id)
    {
        $challenge = $request->query('hub_challenge');
        $verify_token = $request->query('hub_verify_token');

        $businessExists = ServicesByBusiness::query()
            ->join('businesses', 'services_by_businesses.business_id', '=', 'businesses.id')
            ->where('businesses.uuid', $business_id)
            ->where('businesses.status', true)
            ->exists();
        if (!$businessExists) return response('Error, negocio no encontrado o inactivo', 404);

        if (hash('sha256', $business_id) != $verify_token) return response('Error, token de validación incorrecto', 403);

        return \response($challenge, 200);
    }

    public function webhook(Request $request, string $origin, string $business_id)
    {
        dump($origin . ' (' . $business_id . '): ' . JSON::stringify($request->all()));
        // $data = $request->all();
        // $entry = $data['entry'] ?? [];
        // switch ($data['object']) {
        //     case 'instagram':
        //         if ($entry['id'] != $entry['messaging']['sender']['id']) {
        //             dump($entry['messaging']['message']['text']);
        //         }
        //         break;

        //     default:
        //         # code...
        //         break;
        // }
        return \response('OK', 200);
    }
}
