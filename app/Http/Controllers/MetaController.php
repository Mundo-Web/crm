<?php

namespace App\Http\Controllers;

use App\Jobs\MetaAssistantJob;
use App\Models\Atalaya\Business;
use App\Models\Atalaya\ServicesByBusiness;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Setting;
use App\Models\Task;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\File;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

class MetaController extends Controller
{
    public static function getInstagramProfile(string $id, string $accessToken, bool $external = false)
    {
        if ($external) {
            $igRest = new Fetch(env('INSTAGRAM_GRAPH_URL') . "/{$id}?fields=id,name,username&access_token={$accessToken}");
            $igData = $igRest->json();

            if (isset($igData['error'])) throw new Exception('Error, token de acceso inválido');

            return $igData;
        }

        $igMeRest = new Fetch(env('INSTAGRAM_GRAPH_URL') . "/me?fields,id,name,username&access_token={$accessToken}");
        $igRest = new Fetch(env('INSTAGRAM_GRAPH_URL') . "/{$id}?fields=id,name,username&access_token={$accessToken}");

        $igMeData = $igMeRest->json();
        $igData = $igRest->json();

        if (isset($igMeData['error']) || isset($igData['error'])) throw new Exception('Error, token de acceso inválido');
        if ($igMeData['id'] != $igData['id']) throw new Exception('Error, el token de acceso no pertenece al negocio');

        return $igData;
    }
    public static function getFacebookProfile(string $id, string $accessToken, bool $external = false)
    {
        if ($external) {
            $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?access_token={$accessToken}");
            $fbData = $fbRest->json();

            if (isset($fbData['error'])) throw new Exception('Error, token de acceso inválido');

            return $fbData;
        }

        $fbMeRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/me?fields,id,name,username,picture&access_token={$accessToken}");
        $fbRest = new Fetch(env('FACEBOOK_GRAPH_URL') . "/{$id}?fields=id,name,username,picture&access_token={$accessToken}");

        $fbMeData = $fbMeRest->json();
        $fbData = $fbRest->json();

        if (isset($fbMeData['error']) || isset($fbData['error'])) throw new Exception('Error, token de acceso inválido');
        if ($fbMeData['id'] != $fbData['id']) throw new Exception('Error, el token de acceso no pertenece al negocio');

        return $fbData;
    }
    public function verify(Request $request, string $origin, string $business_uuid)
    {
        $response = Response::simpleTryCatch(function () use ($request, $origin, $business_uuid) {
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

            // Integration::updateOrCreate([
            //     'meta_service' => $origin,
            //     'business_id' => $sbbJpa->business_id,
            // ]);

            return $challenge;
        });

        return response($response->data, 200);
    }

