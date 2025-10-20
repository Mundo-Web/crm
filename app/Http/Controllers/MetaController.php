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
use SoDe\Extend\JSON;
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

    private static function timeToSleep(string $message): int
    {
        // Contar palabras (usando str_word_count para separar correctamente)
        $numPalabras = str_word_count($message);

        // Velocidad promedio: 2.5 palabras/segundo → 400ms por palabra
        $tiempoBase = $numPalabras * 400;

        // Aleatoriedad ±0–500ms
        $random = rand(-500, 500);

        // Calcular total en milisegundos
        $tiempo = $tiempoBase + $random;

        // Limitar entre 0ms y 30000ms (30s)
        $tiempo = max(0, min($tiempo, 30000));

        return $tiempo;
    }

    private static function sendWithOrigin(Business $businessJpa, Client $clientJpa, string $message, string $prompt2save, ?string $origin = null)
    {
        if ($origin == 'evoapi') {
            new Fetch(env('EVOAPI_URL') . '/message/sendText/' . $businessJpa->person->document_number, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'apikey' => $businessJpa->uuid
                ],
                'body' => [
                    'number' => $clientJpa->contact_phone,
                    'text' => Text::html2wa($message),
                    'delay' => self::timeToSleep($message)
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
                    'message' => ['text' => Text::html2wa($message)]
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
            'message' => Text::html2wa($message),
            'prompt' => $prompt2save,
            'microtime' => (int) (microtime(true) * 1_000_000),
            'business_id' => $clientJpa->business_id
        ]);
    }

    private static function hasForms($businessId)
    {
        $raw = Setting::get('gemini-extra-questions', $businessId);
        if (!$raw || !is_string($raw)) return [null, false];

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) return [null, false];

        $formsWithQuestions = array_filter($decoded, function ($form) {
            return isset($form['questions']) && is_array($form['questions']) && count($form['questions']) > 0;
        });

        return count($formsWithQuestions) > 0
            ? [array_values($formsWithQuestions), true]
            : [null, false];
    }

    public static function assistant(Client $clientJpa, Message $messageJpa, ?string $origin = null)
    {
        try {
            while (true) {
                /*
                // Get latest message for this client
                $latestMessage = Message::query()
                    ->where('wa_id', $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id)
                    ->where('business_id', $clientJpa->business_id)
                    ->orderBy('microtime', 'desc')
                    ->first();

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
                $messagesQuery = Message::query()
                    ->where('wa_id', $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id)
                    ->where('business_id', $clientJpa->business_id)
                    ->orderBy('microtime', 'desc');

                if ($clientJpa->complete_registration) {
                    $lastMessageMicrotime = Message::where('role', 'form')
                        ->where('business_id', $clientJpa->business_id)
                        ->orderBy('microtime', 'desc')
                        ->value('microtime');
                    $messagesQuery->where('microtime', '>', $lastMessageMicrotime);
                }

                $messages = $messagesQuery->limit(40)
                    ->get();

                // Get Gemini API key from settings
                $apiKey = Setting::get('gemini-api-key', $clientJpa->business_id);

                $businessJpa = Business::with(['person'])
                    ->where('id', $clientJpa->business_id)
                    ->first();

                $businessEmail = Setting::get('email-new-lead-notification-message-owneremail', $businessJpa->id);
                $businessServices = Setting::get('gemini-what-business-do', $businessJpa->id);
                $personalidad = Setting::get('gemini-personality', $clientJpa->business_id);

                $prompt = File::get('../storage/app/utils/gemini-prompt.txt');
                $prompt = Text::replaceData($prompt, [
                    'nombreEmpresa' => $businessJpa->name,
                    'correoEmpresa' => $businessEmail ?? 'hola@mundoweb.pe',
                    'servicios' => $businessServices ?? 'algunos servicios',
                    'personalidad' => $personalidad ? Text::lineBreak() . 'Personalidad General: ' . $personalidad . Text::lineBreak() : Text::lineBreak()
                ]);

                $messagesList = [];
                foreach ($messages->sortBy('microtime') as $msg) {
                    $messagesList[] = [
                        'parts' => [['text' => $msg->message]],
                        'role' => $msg->role == 'Human' ? 'user' : 'model'
                    ];
                }
                $formId = null;
                if ($clientJpa->complete_registration) {
                    $forms = $clientJpa->form_answers;
                    $targetForm = null;
                    foreach ($forms as $form) {
                        $completed = $form['completed'] ?? false;
                        if (!$completed) {
                            $targetForm = $form;
                            break;
                        }
                    }
                    if (!$targetForm) break;
                    $formId = $targetForm['id'];
                    $properties = [];
                    foreach ($targetForm['questions'] as $index => $question) {
                        $paramName = 'answer_' . ($index + 1);
                        $properties[$paramName] = [
                            "type" => "string",
                            "description" => $question['text'] . ($question['closed'] ? ' (Pregunta cerrada: Respuestas admitidas →  ' . implode(', ', array_map(fn($k, $v) => ($k + 1) . '. ' . $v, array_keys($question['answers']), $question['answers'])) . ')' : '')
                        ];
                    }
                    $functionToCall = 'saveFormAnswers';
                    $functionToCallDescription = 'Guarda las respuestas del formulario de registro de ' . $businessJpa->name;
                } else {
                    $properties = [
                        "nombreCliente" => [
                            "type" => "string",
                            "description" => "Nombre completo del cliente."
                        ],
                        "correoCliente" => [
                            "type" => "string",
                            "description" => "Correo electrónico del cliente."
                        ],
                        "fuenteCliente" => [
                            "type" => "string",
                            "description" => "Fuente de referencia, muestralo como lista enumerada. Opciones válidas: Google, Facebook, Instagram, TikTok, Por un amigo, Otros (detalle exacto)."
                        ]
                    ];
                    if ($origin !== 'evoapi') {
                        $properties['telefonoCliente'] = [
                            "type" => "string",
                            "description" => "Número de teléfono del cliente incluyendo el código de área."
                        ];
                    }
                    $functionToCall = 'saveClientData';
                    $functionToCallDescription = 'Guarda la información del cliente que desea registrarse con ' . $businessJpa->name;
                }
                $body = [
                    "system_instruction" => [
                        "parts" => [["text" => $prompt]]
                    ],
                    "contents" => $messagesList,
                    "tools" => [["functionDeclarations" => [
                        [
                            "name" => $functionToCall,
                            "description" => $functionToCallDescription,
                            "parameters" => [
                                "type" => "object",
                                "properties" => $properties,
                                "required" => array_keys($properties)
                            ]
                        ]
                    ]]]
                ];

                $attempts = 0;
                $maxAttempts = 3;
                $geminiResponse = null;

                do {
                    $geminiRest = new Fetch(env('GEMINI_API_URL'), [
                        'method' => 'POST',
                        'headers' => [
                            'Content-Type' => 'application/json',
                            'X-goog-api-key' => $apiKey
                        ],
                        'body' => $body
                    ]);
                    $geminiResponse = $geminiRest->json();

                    if (isset($geminiResponse['error']['message'])) {
                        throw new \Exception($geminiResponse['error']['message']);
                    }

                    $answer = $geminiResponse['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    $function = $geminiResponse['candidates'][0]['content']['parts'][0]['functionCall'] ?? null;
                    $function_name = $function['name'] ?? null;

                    // Check if response starts with "print(default_api."
                    if ($answer && strpos(trim($answer), 'print(default_api.') === 0) {
                        $attempts++;
                        if ($attempts >= $maxAttempts) {
                            // Save fallback message
                            $answer = 'Me podrías proporcionar la información nuevamente';
                            $function = null;
                            $function_name = null;
                            break;
                        }
                        // Retry
                        continue;
                    }
                    break;
                } while ($attempts < $maxAttempts);

                if ($function && $function_name == 'saveClientData') {
                    $prompt2save = JSON::stringify($body, true) . "/n/nFunction: " . JSON::stringify($function, true);
                    $data2Save = [
                        'contact_name' => $function['args']['nombreCliente'],
                        'contact_email' => $function['args']['correoCliente'],
                        'source_channel' => $function['args']['fuenteCliente'],
                        'complete_registration' => true
                    ];
                    if ($origin !== 'evoapi') {
                        $data2Save['contact_phone'] = $function['args']['telefonoCliente'];
                    }

                    [$questions, $hasForms] = self::hasForms($clientJpa->business_id);

                    if ($hasForms) {
                        $data2Save['form_answers'] = $questions;
                        $data2Save['complete_form'] = false;
                    }

                    $clientJpa->update($data2Save);

                    $clientJpa->refresh();

                    if ($hasForms) {
                        // Primer mensaje
                        $firstName = explode(' ', trim($data2Save['contact_name']))[0];
                        self::sendWithOrigin($businessJpa, $clientJpa, "Bien {$firstName}, ya tengo tus datos.", $prompt2save, $origin);
                        Message::create([
                            'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                            'role' => 'Form',
                            'message' => 'Formulario: ' . $questions[0]['title'],
                            'microtime' => (int) (microtime(true) * 1_000_000),
                            'business_id' => $clientJpa->business_id
                        ]);
                        // Segundo mensaje
                        $welcomeMessage = $questions[0]['questions'][0]['text'];
                        if ($questions[0]['questions'][0]['closed']) {
                            try {
                                foreach ($questions[0]['questions'][0]['answers'] as $key => $value) {
                                    $q_index = $key + 1;
                                    $welcomeMessage .= Text::lineBreak() . "{$q_index}. {$value}";
                                }
                            } catch (\Throwable $th) {
                            }
                        }
                        self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, '', $origin);
                    } else {
                        $welcomeMessage = Setting::get('whatsapp-new-lead-notification-message-client', $clientJpa->business_id);
                        $welcomeMessage = Text::replaceData($welcomeMessage, $clientJpa->toArray());
                        self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, $prompt2save, $origin);
                    }
                } else if ($function && $function_name == 'saveFormAnswers') {
                    $prompt2save = JSON::stringify($body, true) . Text::lineBreak(2) . "Function: " . JSON::stringify($function, true);
                    $formAnswers = $function['args'];

                    // Obtener formularios actuales
                    $forms = $clientJpa->form_answers ?? [];

                    // Buscar el formulario por formId y marcarlo como completado
                    foreach ($forms as $f_index => $form) {
                        if ($form['id'] == $formId) {
                            $forms[$f_index]['completed'] = true;

                            // Actualizar respuestas en cada pregunta
                            $questionIndex = 0;
                            foreach ($form['questions'] as $q_index => $question) {
                                $answerKey = 'answer_' . ($questionIndex + 1);
                                if (isset($formAnswers[$answerKey])) {
                                    $forms[$f_index]['questions'][$q_index]['answer'] = $formAnswers[$answerKey];
                                }
                                $questionIndex++;
                            }
                            break;
                        }
                    }

                    // Verificar si hay algún formulario con completed false
                    $hasIncompleteForms = false;
                    foreach ($forms as $form) {
                        if (!isset($form['completed']) || $form['completed'] === false) {
                            $hasIncompleteForms = true;
                            break;
                        }
                    }

                    $clientJpa->update([
                        'form_answers' => $forms,
                        'complete_form' => !$hasIncompleteForms
                    ]);

                    if (!$hasIncompleteForms) {
                        $welcomeMessage = Setting::get('whatsapp-new-lead-notification-message-client', $clientJpa->business_id);
                        $clientData = $clientJpa->toArray();
                        unset($clientData['form_answers']);
                        $welcomeMessage = Text::replaceData($welcomeMessage, $clientData);
                        self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, $prompt2save, $origin);
                        Message::create([
                            'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                            'role' => 'Form',
                            'message' => '✓ Formulario completado',
                            'microtime' => (int) (microtime(true) * 1_000_000),
                            'business_id' => $clientJpa->business_id
                        ]);

                        // Guardando formulario
                        $formString = '';
                        foreach ($forms as $form) {
                            $formString .= "<b>{$form['title']}</b><br>";
                            foreach ($form['questions'] as $index => $question) {
                                $formString .= ($index + 1) . ". {$question['text']}<br>&emsp;{$question['answer']}<br>";
                            }
                            $formString .= '<br>';
                        }
                        ClientNote::create([
                            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                            'client_id' => $clientJpa->id,
                            'name' => 'Formulario completado',
                            'description' => $formString
                        ]);
                    } else {
                        // Find the next form that hasn't been completed
                        $nextForm = null;
                        foreach ($forms as $form) {
                            $completed = $form['completed'] ?? false;
                            if (!$completed) {
                                $nextForm = $form;
                                break;
                            }
                        }
                        if (!$nextForm) break;
                        Message::create([
                            'wa_id' => $origin == 'evoapi' ? $clientJpa->contact_phone : $clientJpa->integration_user_id,
                            'role' => 'Form',
                            'message' => 'Formulario: ' . $nextForm['title'],
                            'microtime' => (int) (microtime(true) * 1_000_000),
                            'business_id' => $clientJpa->business_id
                        ]);
                        $welcomeMessage = $nextForm['questions'][0]['text'];
                        if ($nextForm['questions'][0]['closed']) {
                            try {
                                foreach ($nextForm['questions'][0]['answers'] as $key => $value) {
                                    $q_index = $key + 1;
                                    $welcomeMessage .= Text::lineBreak() . "{$q_index}. {$value}";
                                }
                            } catch (\Throwable $th) {
                            }
                        }
                        self::sendWithOrigin($businessJpa, $clientJpa, $welcomeMessage, $prompt2save, $origin);
                    }
                } else if ($answer) {
                    $prompt2save = JSON::stringify($body, true) . Text::lineBreak(2) . "Output: " . $answer;
                    self::sendWithOrigin($businessJpa, $clientJpa, $answer, $prompt2save, $origin);
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
