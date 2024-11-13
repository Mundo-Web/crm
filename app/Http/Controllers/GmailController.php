<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\User;
use App\Models\Client as ModelsClient;
use App\Models\ClientNote;
use Exception;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;
use SoDe\Extend\Text;

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
      // Verificar si el usuario está autenticado
      if (!Auth::check()) {
        throw new Exception('Inicie sesión para continuar');
      }

      // Buscar al usuario autenticado en la base de datos
      $userJpa = User::find(Auth::id());
      if (!$userJpa) {
        throw new Exception('Usuario no encontrado');
      }

      $gs_token = $userJpa->gs_token;

      // Si no se encuentra el token de Google, devolver la URL de autenticación
      if (!$gs_token) {
        return [
          'authorized' => false,
          'auth_url' => $this->client->createAuthUrl()
        ];
      }

      // Establecer el token de acceso en el cliente
      $this->client->setAccessToken($gs_token);

      // Verificar si el token ha expirado
      if ($this->client->isAccessTokenExpired()) {
        // Si no hay refresh token, devolver la URL de autenticación
        if (empty($gs_token['refresh_token'])) {
          return [
            'authorized' => false,
            'auth_url' => $this->client->createAuthUrl()
          ];
        }

        // Intentar refrescar el token con el refresh token
        $newToken = $this->client->fetchAccessTokenWithRefreshToken($gs_token['refresh_token']);

        // Si falla al obtener un nuevo token, devolver la URL de autenticación
        if (empty($newToken['access_token'])) {
          return [
            'authorized' => false,
            'auth_url' => $this->client->createAuthUrl()
          ];
        }

        // Actualizar el token en la base de datos
        $userJpa->gs_token = array_merge($gs_token, $newToken);
        $userJpa->save();
        $this->client->setAccessToken($newToken);
      }

      // Validar si el token actual es válido
      if (!$this->client->getAccessToken()) {
        return [
          'authorized' => false,
          'auth_url' => $this->client->createAuthUrl()
        ];
      }

      // Si todo está bien, el usuario está autorizado
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

      return view('utils.refreshstorage')
        ->with('title', 'Espere un momento por favor')
        ->with('key', 'tokenUUID')
        ->with('value', Crypto::randomUUID());
    }
    return redirect()->route('home')->with('error', 'Código no recibido');
  }


  /**
   * Enviar correo.
   */
  public function send(Request $request)
  {
    $response = Response::simpleTryCatch(function ($response) use ($request) {
      // Verificar si el usuario está autenticado
      $userJpa = User::find(Auth::user()->id);
      if (!$userJpa || !$userJpa->gs_token) {
        throw new Exception('Inicie sesión para continuar');
      }

      $this->client->setAccessToken($userJpa->gs_token);

      // Refrescar el token si ha expirado
      if ($this->client->isAccessTokenExpired()) {
        $gs_token = $userJpa->gs_token;
        if (isset($gs_token['refresh_token'])) {
          $newToken = $this->client->fetchAccessTokenWithRefreshToken($gs_token['refresh_token']);
          $userJpa->gs_token = array_merge($gs_token, $newToken);
          $userJpa->save();
        } else {
          throw new Exception('El token ha expirado y no se pudo refrescar. Inicie sesión nuevamente.');
        }
      }

      $clientJpa = ModelsClient::find($request->input('to'));

      // Crear una instancia del servicio Gmail
      $gmail = new \Google\Service\Gmail($this->client);
      $message = new \Google\Service\Gmail\Message();

      // Crear un límite MIME único
      $boundary = '----=_Part_' . uniqid();

      // Construir el mensaje MIME para enviar un correo HTML con adjuntos
      $rawMessage = "From: \"{$userJpa->name} {$userJpa->lastname}\" <{$userJpa->email}>\r\n";
      $rawMessage .= "To: {$clientJpa->contact_email}\r\n";

      $ccs = $request->input('cc');
      if ($ccs && is_array($ccs) && count($ccs) > 0) {
        $ccs = implode(',', $ccs);
        $rawMessage .= "Cc: {$ccs}\r\n";
      }
      $bccs = $request->input('bcc');
      if ($bccs && is_array($bccs) && count($bccs) > 0) {
        $bccs = implode(',', $bccs);
        $rawMessage .= "Bcc: {$bccs}\r\n";
      }

      $rawMessage .= "Subject: {$request->input('subject')}\r\n";
      $rawMessage .= "MIME-Version: 1.0\r\n";
      $rawMessage .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

      // Agregar los encabezados para el hilo (In-Reply-To y References) si están presentes
      if ($request->has('inReplyTo')) {
        $inReplyTo = $request->input('inReplyTo');
        $rawMessage .= "In-Reply-To: <{$inReplyTo}>\r\n";
        $rawMessage .= "References: <{$inReplyTo}>\r\n";
      }

      $rawMessage .= "\r\n";

      // Parte 1: El cuerpo del mensaje en HTML
      $rawMessage .= "--$boundary\r\n";
      $rawMessage .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";

      $mailing_sign = Auth::user()->service_user->mailing_sign;

      if ($mailing_sign) {
        $app_url = \env('APP_URL');
        $rawMessage .= $request->input('body') . "<div><img src=\"{$app_url}/storage/signs/{$mailing_sign}\" style=\"width: 100%; max-width: 520px; max-height: 210px; object-fit: contain; object-position: center;\"></div>\r\n\r\n";
      } else {
        $rawMessage .= $request->input('body') . "\r\n\r\n";
      }

      // Parte 2: Adjuntar archivos (si los hay)
      if ($request->hasFile('attachments')) {
        foreach ($request->file('attachments') as $file) {
          $fileContent = file_get_contents($file->getRealPath());
          $encodedFile = base64_encode($fileContent);

          $rawMessage .= "--$boundary\r\n";
          $rawMessage .= "Content-Type: " . $file->getMimeType() . "; name=\"" . $file->getClientOriginalName() . "\"\r\n";
          $rawMessage .= "Content-Disposition: attachment; filename=\"" . $file->getClientOriginalName() . "\"\r\n";
          $rawMessage .= "Content-Transfer-Encoding: base64\r\n\r\n";
          $rawMessage .= chunk_split($encodedFile) . "\r\n\r\n";
        }
      }

      // Finalizar el mensaje MIME
      $rawMessage .= "--$boundary--";

      // Codificar el mensaje en base64 para la API de Gmail
      $encodedMessage = rtrim(strtr(base64_encode($rawMessage), '+/', '-_'), '=');
      $message->setRaw($encodedMessage);

      // Enviar el mensaje
      $gmail->users_messages->send('me', $message);

      // Crear una nota del cliente con los detalles del correo enviado
      $noteJpa = ClientNote::create([
        'note_type_id' => '37b1e8e2-04c4-4246-a8c9-838baa7f8187',
        'client_id' => $clientJpa->id,
        'user_id' => $userJpa->id,
        'name' => $request->input('subject'),
        'description' => $request->input('body'),
        'status_id' => $clientJpa->status_id,
        'manage_status_id' => $clientJpa->manage_status_id,
      ]);

      $response->message = 'Correo enviado con éxito';

      return ClientNote::where('id', $noteJpa->id)
        ->with(['type', 'user', 'tasks', 'tasks.assigned', 'status', 'manageStatus'])
        ->first();
    });

    return response($response->toArray(), $response->status);
  }

  /**
   * Listar correos con un determinado correo electrónico.
   */
  public function list(Request $request)
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      $userJpa = User::find(Auth::user()->id);
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
            if (Text::has(strtolower($sender), strtolower($email))) {
              $type = 'inbox';
            } else {
              $type = 'sent';
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

  public function getDetails(Request $request)
  {
    $response = Response::simpleTryCatch(function () use ($request) {
      $userJpa = User::find(Auth::user()->id);
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
      $messageId = $request->id;

      try {
        $messageData = $gmail->users_messages->get('me', $messageId, ['format' => 'full']);
        $headers = $messageData->getPayload()->getHeaders();
        $parts = $messageData->getPayload()->getParts();

        // Inicializar variables
        $sender = '';
        $to = '';
        $cc = '';
        $bcc = '';
        $subject = '';
        $date = '';
        $bodyText = '';
        $bodyHtml = '';
        $attachments = [];

        // Extraer encabezados
        foreach ($headers as $header) {
          switch (strtolower($header->getName())) {
            case 'from':
              $sender = $header->getValue();
              break;
            case 'to':
              $to = $header->getValue();
              break;
            case 'cc':
              $cc = $header->getValue();
              break;
            case 'bcc':
              $bcc = $header->getValue();
              break;
            case 'subject':
              $subject = $header->getValue();
              break;
            case 'date':
              $date = $header->getValue();
              break;
          }
        }

        // Obtener el cuerpo del mensaje
        $bodyText = $this->getBodyFromParts($parts, 'text/plain');
        $bodyHtml = $this->getBodyFromParts($parts, 'text/html');

        // Obtener detalles de los adjuntos (solo nombre y tamaño)
        foreach ($parts as $part) {
          if (isset($part['filename']) && $part['filename'] !== '' && isset($part['body']['attachmentId'])) {
            $attachments[] = [
              'filename' => $part['filename'],
              'size' => $part['body']['size'],
              'attachmentId' => $part['body']['attachmentId']
            ];
          }
        }

        return [
          'id' => $messageId,
          'sender' => $sender,
          'to' => $to,
          'cc' => $cc,
          'bcc' => $bcc,
          'subject' => $subject,
          'date' => $date,
          'bodyText' => $bodyText,
          'bodyHtml' => $bodyHtml,
          'attachments' => $attachments
        ];
      } catch (\Exception $e) {
        throw new Exception($e->getMessage());
      }
    });

    return response($response->toArray(), $response->status);
  }

  /**
   * Función para extraer el cuerpo del mensaje desde las partes del payload
   */
  private function getBodyFromParts($parts, $mimeType)
  {
    $bodyContent = '';

    foreach ($parts as $part) {
      // Si la parte tiene su propio conjunto de partes, buscar recursivamente
      if (isset($part['parts']) && is_array($part['parts'])) {
        $bodyContent .= $this->getBodyFromParts($part['parts'], $mimeType);
      } else {
        // Buscar el tipo MIME solicitado
        if ($part['mimeType'] === $mimeType) {
          $data = $part['body']['data'] ?? '';
          $decodedData = base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
          $bodyContent .= $decodedData;
        }
      }
    }

    return $bodyContent;
  }

  public function getAttachment(Request $request)
  {
    $response = new Response();

    // Obtener el usuario y el token de Google
    $userJpa = User::find(Auth::user()->id);
    $gs_token = $userJpa->gs_token;
    $this->client->setAccessToken($gs_token);

    // Refrescar el token si está expirado
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
    $messageId = $request->messageId;
    $filename = $request->filename;

    try {
      // Obtener el mensaje completo para acceder a los adjuntos
      $message = $gmail->users_messages->get('me', $messageId, ['format' => 'full']);
      $parts = $message->getPayload()->getParts();

      $contentType = 'application/octet-stream';
      $fileContent = null;

      // Buscar el adjunto por nombre
      foreach ($parts as $part) {
        if (isset($part['filename']) && $part['filename'] === $filename) {
          $contentType = $part['mimeType'] ?? 'application/octet-stream';

          // Obtener el contenido del adjunto usando el attachmentId
          $attachmentId = $part['body']['attachmentId'];
          $attachment = $gmail->users_messages_attachments->get('me', $messageId, $attachmentId);
          $fileContent = base64_decode(str_replace(['-', '_'], ['+', '/'], $attachment->getData()));
          break;
        }
      }

      // Si no se encontró el archivo o su contenido, lanzar una excepción
      if (!$fileContent) {
        throw new Exception('No se pudo encontrar el adjunto solicitado con el nombre: ' . $filename);
      }

      // Forzar la descarga del archivo con su nombre y tipo de contenido original
      return response($fileContent)
        ->header('Content-Type', $contentType)
        ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
        ->header('Content-Length', strlen($fileContent));
    } catch (\Exception $e) {
      $response->status = 400;
      $response->message = $e->getMessage();
      return response($response->toArray(), $response->status);
    }
  }
}
