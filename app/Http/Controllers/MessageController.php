<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Message;
use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\ClientNote;
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

class MessageController extends BasicController
{
    public $model = Message::class;
    public $reactView = 'Messages';

    public function byPhone(Request $request, string $sessionId)
    {
        $response = dxResponse::simpleTryCatch(function ($response) use ($sessionId, $request) {
            [, $businessUUID] = \explode('-', $sessionId, 2);

            $businessJpa = Business::where('uuid', $businessUUID)->first();
            if (!$businessJpa) throw new Exception('No existe una empresa vinculada a esta sesion');

            $businessApiKey = Setting::get('gemini-api-key', $businessJpa->id);
            if (!$businessApiKey) throw new Exception('Esta empresa no tiene integracion con AI');

            $clientJpa = Client::where('business_id', $businessJpa->id)
                ->where(function ($query) use ($request) {
                    return $query->where('contact_phone', $request->waId)
                        ->orWhere('contact_phone', $request->justPhone);
                })
                // ->where('complete_registration', true)
                // ->whereNotNull('assigned_to')
                // ->where('status', true)
                ->first();

            if ($clientJpa && $clientJpa->status == true && $clientJpa->complete_registration == true && !$clientJpa->assigned_to) {
                throw new Exception('El cliente ya ha sido registrado en Atalaya');
            }

            if (!$request->from_me) {
                $leadJpa = Client::updateOrCreate([
                    'business_id' => $businessJpa->id,
                    'contact_phone' => $request->waId,
                    'status_id' => Setting::get('default-lead-status', $businessJpa->id),
                    'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
                    'complete_registration' => false,
                ], [
                    'name' => $request->contact_name ?? 'Lead anonimo',
                    'contact_name' => $request->contact_name ?? 'Lead anonimo',
                    'message' => $request->message,
                    'source' => 'Externo',
                    'triggered_by' => 'Gemini AI',
                    'origin' => 'WhatsApp',
                    'date' => Trace::getDate('date'),
                    'time' => Trace::getDate('time'),
                    'ip' => $request->ip()
                ]);
                if ($leadJpa->wasRecentlyCreated) {
                    $noteJpa = ClientNote::create([
                        'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                        'client_id' => $leadJpa->id,
                        'name' => 'Lead nuevo',
                        'description' => UtilController::replaceData(
                            Setting::get('whatsapp-new-lead-notification-message', $leadJpa->business_id),
                            $leadJpa->toArray()
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
                }
            }

            $needsExecutive = Message::where('business_id', $businessJpa->id)
                ->where('wa_id', $request->waId)
                ->where('message', ':STOP')
                ->where('role', 'AI')
                ->exists();
            if ($needsExecutive) throw new Exception('Esta persona requiere la atencion de un ejecutivo');

            $messages = Message::select()
                ->where('business_id', $businessJpa->id)
                ->where('wa_id', $request->waId)
                ->orderBy('created_at', 'DESC')
                ->limit(40)
                ->get();
            $prompt = File::get('../storage/app/utils/gemini-prompt.txt');
            $businessEmail = Setting::get('email-new-lead-notification-message-owneremail', $businessJpa->id);
            $businessServices = Setting::get('gemini-what-business-do', $businessJpa->id);
            $response->summary = [
                'api-key' => $businessApiKey,
                'prompt' => Text::replaceData($prompt, [
                    'nombreEmpresa' => $businessJpa->name,
                    'correoEmpresa' => $businessEmail ?? 'hola@mundoweb.pe',
                    'servicios' => $businessServices ?? 'algunos servicios',
                ]),
                'alreadySent' => Message::where('wa_id', 'like', "%{$request->waId}")
                    ->where('message', $request->message)
                    ->where('role', 'AI')
                    ->exists(),
                'client' => $clientJpa?->toArray() ?? null
            ];
            return $messages;
        });
        return response($response->toArray(), $response->status);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        [, $businessUUID] = explode('-', $body['session_id'], 2);
        $businessJpa = Business::where('uuid', $businessUUID)->first();
        if (!$businessJpa) throw new Exception('No existe una empresa vinculada a esta sesion');
        $body['business_id'] = $businessJpa->id;
        return $body;
    }

    public function help(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            [, $businessUUID] = \explode('-', $request->session_id, 2);
            $businessJpa = Business::where('uuid', $businessUUID)->first();
            if (!$businessJpa) throw new Exception('No existe una empresa vinculada a esta sesion');

            $to = Text::keep(Setting::get('whatsapp-new-lead-notification-waid', $businessJpa->id), '0123456789@gc.us');

            new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'from' => 'atalaya-' . $businessJpa->uuid,
                    'to' => [$to],
                    'content' => $request->message
                ]
            ]);
        });
        return response($response->toArray(), $response->status);
    }
}
