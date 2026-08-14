<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\User;
use App\Models\Client as ModelsClient;
use App\Models\ClientNote;
use Carbon\Carbon;
use Exception;
use Google\Client;
use GuzzleHttp\Client as HttpClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;

class GoogleCalendarController extends Controller
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setAuthConfig(storage_path('app/google/credentials.json'));
        $this->client->setRedirectUri(route('google-calendar.callback'));
        $this->client->addScope('https://www.googleapis.com/auth/calendar.events');
        $this->client->addScope('https://www.googleapis.com/auth/calendar.readonly');
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    /**
     * Obtiene el token de acceso válido del usuario actual refrescándolo si expiró.
     */
    private function getValidAccessToken(User $user)
    {
        $gs_token = $user->gs_token;
        if (!$gs_token) {
            throw new Exception('Inicie sesión con Google para continuar');
        }

        $this->client->setAccessToken($gs_token);

        if ($this->client->isAccessTokenExpired()) {
            if (empty($gs_token['refresh_token'])) {
                throw new Exception('El token de Google ha expirado. Por favor vincule su cuenta nuevamente.');
            }

            $newToken = $this->client->fetchAccessTokenWithRefreshToken($gs_token['refresh_token']);
            if (empty($newToken['access_token'])) {
                throw new Exception('No se pudo refrescar el token de Google. Inicie sesión de nuevo.');
            }

            $user->gs_token = array_merge($gs_token, $newToken);
            $user->save();
            $this->client->setAccessToken($newToken);
            return $newToken['access_token'];
        }

        return $this->client->getAccessToken()['access_token'] ?? $gs_token['access_token'];
    }

    /**
     * Verifica si el usuario actual tiene autorización válida de Google Calendar.
     */
    public function check()
    {
        $response = Response::simpleTryCatch(function () {
            if (!Auth::check()) {
                throw new Exception('Inicie sesión para continuar');
            }

            $user = User::find(Auth::id());
            if (!$user) {
                throw new Exception('Usuario no encontrado');
            }

            $gs_token = $user->gs_token;
            if (!$gs_token) {
                return [
                    'authorized' => false,
                    'auth_url' => $this->client->createAuthUrl()
                ];
            }

            try {
                $token = $this->getValidAccessToken($user);
                return [
                    'authorized' => !empty($token),
                    'auth_url' => $this->client->createAuthUrl()
                ];
            } catch (\Throwable $th) {
                return [
                    'authorized' => false,
                    'auth_url' => $this->client->createAuthUrl()
                ];
            }
        });

        return response($response->toArray(), $response->status);
    }

    /**
     * Inicia el flujo OAuth desde la web o popup
     */
    public function connect(Request $request)
    {
        return redirect($this->client->createAuthUrl());
    }

    /**
     * Callback OAuth 2.0 para Google Calendar
     */
    public function callback(Request $request)
    {
        if ($request->has('code')) {
            $gs_token = $this->client->fetchAccessTokenWithAuthCode($request->code);

            if (isset($gs_token['error'])) {
                return redirect()->route('home')->with('error', 'Error en la autorización de Google Calendar');
            }

            $user = User::find(Auth::id());
            if ($user) {
                $prevToken = is_array($user->gs_token) ? $user->gs_token : [];
                $user->gs_token = array_merge($prevToken, $gs_token);
                $user->save();
            }

            return view('utils.refreshstorage')
                ->with('title', 'Google Calendar vinculado con éxito')
                ->with('key', 'tokenUUID')
                ->with('value', Crypto::randomUUID());
        }

        return redirect()->route('home')->with('error', 'Código de autorización no recibido');
    }

    /**
     * Crear un nuevo evento/cita en Google Calendar para un lead
     */
    public function createEvent(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            if (!Auth::check()) {
                throw new Exception('Inicie sesión para continuar');
            }

            $user = User::find(Auth::id());
            if (!$user || !$user->gs_token) {
                throw new Exception('No tiene una cuenta de Google vinculada. Por favor conecte Google Calendar.');
            }

            $accessToken = $this->getValidAccessToken($user);

            $title       = $request->input('title', 'Cita con cliente');
            $description = $request->input('description', '');
            $startStr    = $request->input('start_date'); // Formato: Y-m-d H:i:s o Y-m-d\TH:i:s
            $endStr      = $request->input('end_date');
            $leadId      = $request->input('lead_id');
            $location    = $request->input('location', 'Google Meet / En línea');

            if (!$startStr) {
                throw new Exception('La fecha y hora de inicio son requeridas');
            }

            $startDate = Carbon::parse($startStr, 'America/Lima');
            $endDate   = $endStr ? Carbon::parse($endStr, 'America/Lima') : $startDate->copy()->addHour();

            // Construir payload del evento para la API de Google Calendar v3
            $eventPayload = [
                'summary'     => $title,
                'description' => $description,
                'location'    => $location,
                'start'       => [
                    'dateTime' => $startDate->format('Y-m-d\TH:i:sP'),
                    'timeZone' => 'America/Lima',
                ],
                'end'         => [
                    'dateTime' => $endDate->format('Y-m-d\TH:i:sP'),
                    'timeZone' => 'America/Lima',
                ],
            ];

            // Agregar al lead como asistente si tiene email
            $clientModel = null;
            if ($leadId) {
                $clientModel = ModelsClient::find($leadId);
                if ($clientModel && !empty($clientModel->contact_email)) {
                    $eventPayload['attendees'] = [
                        [
                            'email'       => $clientModel->contact_email,
                            'displayName' => $clientModel->name,
                        ]
                    ];
                }
            }

            $http = new HttpClient();
            $res = $http->post('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type'  => 'application/json',
                ],
                'json' => $eventPayload,
            ]);

            $eventData = json_decode($res->getBody()->getContents(), true);

            // Registrar nota en el lead si aplica
            if ($clientModel) {
                ClientNote::create([
                    'note_type_id'     => '16cfd21a-6f4e-4f0e-bdfa-b1523315a6b0', // Tipo Tarea / Cita
                    'client_id'        => $clientModel->id,
                    'user_id'          => $user->id,
                    'name'             => '📅 Cita en Google Calendar: ' . $title,
                    'description'      => "Evento agendado para el " . $startDate->format('d/m/Y h:i A') . ".\nEnlace: " . ($eventData['htmlLink'] ?? ''),
                    'status_id'        => $clientModel->status_id,
                    'manage_status_id' => $clientModel->manage_status_id,
                ]);
            }

            return [
                'id'        => $eventData['id'] ?? null,
                'htmlLink'  => $eventData['htmlLink'] ?? null,
                'summary'   => $eventData['summary'] ?? $title,
                'start'     => $eventData['start']['dateTime'] ?? null,
                'end'       => $eventData['end']['dateTime'] ?? null,
            ];
        });

        return response($response->toArray(), $response->status);
    }

    /**
     * Listar próximos eventos del calendario
     */
    public function listEvents(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            if (!Auth::check()) {
                throw new Exception('Inicie sesión para continuar');
            }

            $user = User::find(Auth::id());
            if (!$user || !$user->gs_token) {
                return [];
            }

            $accessToken = $this->getValidAccessToken($user);

            $http = new HttpClient();
            $timeMin = Carbon::now('America/Lima')->startOfDay()->format('c');
            $res = $http->get('https://www.googleapis.com/calendar/v3/calendars/primary/events', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'query' => [
                    'maxResults'   => 20,
                    'orderBy'      => 'startTime',
                    'singleEvents' => 'true',
                    'timeMin'      => $timeMin,
                ]
            ]);

            $data = json_decode($res->getBody()->getContents(), true);
            $items = $data['items'] ?? [];
            $events = [];

            foreach ($items as $item) {
                $start = $item['start']['dateTime'] ?? ($item['start']['date'] ?? null);
                $end   = $item['end']['dateTime'] ?? ($item['end']['date'] ?? null);
                $events[] = [
                    'id'          => $item['id'] ?? '',
                    'summary'     => $item['summary'] ?? '',
                    'description' => $item['description'] ?? '',
                    'start'       => $start,
                    'end'         => $end,
                    'htmlLink'    => $item['htmlLink'] ?? '',
                    'location'    => $item['location'] ?? '',
                ];
            }

            return $events;
        });

        return response($response->toArray(), $response->status);
    }
}
