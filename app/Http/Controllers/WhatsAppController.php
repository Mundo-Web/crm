<?php

namespace App\Http\Controllers;

use App\Models\Client;
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
        $response = Response::simpleTryCatch(function (Response $response) {
            $business_id = Auth::user()->business_uuid;

            $res = new Fetch(env('WA_URL') . '/api/session/ping/atalaya-' . $business_id);
            $raw = $res->text();

            $data = JSON::parseable($raw ?? '{}');

            $response->status = $res->status;
            $response->message = $data['message'] ?? 'No se pudo verificar la sesión';
            $response->data = $data['data'] ?? null;
        });

        return response($response->toArray(), $response->status);
    }

    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $business_id = Auth::user()->business_uuid;
            $clientJpa = Client::find($request->client_id);
            $res = new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'body' => [
                    'from' => 'atalaya-' . $business_id,
                    'to' => [$clientJpa->contact_phone],
                    'content' => $request->message,
                ]
            ]);
            if (!$res->ok) throw new Exception('Ocurrio un error al enviar el mensaje');
        });
        return response($response->toArray(), $response->status);
    }
}
