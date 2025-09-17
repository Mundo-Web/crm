<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\Message;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WhatsAppController extends Controller
{
    public function verify()
    {
        $response = Response::simpleTryCatch(function (Response $response) {
            $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
            if (!$businessJpa) throw new Exception('Empresa no encontrada');

            $res = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances', [
                'headers' => ['apikey' => $businessJpa->uuid]
            ]);

            $raw = $res->text();
            $data = JSON::parseable($raw);
            if (!$res->ok) throw new Exception($data['response']['message'] ?? 'Error al verificar WhatsApp');

            if ($data[0]['connectionStatus'] !== 'open') throw new Exception('WhatsApp desconectado. Escanee el QR');

            $session = $data[0];
            return [
                'pushname' => $session['profileName'],
                'profile' => $session['profilePicUrl'],
                'me' => [
                    'user' => explode('@', $session['ownerJid'])[0],
                    'server' => explode('@', $session['ownerJid'])[1]
                ],
            ];
        });

        return response($response->toArray(), $response->status);
    }

    /**
     * Envía datos formateados como SSE
     */
    private function write($content)
    {
        $data = is_array($content) ? JSON::stringify($content) : $content;
        echo 'data: ' . $data . Text::lineBreak(2);

        ob_flush();
        flush();

        if (connection_aborted() || connection_status() === CONNECTION_ABORTED) {
            throw new \RuntimeException('Client disconnected');
        }
    }

    /**
     * Convierte la sesión de WhatsApp en un array con la info del perfil
     */
    private function getProfile(array $session): array
    {
        return [
            'pushname' => $session['profileName'] ?? null,
            'profile' => $session['profilePicUrl'] ?? null,
            'me' => [
                'user'   => explode('@', $session['ownerJid'])[0] ?? null,
                'server' => explode('@', $session['ownerJid'])[1] ?? null,
            ],
        ];
    }

    /**
     * Endpoint SSE para iniciar/verificar conexión de WhatsApp
     */
    public function stream()
    {
        $response = new StreamedResponse(function () {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');

            $this->write('ping');
            $this->write(['status' => 'loading_screen']);

            $business = Business::with(['person'])->find(Auth::user()->business_id);

            // 1. Consultar instancia actual
            $sessionRes = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances', [
                'headers' => ['apikey' => $business->uuid]
            ]);
            $sessions = $sessionRes->json();

            // 2. Si hay sesión activa -> enviar ready y salir
            if ($sessionRes->ok && !empty($sessions) && $sessions[0]['connectionStatus'] === 'open') {
                $this->write(['status' => 'ready', 'info'   => $this->getProfile($sessions[0])]);
                return;
            }

            // 3. Si no existe, intentar crear la sesión
            if (!$sessionRes->ok) {
                $body = [
                    'integration'   => 'WHATSAPP-BAILEYS',
                    'instanceName'  => $business->person->document_number,
                    'token'         => $business->uuid,
                ];
                new Fetch(env('EVOAPI_URL') . '/instance/create', [
                    'method'  => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'apikey'       => env('EVOAPI_APIKEY')
                    ],
                    'body'    => $body
                ]);
            }

            // 4. Polling hasta que se conecte o entregue QR
            ignore_user_abort(false);
            $lastQr = null;
            while (true) {
                $this->write(['status' => 'ping']);
                if (connection_aborted() || connection_status() !== CONNECTION_NORMAL) {
                    break; // 🛑 cortamos el SSE porque el front se desconectó
                }

                $qrRes = new Fetch(env('EVOAPI_URL') . '/instance/connect/' . $business->person->document_number, [
                    'headers' => ['apikey' => $business->uuid]
                ]);
                $qrData = $qrRes->json();

                if (!$qrRes->ok) {
                    $this->write(['status'  => 'error', 'message' => $qrData['response']['message'] ?? 'Error al verificar QR']);
                    continue;
                }

                $state = $qrData['instance']['state'] ?? 'closed';

                // ✅ Ya autenticado
                if ($state === 'open') {
                    $this->write(['status' => 'authenticated']);

                    $sessionRes = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances', [
                        'headers' => ['apikey' => $business->uuid]
                    ]);
                    $session = $sessionRes->json()[0] ?? [];

                    $this->write(['status' => 'ready', 'info'   => $this->getProfile($session)]);
                    break;
                }

                // 📸 Nuevo QR disponible
                if (($qrData['code'] ?? null) !== $lastQr) {
                    $lastQr = $qrData['code'];
                    $this->write(['status' => 'qr', 'qr' => $lastQr]);
                }

                sleep(2);
            }
        });
        return $response;
    }

    public function close()
    {
        $response = Response::simpleTryCatch(function (Response $response) {
            $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
            if (!$businessJpa) throw new Exception('Business not found');

            $res = new Fetch(env('EVOAPI_URL') . '/instance/logout/' . $businessJpa->person->document_number, [
                'method' => 'DELETE',
                'headers' => ['apikey' => $businessJpa->uuid]
            ]);

            if (!$res->ok) {
                $data = $res->json();
                throw new Exception($data['response']['message'] ?? 'Error closing WhatsApp session');
            }
        });

        return response($response->toArray(), $response->status);
    }

    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
            $clientJpa = Client::find($request->client_id);

            $number = $clientJpa->contact_phone ?? null;
            if ($request->phone) $number = $request->phone;
            if (!$number) throw new Exception('Número no encontrado');

            $message = $request->message;

            if (Text::startsWith($message, '/signature:')) {
                $res = new Fetch(env('EVOAPI_URL') . '/message/sendMedia/' . $businessJpa->person->document_number, [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'apikey' => $businessJpa->uuid
                    ],
                    'body' => [
                        'number' => $number,
                        'mediatype' => 'image',
                        'media' => str_replace('/signature:', '', $message),
                        'fileName' => 'signature.png',
                        'mimetype' => 'image/png'
                    ]
                ]);
                Message::create([
                    'wa_id' => $number,
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

                // First check the file type by making a HEAD request
                $fileTypeCheck = new Fetch($attachment);

                $mimeType = $fileTypeCheck->contentType ?? 'application/octet-stream';
                $mediaType = 'document';

                // Determine media type based on mime type
                if (strpos($mimeType, 'image/') === 0) {
                    $mediaType = 'image';
                } else if (strpos($mimeType, 'video/') === 0) {
                    $mediaType = 'video';
                } else if (strpos($mimeType, 'audio/') === 0) {
                    $mediaType = 'audio';
                }

                $res = new Fetch(env('EVOAPI_URL') . '/message/sendMedia/' . $businessJpa->person->document_number, [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'apikey' => $businessJpa->uuid
                    ],
                    'body' => [
                        'number' => $number,
                        'mediatype' => $mediaType,
                        'caption' => $message2send,
                        'media' => $attachment,
                        'fileName' => $filename,
                        'mimetype' => $mimeType
                    ]
                ]);

                Message::create([
                    'wa_id' => $number,
                    'role' => 'User',
                    'message' => Text::html2wa($message),
                    'microtime' => (int) (microtime(true) * 1_000_000),
                    'business_id' => Auth::user()->business_id,
                ]);
            } else {
                $res = new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $businessJpa->person->document_number, [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'apikey' => $businessJpa->uuid
                    ],
                    'body' => [
                        'number' => $number,
                        'text' => Text::html2wa($request->message)
                    ]
                ]);
                Message::create([
                    'wa_id' => $number,
                    'role' => 'User',
                    'message' => Text::html2wa($request->message),
                    'microtime' => (int) (microtime(true) * 1_000_000),
                    'business_id' => Auth::user()->business_id,
                ]);
            }
            dump($res->json());
            if (!$res?->ok) throw new Exception('Ocurrio un error al enviar el mensaje');
        });
        return response($response->toArray(), $response->status);
    }
}
