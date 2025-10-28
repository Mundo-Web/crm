<?php

namespace App\Http\Controllers;

use App\Jobs\MetaAssistantJob;
use App\Models\Atalaya\Business;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Setting;
use App\Models\Task;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

class WebhookController extends BasicController
{
    public $reactView = 'Webhooks';

    public function setReactViewProperties(Request $request)
    {
        $integrations = Integration::withCount(['leads'])
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();
        return [
            'apikey' => Auth::user()->business_uuid,
            'auth_token' => hash('sha256', Auth::user()->business_uuid),
            'integrations' => $integrations
        ];
    }

    public function getAndSaveMedia($businessJpa, $id, $type)
    {
        try {
            $res = new Fetch(env('EVOAPI_URL') . '/chat/getBase64FromMediaMessage/' . $businessJpa->person->document_number, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'apikey' => $businessJpa->uuid
                ],
                'body' => ['message' => ['key' => ['id' => $id]]]
            ]);
            if (!$res->ok) throw new Exception('Ocurrió un error al obtener el archivo');
            $data = $res->json();

            // Extraer extensión del filename
            $filename = $data['fileName'] ?? '';
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            if (!$extension) $extension = 'bin';

            // Decodificar base64
            $base64 = $data['base64'] ?? '';
            if (!$base64) throw new Exception('No se recibió base64');

            $fileContent = base64_decode($base64);
            if ($fileContent === false) throw new Exception('Error al decodificar base64');

            // Guardar en /storage/app/images/whatsapp/
            $storagePath = storage_path('app/images/whatsapp');
            if (!is_dir($storagePath)) mkdir($storagePath, 0755, true);

            $savedFilename = $type . '-' . $id . '.' . $extension;
            $fullPath = $storagePath . '/' . $savedFilename;
            file_put_contents($fullPath, $fileContent);

            return $savedFilename;
        } catch (\Throwable $th) {
            dump($th->getMessage());
            return null;
        }
    }

    public function webhook(Request $request, string $business_uuid)
    {
        $response = Response::simpleTryCatch(function () use ($request, $business_uuid) {
            $data = $request->all();

            $fromMe = $data['data']['key']['fromMe'];
            $isGroup = isset($data['data']['key']['participant']);

            if ($isGroup) return;

            $businessJpa = Business::with(['person'])
                ->where('uuid', $business_uuid)
                ->where('status', true)
                ->first();
            if (!$businessJpa) throw new Exception('Error, negocio no encontrado o inactivo');

            $messageType = $data['data']['messageType'] ?? 'conversation';
            $waId = explode('@', $data['data']['key']['remoteJid'])[0];
            $message = $data['data']['message'][$messageType]['caption'] ?? $data['data']['message'][$messageType] ?? '';

            if ($messageType === 'audioMessage') {
                $filename = $this->getAndSaveMedia($businessJpa, $data['data']['key']['id'], 'audio');
                if (!$filename) throw new Exception('El archivo no se pudo guardar o no se generó');
                $message = '/audio:' . $filename;
            } else if ($messageType === 'imageMessage') {
                $filename = $this->getAndSaveMedia($businessJpa, $data['data']['key']['id'], 'image');
                if (!$filename) throw new Exception('El archivo no se pudo guardar o no se generó');
                $message = trim('/image:' . $filename . Text::lineBreak() . $message);
            }

            $messageJpa = Message::create([
                'wa_id' => $waId,
                'role' => $fromMe ? 'AI' : 'Human',
                'message' => $message,
                'microtime' => (int) (microtime(true) * 1_000_000),
                'business_id' => $businessJpa->id
            ]);

            if ($fromMe) return;

            $alreadyExists = Client::query()
                ->where('contact_phone', $waId)
                ->where('business_id', $businessJpa->id)
                ->where('status', true)
                ->first();

            if ($alreadyExists && $alreadyExists->complete_registration && $alreadyExists->complete_form !== false) return;

            $exists = $alreadyExists !== null;

            $campaignJpa = null;
            if (!$exists) {
                $campaignCode = null;
                if (is_string($message) && preg_match('/\[([A-Z0-9]{3,})\]/i', $message, $matches)) {
                    $campaignCode = strtoupper($matches[1]);
                }
                if ($campaignCode) {
                    $campaignJpa = Campaign::query()
                        ->where('code', $campaignCode)
                        ->where('business_id', $businessJpa->id)
                        ->where('status', true)
                        ->first();
                    $messageJpa->campaign_id = $campaignJpa->id;
                    $messageJpa->save();
                }
            }

            $completeRegistration = $alreadyExists->complete_registration ?? false;
            $clientJpa = Client::updateOrCreate([
                'contact_phone' => $waId,
                'business_id' => $businessJpa->id,
            ], [
                'message' => $message ?? 'Sin mensaje',
                'contact_name' => $completeRegistration ? $alreadyExists->contact_name : $data['data']['pushName'],
                'name' => $completeRegistration ? $alreadyExists->name : $data['data']['pushName'],
                'source' => 'Externo',
                'date' => Trace::getDate('date'),
                'time' => Trace::getDate('time'),
                'ip' => $request->ip(),
                'status_id' => Setting::get('default-lead-status', $businessJpa->id),
                'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
                'origin' => 'WhatsApp',
                'triggered_by' => 'Gemini AI',
                'status' => true,
                'complete_registration' => $completeRegistration
            ]);

            if ($campaignJpa) {
                $clientJpa->campaign_id = $campaignJpa->id;
                $clientJpa->save();
            }

            $hasApikey = Setting::get('gemini-api-key', $businessJpa->id);

            if ($hasApikey && !$clientJpa->complete_registration) {
                MetaAssistantJob::dispatchAfterResponse($clientJpa, $messageJpa, 'evoapi');
            } else if ($hasApikey && $clientJpa->complete_registration && $clientJpa->complete_form == false) {
                MetaAssistantJob::dispatchAfterResponse($clientJpa, $messageJpa, 'evoapi');
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
        }, fn($res, $th) => dump($th->getMessage()));
        return response($response->toArray(), 200);
    }
}
