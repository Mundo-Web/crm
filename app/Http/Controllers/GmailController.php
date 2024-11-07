<?php

namespace App\Http\Controllers;

use App\Http\Middleware\Authenticate;
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

    /**
     * Verificar si hay autorización o devolver URL de autenticación.
     */
    public function check()
    {
        $response = Response::simpleTryCatch(function () {
            if (!Auth::check()) throw new Exception('Inicie sesión para continuar');
            $userJpa = Auth::user();
            if ($userJpa->gs_token) return ['authorized' => true];
            $authUrl = $this->client->createAuthUrl();
            return [
                'authorized' => false,
                'auth_url' => $authUrl
            ];
        });
        return response($response->toArray(), $response->status);
    }

    /**
     * Callback para procesar el token de Google después de la autenticación.
     */
    public function callback(Request $request)
    {
        if ($request->has('code')) {
            $token = $this->client->fetchAccessTokenWithAuthCode($request->code);
            session(['google_access_token' => $token]);
            return redirect()->route('home')->with('message', 'Autorización exitosa');
        }
        return redirect()->route('home')->with('error', 'Error en la autorización');
    }

    /**
     * Enviar correo.
     */
    public function send(Request $request)
    {
        $this->client->setAccessToken(session('google_access_token'));

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
        $this->client->setAccessToken(session('google_access_token'));

        if ($this->client->isAccessTokenExpired()) {
            return redirect()->route('gmail.check');
        }

        $gmail = new Gmail($this->client);

        $query = $request->input('email');
        $optParams = [
            'q' => "from:$query OR to:$query"
        ];

        try {
            $messages = $gmail->users_messages->listUsersMessages('me', $optParams);
            $emails = [];

            foreach ($messages->getMessages() as $message) {
                $messageData = $gmail->users_messages->get('me', $message->getId());
                $emails[] = [
                    'id' => $message->getId(),
                    'snippet' => $messageData->getSnippet()
                ];
            }

            return response()->json(['status' => 'success', 'emails' => $emails]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
