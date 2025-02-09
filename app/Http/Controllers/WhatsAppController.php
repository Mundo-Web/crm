<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class WhatsAppController extends Controller
{
    public function verify()
    {
        $response = Response::simpleTryCatch(function () {
            $business_id = Auth::user()->business_uuid;

            $res = new Fetch(env('WA_URL') . '/api/session/ping/atalaya-' . $business_id);
            $raw = $res->text();

            $data = JSON::parseable($raw ?? '{}');

            if (!$res->ok) throw new Exception($data['message'] ?? 'No se pudo verificar la sesión');
            return $data['data'];
        });

        return response($response->toArray(), $response->status);
    }
}
