<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\User;
use Exception;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use SoDe\Extend\Response;

class GmailController extends Controller
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setAuthConfig(storage_path('app/google/credentials.json'));
        $this->client->setRedirectUri(route('gmail.callback'));
        $this->client->addScope(Gmail::GMAIL_SEND);
        $this->client->addScope(Gmail::GMAIL_READONLY);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    public function check()
    {
        $response = Response::simpleTryCatch(function () {
            if (!Auth::check()) throw new Exception('Inicie sesión para continuar');
            $userJpa = Auth::user();
            $gs_token = $userJpa->gs_token;

            $this->client->setAccessToken($gs_token);

            if ($this->client->isAccessTokenExpired()) {
                if (isset($gs_token['refresh_token'])) {
                    $newToken = $this->client->fetchAccessTokenWithRefreshToken($gs_token['refresh_token']);
                    $userJpa->gs_token = array_merge($gs_token, $newToken);
                    $userJpa->save();
                } else {
                    return [
                        'authorized' => false,
                        'auth_url' => $this->client->createAuthUrl()
                    ];
                }
            }
            return ['authorized' => true];
        });

        return response($response->toArray(), $response->status);
    }

    public function callback(Request $request)
    {
        if ($request->has('code')) {
            $gs_token = $this->client->fetchAccessTokenWithAuthCode($request->code);

            if (isset($gs_token['error'])) {
                return redirect()->route('home')->with('error', 'Error en la autorización');
            }

            // Guardamos el access token y refresh token
            $userJpa = User::find(Auth::user()->id);
            $userJpa->gs_token = $gs_token; // Guardar como JSON para incluir el refresh_token
            $userJpa->save();

            return redirect()->route('KPILeads.jsx')->with('message', 'Autorización exitosa');
        }
        return redirect()->route('home')->with('error', 'Código no recibido');
    }


    /**
     * Enviar correo.
     */
    public function send(Request $request)
    {
        $userJpa = Auth::user();
        $this->client->setAccessToken($userJpa->gs_token);

        if ($this->client->isAccessTokenExpired()) {
            return redirect()->route('gmail.check');
        }

        $gmail = new Gmail($this->client);

        $message = new \Google\Service\Gmail\Message();
        $rawMessage = "From: your-email@gmail.com\r\n";
        $rawMessage .= "To: {$request->input('to')}\r\n";
        $rawMessage .= "Subject: {$request->input('subject')}\r\n\r\n";
        $rawMessage .= $request->input('body');
        $encodedMessage = rtrim(strtr(base64_encode($rawMessage), '+/', '-_'), '=');

        $message->setRaw($encodedMessage);

        try {
            $gmail->users_messages->send('me', $message);
            return response()->json(['status' => 'success', 'message' => 'Correo enviado']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

    /**
     * Listar correos con un determinado correo electrónico.
     */
    public function list(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $userJpa = Auth::user();
            $gs_token = $userJpa->gs_token;
            $this->client->setAccessToken($gs_token);

            // Refrescar el token si ha expirado
            if ($this->client->isAccessTokenExpired()) {
                if (isset($gs_token['refresh_token'])) {
                    $newToken = $this->client->fetchAccessTokenWithRefreshToken($gs_token['refresh_token']);
                    $userJpa->gs_token = array_merge($gs_token, $newToken);
                    $userJpa->save();
                } else {
                    throw new Exception('Inicie sesión para continuar');
                }
            }

            $gmail = new Gmail($this->client);

            // Obtener el parámetro de email desde el request
            $email = $request->input('email');

            // Construir la query para obtener correos tanto enviados como recibidos por ese email
            $optParams = [
                'q' => "from:$email OR to:$email"
            ];

            try {
                $messages = $gmail->users_messages->listUsersMessages('me', $optParams);
                $emails = [];

                if ($messages->getMessages()) {
                    foreach ($messages->getMessages() as $message) {
                        $messageData = $gmail->users_messages->get('me', $message->getId(), ['format' => 'full']);
                        $headers = $messageData->getPayload()->getHeaders();

                        $sender = '';
                        $to = '';
                        $subject = '';
                        $date = '';
                        $type = 'inbox'; // Por defecto, asumimos que es un correo entrante

                        // Extraer los encabezados relevantes
                        foreach ($headers as $header) {
                            switch (strtolower($header->getName())) {
                                case 'from':
                                    $sender = $header->getValue();
                                    break;
                                case 'to':
                                    $to = $header->getValue();
                                    break;
                                case 'subject':
                                    $subject = $header->getValue();
                                    break;
                                case 'date':
                                    $date = $header->getValue();
                                    break;
                            }
                        }

                        // Determinar si el correo es de entrada o salida
                        if (strtolower($sender) === strtolower($email)) {
                            $type = 'sent';
                        } else {
                            $type = 'inbox';
                        }

                        $emails[] = [
                            'id' => $message->getId(),
                            'sender' => $sender,
                            'to' => $to,
                            'subject' => $subject,
                            'date' => $date,
                            'snippet' => $messageData->getSnippet(),
                            'type' => $type // 'inbox' o 'sent'
                        ];
                    }
                }

                return $emails;
            } catch (\Exception $e) {
                throw new Exception($e->getMessage());
            }
        });

        return response($response->toArray(), $response->status);
    }
}
