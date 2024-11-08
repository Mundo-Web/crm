<?php

namespace App\Http\Controllers;

use App\Http\Middleware\Authenticate;
use App\Models\Atalaya\User;
use Exception;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $this->client->setPrompt('select_account consent');
    }

    public function check()
    {
        $response = Response::simpleTryCatch(function () {
            if (!Auth::check()) throw new Exception('Inicie sesión para continuar');
            $userJpa = Auth::user();
            $this->client->setAccessToken($userJpa->gs_token);

            if ($this->client->isAccessTokenExpired()) {
                $authUrl = $this->client->createAuthUrl();
                return [
                    'authorized' => false,
                    'auth_url' => $authUrl
                ];
            }
            return [
                'authorized' => true
            ];
        });
        return response($response->toArray(), $response->status);
    }

    public function callback(Request $request)
    {
        if ($request->has('code')) {
            $gs_token = $this->client->fetchAccessTokenWithAuthCode($request->code);
            $userJpa = User::find(Auth::user()->id);
            $userJpa->gs_token = $gs_token;
            $userJpa->save();
            return redirect()->route('KPILeads.jsx')->with('message', 'Autorización exitosa');
        }
        return redirect()->route('home')->with('error', 'Error en la autorización');
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
        $gs_token = Auth::user()->gs_token;
        $this->client->setAccessToken($gs_token);

        // Verificamos si el token ha expirado
        if ($this->client->isAccessTokenExpired()) {
            return redirect()->route('gmail.check');
        }

        $gmail = new Gmail($this->client);

        // Obtenemos el correo ingresado como parámetro de búsqueda
        $query = $request->input('email');
        $optParams = [
            'q' => "from:$query OR to:$query"
        ];

        try {
            // Obtenemos la lista de mensajes
            $messages = $gmail->users_messages->listUsersMessages('me', $optParams);
            $emails = [];

            if ($messages->getMessages()) {
                foreach ($messages->getMessages() as $message) {
                    // Obtenemos los detalles de cada mensaje
                    $messageData = $gmail->users_messages->get('me', $message->getId(), ['format' => 'full']);

                    // Extraemos los encabezados
                    $headers = $messageData->getPayload()->getHeaders();

                    // Inicializamos las variables
                    $sender = '';
                    $to = '';
                    $subject = '';
                    $date = '';

                    // Extraemos la información de los encabezados
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

                    // Almacenamos la información en el array de emails
                    $emails[] = [
                        'id' => $message->getId(),
                        'sender' => $sender,
                        'to' => $to,
                        'subject' => $subject,
                        'date' => $date,
                        'snippet' => $messageData->getSnippet()
                    ];
                }
            }

            return response()->json(['status' => 'success', 'emails' => $emails]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }

}