    public function webhook(Request $request, string $origin, string $business_uuid)
    {
        $response = Response::simpleTryCatch(function () use ($request, $origin, $business_uuid) {
            $data = $request->all();

            if (!in_array($origin, ['messenger', 'instagram'])) throw new Exception('Error, origen no permitido');

            $entry = $data['entry'][0] ?? [];
            $messaging = $entry['messaging'][0] ?? [];

            $inOut = $entry['id'] == $messaging['sender']['id'] ? 'out' : 'in';

            $businessJpa = Business::query()
                ->where('uuid', $business_uuid)
                ->where('status', true)
                ->first();
            if (!$businessJpa) throw new Exception('Error, negocio no encontrado o inactivo');

            $messageJpa = Message::create([
                'wa_id' => $inOut == 'in' ? $messaging['sender']['id'] : $messaging['recipient']['id'],
                'role' => $inOut == 'in' ? 'Human' : 'AI',
                'message' => $messaging['message']['text'],
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => $businessJpa->id
            ]);

            if ($inOut == 'out') return;

            $integrationJpa = Integration::query()
                ->where('meta_service', $origin)
                ->where('business_id', $businessJpa->id)
                ->where('status', true)
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

            switch ($origin) {
                case 'messenger':
                    $profileData = MetaController::getFacebookProfile($userId, $integrationJpa->meta_access_token, true);
                    break;
                case 'instagram':
                    $profileData = MetaController::getInstagramProfile($userId, $integrationJpa->meta_access_token, true);
                default:
                    $profileData = MetaController::getFacebookProfile($userId, $integrationJpa->meta_access_token, true);
                    break;
            }

            $alreadyExists = Client::query()
                ->where('integration_id', $integrationJpa->id)
                ->where('integration_user_id', $profileData['id'])
                ->where('business_id', $businessJpa->id)
                ->where('status', true)
                ->first();

            if ($alreadyExists && $alreadyExists->complete_registration) return;

            $clientJpa = Client::updateOrCreate([
                'integration_id' => $integrationJpa->id,
                'integration_user_id' => $profileData['id'],
                'business_id' => $businessJpa->id,
            ], [
                'message' => $messaging['message']['text'] ?? 'Sin mensaje',
                'contact_name' => $profileData['first_name'] . ' ' . $profileData['last_name'],
                'name' => $profileData['first_name'] . ' ' . $profileData['last_name'],
                'source' => 'Externo',
                'date' => Trace::getDate('date'),
                'time' => Trace::getDate('time'),
                'ip' => $request->ip(),
                'status_id' => Setting::get('default-lead-status', $businessJpa->id),
                'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
                'origin' => Text::toTitleCase($origin),
                'triggered_by' => 'Gemini AI',
                'status' => true,
                'complete_registration' => false
            ]);

            $hasApikey = Setting::get('gemini-api-key', $businessJpa->id);

            if ($hasApikey && !$clientJpa->complete_registration) {
                MetaAssistantJob::dispatchAfterResponse($clientJpa, $messageJpa);
            }

            if ($alreadyExists) return;
            $noteJpa = ClientNote::create([
                'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                'client_id' => $clientJpa->id,
                'name' => 'Lead nuevo',
                'description' => UtilController::replaceData(
                    Setting::get('whatsapp-new-lead-notification-message', $clientJpa->business_id),
                    $clientJpa->toArray()
                )
            ]);

            Task::create([
                'model_id' => ClientNote::class,
                'note_id' => $noteJpa->id,
                'name' => 'Revisar lead',
                'description' => 'Debes revisar los requerimientos del lead',
                'ends_at' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
                'status' => 'Pendiente',
                'asignable' => true
            ]);
        });
        return response($response->toArray(), 200);
    }

    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $clientId = $request->input('client_id');
            $message = $request->input('message');

            // Get client with their business ID
            $clientJpa = Client::query()
                ->where('id', $clientId)
                ->where('status', true)
                ->first();

            if (!$clientJpa) throw new Exception('Client not found');

            // Get integration details
            $integrationJpa = Integration::query()
                ->where('id', $clientJpa->integration_id)
                ->where('business_id', $clientJpa->business_id)
                ->where('status', true)
                ->first();

            if (!$integrationJpa) throw new Exception('Integration not found');
            if (!$integrationJpa->meta_access_token) throw new Exception('Access token not found');

            // Determine API URL based on meta service
            $baseUrl = $integrationJpa->meta_service === 'instagram'
                ? env('INSTAGRAM_GRAPH_URL')
                : env('FACEBOOK_GRAPH_URL');

            // Send message
            $messageEndpoint = "{$baseUrl}/me/messages";
            $messageData = [
                'recipient' => ['id' => $clientJpa->integration_user_id],
                'message' => ['text' => $message]
            ];

