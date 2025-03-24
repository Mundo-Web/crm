<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Message;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;

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
            $message = $request->message;

            if (Text::startsWith($message, '/signature:')) {
                $res = new Fetch(env('WA_URL') . '/api/send', [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                    'body' => [
                        'from' => 'atalaya-' . $business_id,
                        'to' => [$clientJpa->contact_phone],
                        'attachment' => [[
                            'uri' => str_replace('/signature:', '', $message),
                            'filename' => 'signature.png',
                        ]],
                    ]
                ]);
                Message::create([
                    'wa_id' => $clientJpa->contact_phone,
                    'role' => 'User',
                    'message' => $message,
                    'microtime' => (int) (microtime(true) * 1_000_000),
                    'business_id' => Auth::user()->business_id,
                ]);
            } else if (Text::startsWith($message, '/attachment:')) {
                [$attachment] = explode(Text::lineBreak(), $message);
                $message2send = Text::html2wa(trim(str_replace($attachment, '', $message) ?: ''));
                $attachment = str_replace('/attachment:', '', $attachment);

                $filename = explode('/', $attachment);
                $filename = end($filename);

                $res = new Fetch(env('WA_URL') . '/api/send', [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                    'body' => [
                        'from' => 'atalaya-' . $business_id,
                        'to' => [$clientJpa->contact_phone],
                        'content' => $message2send,
                        'attachment' => [[
                            'uri' => $attachment,
                            'filename' => $filename,
                        ]],
                    ]
                ]);

                Message::create([
                    'wa_id' => $clientJpa->contact_phone,
                    'role' => 'User',
                    'message' => Text::html2wa($message),
                    'microtime' => (int) (microtime(true) * 1_000_000),
                    'business_id' => Auth::user()->business_id,
                ]);
            } else {
                $res = new Fetch(env('WA_URL') . '/api/send', [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                    ],
                    'body' => [
                        'from' => 'atalaya-' . $business_id,
                        'to' => [$clientJpa->contact_phone],
                        'content' => Text::html2wa($request->message),
                    ]
                ]);
            }
            if (!$res?->ok) throw new Exception('Ocurrio un error al enviar el mensaje');
        });
        return response($response->toArray(), $response->status);
    }
}
