<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\Message;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Response as FacadesResponse;
use SoDe\Extend\Crypto;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WhatsAppController extends Controller
{
    private array $events = [
        // "APPLICATION_STARTUP",
        // "CALL",
        // "CHATS_DELETE",
        // "CHATS_SET",
        // "CHATS_UPDATE",
        // "CHATS_UPSERT",
        // "CONNECTION_UPDATE",
        // "CONTACTS_SET",
        // "CONTACTS_UPDATE",
        // "CONTACTS_UPSERT",
        // "GROUP_PARTICIPANTS_UPDATE",
        // "GROUP_UPDATE",
        // "GROUPS_UPSERT",
        // "LABELS_ASSOCIATION",
        // "LABELS_EDIT",
        // "LOGOUT_INSTANCE",
        // "MESSAGES_DELETE",
        // "MESSAGES_SET",
        // "MESSAGES_UPDATE",
        "MESSAGES_UPSERT",
        // "PRESENCE_UPDATE",
        // "QRCODE_UPDATED",
        // "REMOVE_INSTANCE",
        // "SEND_MESSAGE",
        // "TYPEBOT_CHANGE_STATUS",
        // "TYPEBOT_START"
    ];

    public function verify()
    {
        $response = Response::simpleTryCatch(function (Response $response) {
            $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
            if (!$businessJpa) throw new Exception('Empresa no encontrada');

            $res = new Fetch(env('EVOAPI_URL') . '/instance/fetchInstances?instanceName=' . $businessJpa->person->document_number, [
                'headers' => ['apikey' => $businessJpa->uuid]
            ]);

            $raw = $res->text();
            $data = JSON::parseable($raw);
            if (!$res->ok) throw new Exception($data['response']['message'] ?? 'Error al verificar WhatsApp');

            if ($data[0]['connectionStatus'] !== 'open') throw new Exception('WhatsApp desconectado. Escanee el QR');

            // Update webhook configuration
            $webhookRes = new Fetch(env('EVOAPI_URL') . '/webhook/set/' . $businessJpa->person->document_number, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'apikey' => $businessJpa->uuid
                ],
                'body' => ['webhook' => [
                    'enabled' => true,
                    'url' => env('APP_URL')  . '/meta/evoapi/' . $businessJpa->uuid,
                    'webhookByEvents' => false,
                    'events' => $this->events
                ]]
            ]);
            if (!$webhookRes->ok)  throw new Exception('Error al configurar webhook de WhatsApp');

            $session = $data[0];
            return $this->getProfile($session);
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
            'count' => [
                'messages' => $session['_count']['Message'] ?? 0,
                'contacts' => $session['_count']['Contact'] ?? 0,
                'chats' => $session['_count']['Chat'] ?? 0
            ]
        ];
    }

    public function profile(Request $request)
    {
        try {
            $business = Business::with(['person'])->find(Auth::user()->business_id);

            if (!$business) {
                return response()->json(['error' => 'Business not found'], 404);
            }

            // Paso 1: Llamar al endpoint de contactos
            $res = Http::withHeaders([
                'Content-Type' => 'application/json',
                'apikey' => $business->uuid,
            ])->post(env('EVOAPI_URL') . '/chat/findContacts/' . $business->person->document_number, [
                'where' => [
                    'remoteJid' => $request->remoteJid,
                ]
            ]);

            if (!$res->ok()) {
                return response()->json(['error' => 'Contact not found'], $res->status());
            }

            $data = $res->json();

            if (empty($data) || empty($data[0]['profilePicUrl'])) {
                return response()->json(['error' => 'Profile image not found'], 404);
            }

            $imageUrl = $data[0]['profilePicUrl'];

            // Paso 2: Descargar la imagen
            $imageRes = Http::get($imageUrl);

            if (!$imageRes->ok()) {
                return response()->json(['error' => 'Failed to fetch image'], 500);
            }

            // Paso 3: Obtener tipo MIME
            $contentType = $imageRes->header('Content-Type', 'image/jpeg');

            // Paso 4: Retornar la imagen directamente
            return FacadesResponse::make($imageRes->body(), 200, [
                'Content-Type' => $contentType,
                'Cache-Control' => 'public, max-age=86400',
            ]);
        } catch (Exception $e) {
            // Manejo general de errores
            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage(),
            ], 500);
        }
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
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessJpa = Business::with(['person'])->find(Auth::user()->business_id);
            $clientJpa = Client::with('integration')->find($request->client_id);

            $number = $clientJpa->contact_phone ?? null;
            if ($request->phone) $number = $request->phone;
            if (!$number) throw new Exception('Número no encontrado');

            $message = $request->message;

            // Handle file uploads
            if ($request->hasFile('audio')) {
                $file = $request->file('audio');
                $filename = 'audio-' . Crypto::short() . '.mp3';
                $file->storeAs('images/whatsapp', $filename, 'local');
                $message = '/audio:' . $filename;
            } else if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = 'image-' . Crypto::short() . '.jpeg';
                $file->storeAs('images/whatsapp', $filename, 'local');
                $message = trim('/image:' . $filename . Text::lineBreak() . $message);
            } else if ($request->hasFile('document')) {
                $file = $request->file('document');
                $filename = 'document-' . Crypto::short() . '.' . $file->getClientOriginalExtension();
                $file->storeAs('images/whatsapp', $filename, 'local');
                $message = trim('/document:' . $filename . Text::lineBreak() . $message);
            }

            $isDummy = in_array($number, explode(',', env('WA_DUMMY')), true);

            // Validate WhatsApp number via Meta Graph API
            // if (!$isDummy) {
            //     $integration = $clientJpa->integration;
            //     if (!$integration || !$integration->meta_access_token) {
            //         throw new Exception('No hay credenciales de Meta configuradas');
            //     }

            //     $checkPhoneRes = Http::withToken($integration->meta_access_token)
            //         ->get(env('FACEBOOK_GRAPH_URL') . '/' . $integration->meta_account_id . '/phone_numbers', [
            //             'filter' => 'whatsapp',
            //         ]);

            //     if (!$checkPhoneRes->ok()) {
            //         throw new Exception('Error al validar número en WhatsApp');
            //     }

            //     $phones = $checkPhoneRes->json('data') ?? [];
            //     $exists = collect($phones)->contains('display_phone_number', $number);
            //     if (!$exists) {
            //         throw new Exception('El número de WhatsApp no existe o no está registrado');
            //     }
            // }

            // Send message via Meta Graph API
            if (!$isDummy) {
                $integration = $clientJpa->integration;
                $url = env('FACEBOOK_GRAPH_URL') . '/' . $integration->meta_number_id . '/messages';

                if (Text::startsWith($message, '/signature:')) {
                    $mediaPath = str_replace('/signature:', '', $message);
                    $res = Http::withToken($integration->meta_access_token)
                        ->post($url, [
                            'messaging_product' => 'whatsapp',
                            'recipient_type' => 'individual',
                            'to' => $number,
                            'type' => 'image',
                            'image' => [
                                'link' => $mediaPath,
                                'caption' => '',
                            ],
                        ]);
                } else if (Text::startsWith($message, '/attachment:')) {
                    [$attachment] = explode(Text::lineBreak(), $message);
                    $caption = trim(str_replace($attachment, '', $message) ?: '');
                    $attachment = str_replace('/attachment:', '', $attachment);

                    // Determine mime type
                    $mimeType = 'application/octet-stream';
                    $head = Http::head($attachment);
                    if ($head->ok()) {
                        $mimeType = $head->header('Content-Type') ?? $mimeType;
                    }

                    $mediaType = 'document';
                    if (strpos($mimeType, 'image/') === 0) {
                        $mediaType = 'image';
                    } else if (strpos($mimeType, 'video/') === 0) {
                        $mediaType = 'video';
                    } else if (strpos($mimeType, 'audio/') === 0) {
                        $mediaType = 'audio';
                    }

                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $number,
                        'type' => $mediaType,
                        $mediaType => [
                            'link' => $attachment,
                        ],
                    ];
                    if ($caption) {
                        $payload[$mediaType]['caption'] = Text::html2wa($caption);
                    }

                    $res = Http::withToken($integration->meta_access_token)->post($url, $payload);
                } else if (Text::startsWith($message, '/audio:')) {
                    $audio = str_replace('/audio:', env('APP_URL') . '/storage/images/whatsapp/', $message);
                    $res = Http::withToken($integration->meta_access_token)
                        ->post($url, [
                            'messaging_product' => 'whatsapp',
                            'recipient_type' => 'individual',
                            'to' => $number,
                            'type' => 'audio',
                            'audio' => ['link' => $audio],
                        ]);
                } else if (Text::startsWith($message, '/image:') || Text::startsWith($message, '/document:')) {
                    [$fileTag] = explode(Text::lineBreak(), $message);
                    $caption = trim(str_replace($fileTag, '', $message) ?: '');

                    if (Text::startsWith($message, '/image:')) {
                        $mediaType = 'image';
                        $filePath = str_replace('/image:', env('APP_URL') . '/storage/images/whatsapp/', $fileTag);
                        $mimeType = 'image/jpeg';
                    } else {
                        $mediaType = 'document';
                        $filePath = str_replace('/document:', env('APP_URL') . '/storage/images/whatsapp/', $fileTag);
                        $mimeType = $request->file('document')?->getMimeType() ?? 'application/octet-stream';
                    }

                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $number,
                        'type' => $mediaType,
                        $mediaType => [
                            'link' => $filePath,
                        ],
                    ];
                    if ($caption) {
                        $payload[$mediaType]['caption'] = Text::html2wa($caption);
                    }

                    $res = Http::withToken($integration->meta_access_token)->post($url, $payload);
                } else {
                    $res = Http::withToken($integration->meta_access_token)
                        ->post($url, [
                            'messaging_product' => 'whatsapp',
                            'recipient_type' => 'individual',
                            'to' => $number,
                            'type' => 'text',
                            'text' => ['body' => Text::html2wa($request->message)],
                        ]);
                }

                if (!$res->ok()) {
                    throw new Exception('Ocurrió un error al enviar el mensaje: ' . $res->body());
                }
            }

            // Store message in DB
            Message::create([
                'wa_id' => $number,
                'role' => 'User',
                'message' => Text::html2wa($message),
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => Auth::user()->business_id,
                'seen' => true
            ]);
        });
        return response($response->toArray(), $response->status);
    }
}