            $sendRest = new Fetch($messageEndpoint, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => "Bearer {$integrationJpa->meta_access_token}"
                ],
                'body' => $messageData
            ]);

            $result = $sendRest->json();

            if (isset($result['error'])) {
                throw new Exception('Failed to send message: ' . $result['error']['message']);
            }

            // Store message in database
            Message::create([
                'wa_id' => $clientJpa->integration_user_id,
                'role' => 'AI',
                'message' => $message,
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => $clientJpa->business_id
            ]);

            return $result;
        });
        return response($response->toArray(), $response->status);
    }

    public static function assistant(Client $clientJpa, Message $messageJpa, ?string $origin = null)
    {
        try {
            while (true) {
                // Get latest message for this client
                $latestMessage = Message::query()
                    ->where('wa_id', $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id)
                    ->where('business_id', $clientJpa->business_id)
                    ->orderBy('microtime', 'desc')
                    ->first();

                /*
                // If latest message is different from current message, stop processing
                if ($latestMessage->id !== $messageJpa->id) {
                    break;
                }

                // Calculate time difference in seconds
                $timeDiff = (microtime(true) * 1_000_000 - $latestMessage->microtime) / 1_000_000;

                // If less than 10 seconds have passed, wait and continue checking
                if ($timeDiff < 15) {
                    sleep(5);
                    continue;
                }

                // Check if registration is already complete
                if ($clientJpa->complete_registration) {
                    break;
                }
                */

                // Get last 40 messages
                $messages = Message::query()
                    ->where('wa_id', $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id)
                    ->where('business_id', $clientJpa->business_id)
                    ->orderBy('microtime', 'desc')
                    ->limit(40)
                    ->get();

                // Get Gemini API key from settings
                $apiKey = Setting::get('gemini-api-key', $clientJpa->business_id);

                $businessJpa = Business::with(['person'])
                    ->where('id', $clientJpa->business_id)
                    ->first();

                $businessEmail = Setting::get('email-new-lead-notification-message-owneremail', $businessJpa->id);
                $businessServices = Setting::get('gemini-what-business-do', $businessJpa->id);
                $prompt = File::get(
                    $origin == 'evoapi'
                        ? '../storage/app/utils/gemini-prompt-evoapi.txt'
                        : '../storage/app/utils/gemini-prompt-meta.txt'
                );
                $prompt = Text::replaceData($prompt, [
                    'nombreEmpresa' => $businessJpa->name,
                    'correoEmpresa' => $businessEmail ?? 'hola@mundoweb.pe',
                    'servicios' => $businessServices ?? 'algunos servicios',
                ]);

                $messageString = '';
                foreach ($messages->sortBy('microtime') as $msg) {
                    $messageString .= "{$msg->role}: {$msg->message}\n";
                }

                $prompt2send = $prompt . Text::lineBreak(2) . $messageString . 'AI:';
                $geminiRest = new Fetch(env('GEMINI_API_URL'), [
                    'method' => 'POST',
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'X-goog-api-key' => $apiKey
                    ],
                    'body' => [
                        'contents' => [['parts' => [['text' => $prompt2send]]]],
                        'generationConfig' => ['stopSequences' => ['Human:', 'AI:']]
                    ]
                ]);
                $geminiResponse = $geminiRest->json();
                if (isset($geminiResponse['error']['message'])) {
                    break;
                }

                $answer = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
                $prompt2save = $prompt2send . $answer;

                $result = self::searchCommand($answer);
                if (!$result['found']) {
                    // Create and send message with cleaned response
                    $message = trim(preg_replace('/^AI:\s*/', '', $result['message'])) ?: 'Lo siento, parece que no he entendido bien tu solicitud. ¿Podrías intentar formularla de nuevo o indicarme si necesitas ayuda de uno de nuestros ejecutivos?';

                    if ($origin == 'evoapi') {
                        new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $businessJpa->person->document_number, [
                            'method' => 'POST',
                            'headers' => [
                                'Content-Type' => 'application/json',
                                'apikey' => $businessJpa->uuid
                            ],
                            'body' => [
                                'number' => $clientJpa->contact_phone,
                                'text' => $message
                            ]
                        ]);
                    } else {
                        // Send message through Meta integration
                        $integrationJpa = Integration::find($clientJpa->integration_id);

                        if ($integrationJpa && $integrationJpa->meta_access_token) {
                            $baseUrl = $integrationJpa->meta_service === 'instagram'
                                ? env('INSTAGRAM_GRAPH_URL')
                                : env('FACEBOOK_GRAPH_URL');

                            $messageEndpoint = "{$baseUrl}/me/messages";
                            $messageData = [
                                'recipient' => ['id' => $clientJpa->integration_user_id],
                                'message' => ['text' => $message]
                            ];

                            new Fetch($messageEndpoint, [
                                'method' => 'POST',
                                'headers' => [
                                    'Content-Type' => 'application/json',
                                    'Authorization' => "Bearer {$integrationJpa->meta_access_token}"
                                ],
                                'body' => $messageData
                            ]);
                        }
                    }

                    // Store message in database
                    Message::create([
                        'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                        'role' => 'AI',
                        'message' => $message,
                        'prompt' => $prompt2save,
                        'microtime' => (int) (microtime(true) * 1_000_000),
                        'business_id' => $clientJpa->business_id
                    ]);

                    break;
                }

                // Get last command and parse it
                $lastCommand = end($result['commands']);
                $collected = self::pseudoToObject($lastCommand);

                // Update client contact information if available
                $updateData = [];
                if (!empty($collected['correoCliente'])) {
                    $updateData['contact_email'] = $collected['correoCliente'];
                }
                if (!empty($collected['nombreCliente']) && $collected['nombreCliente'] != '-') {
                    $updateData['contact_name'] = $collected['nombreCliente'];
                }
                if (!empty($collected['telefonoCliente']) && $collected['telefonoCliente'] != '-') {
                    $updateData['contact_phone'] = $collected['telefonoCliente'];
                }
                if (!empty($collected['fuenteCliente']) && $collected['fuenteCliente'] != '-') {
                    $updateData['source_channel'] = $collected['fuenteCliente'];
                }

                if (!empty($updateData)) {
                    $clientJpa->update($updateData);

                    // Check if all required fields are now complete
                    if (
                        $clientJpa->contact_name &&
                        $clientJpa->contact_email &&
                        $clientJpa->contact_phone
                    ) {
                        $clientJpa->update(['complete_registration' => true]);

                        // Get welcome message from settings and send it
                        $welcomeMessage = Setting::get('whatsapp-new-lead-notification-message-client', $clientJpa->business_id);
                        $welcomeMessage = UtilController::replaceData($welcomeMessage, $clientJpa->toArray());

                        if ($origin == 'evoapi') {
                            // Send message through EvoAPI
                            new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $businessJpa->person->document_number, [
                                'method' => 'POST',
                                'headers' => [
                                    'Content-Type' => 'application/json',
                                    'apikey' => $businessJpa->uuid
                                ],
                                'body' => [
                                    'number' => $clientJpa->contact_phone,
                                    'text' => Text::html2wa($welcomeMessage)
                                ]
                            ]);
                        } else {
                            // Send message through Meta integration
                            $integrationJpa = Integration::find($clientJpa->integration_id);
                            if ($integrationJpa && $integrationJpa->meta_access_token) {
                                $baseUrl = $integrationJpa->meta_service === 'instagram'
                                    ? env('INSTAGRAM_GRAPH_URL')
                                    : env('FACEBOOK_GRAPH_URL');

                                $messageEndpoint = "{$baseUrl}/me/messages";
                                $messageData = [
                                    'recipient' => ['id' => $clientJpa->integration_user_id],
                                    'message' => ['text' => UtilController::html2wa($welcomeMessage)]
                                ];

                                new Fetch($messageEndpoint, [
                                    'method' => 'POST',
                                    'headers' => [
                                        'Content-Type' => 'application/json',
                                        'Authorization' => "Bearer {$integrationJpa->meta_access_token}"
                                    ],
                                    'body' => $messageData
                                ]);
                            }
                        }
                        // Store welcome message in database
                        Message::create([
                            'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                            'role' => 'AI',
                            'message' => $welcomeMessage,
                            'prompt' => $prompt2save,
                            'microtime' => (int) (microtime(true) * 1_000_000),
                            'business_id' => $clientJpa->business_id
                        ]);
                    } else {
                        // Send the cleaned message from result if registration is not complete
                        $message = trim(preg_replace('/^AI:\s*/', '', $result['message']));

                        if ($origin == 'evoapi') {
                            // Send message through EvoAPI
                            new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $businessJpa->person->document_number, [
                                'method' => 'POST',
                                'headers' => [
                                    'Content-Type' => 'application/json',
                                    'apikey' => $businessJpa->uuid
                                ],
                                'body' => [
                                    'number' => $clientJpa->contact_phone,
                                    'text' => $message
                                ]
                            ]);
                        } else {

                            $integrationJpa = Integration::find($clientJpa->integration_id);
                            if ($integrationJpa && $integrationJpa->meta_access_token) {
                                $baseUrl = $integrationJpa->meta_service === 'instagram'
                                    ? env('INSTAGRAM_GRAPH_URL')
                                    : env('FACEBOOK_GRAPH_URL');

                                $messageEndpoint = "{$baseUrl}/me/messages";
                                $messageData = [
                                    'recipient' => ['id' => $clientJpa->integration_user_id],
                                    'message' => ['text' => $message]
                                ];

                                new Fetch($messageEndpoint, [
                                    'method' => 'POST',
                                    'headers' => [
                                        'Content-Type' => 'application/json',
                                        'Authorization' => "Bearer {$integrationJpa->meta_access_token}"
                                    ],
                                    'body' => $messageData
                                ]);
                            }
                        }
                        // Store response message in database
                        Message::create([
                            'wa_id' => $clientJpa->integration_user_id,
                            'role' => 'AI',
                            'message' => $message,
                            'prompt' => $prompt2save,
                            'microtime' => (int) (microtime(true) * 1_000_000),
                            'business_id' => $clientJpa->business_id
                        ]);
                    }
                }
                break;
            }
        } catch (\Throwable $th) {
            dump($th->getMessage());
        }
    }

    /**
     * Search for commands enclosed in double curly braces and extract them
     * @param string $input The input string to search for commands
     * @return array Array containing found status, commands array and cleaned message
     */
    public static function searchCommand(string $input): array
    {
        try {
            $pattern = '/{{(.*?)}}/';
            preg_match_all($pattern, $input, $matches);

            $commands = !empty($matches[1]) ? $matches[1] : [];

            $cleanMessage = preg_replace($pattern, '', $input);

            return [
                'found' => count($commands) > 0,
                'commands' => $commands,
                'message' => trim($cleanMessage)
            ];
        } catch (\Exception $error) {
            return [
                'found' => false,
                'commands' => [],
                'message' => $input
            ];
        }
    }

    /**
     * Converts a pseudo-formatted string into an associative array
     * Format example: "field1: value1; field2: value2"
     * @param string $pseudo The pseudo-formatted string to convert
     * @param bool $clean Whether to strictly clean the values or just keep certain characters
     * @return array The resulting associative array
     */
    public static function pseudoToObject(string $pseudo, bool $clean = false): array
    {
        try {
            $result = [];

            // Split by semicolon and trim
            $pairs = array_map('trim', explode(';', trim($pseudo)));

            foreach ($pairs as $pair) {
                if (empty($pair)) continue;

                // Split each pair by colon
                if (preg_match('/(.+):(.+)/', $pair, $matches)) {
                    $field = trim($matches[1]);
                    $value = trim($matches[2]);

                    // Remove quotes if present
                    $value = trim($value, '"\'');

                    if ($clean) {
                        // Strict cleaning - only alphanumeric and spaces
                        $value = preg_replace('/[^a-zA-Z0-9\s]/', '', $value);
                    } else {
                        // Keep specific characters
                        $value = preg_replace(
                            '/[^a-zA-Z0-9\sÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛÑÇãàáäâèéëêìíïîòóöôùúüûñç@\-_.,]/',
                            '',
                            $value
                        );
                    }

                    $result[$field] = $value;
                }
            }

            return $result;
        } catch (\Exception $e) {
            return [];
        }
    }
}
