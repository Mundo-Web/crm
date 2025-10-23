<?php

namespace App\Http\Controllers;

use App\Jobs\SendNewLeadNotification;
use App\Models\Message;
use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Setting;
use App\Models\Task;
use Carbon\Carbon;
use Exception;
use GuzzleHttp\Psr7\Query;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Fetch;
use SoDe\Extend\File;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

class MessageController extends BasicController
{
    public $model = Message::class;
    public $reactView = 'Messages';

    public function countUnSeenMessages(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            return Message::whereHas('client', function ($q) use ($request) {
                $q->where('business_id', Auth::user()->business_id);
                foreach ($request->assigneds ?? [] as $assigned) {
                    $q->where('assigned_to', $assigned);
                }
            })
            ->where('business_id', Auth::user()->business_id)
            ->where('seen', false)
            ->count();
        });
        return response($response->toArray(), $response->status);
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::with('campaign');
    }

    public function setPaginationSummary(Request $request, string $model, Builder $query)
    {
        $query = clone $query;
        $updated = $query->where('seen', false)
            ->update(['seen' => true]);
        if ($request->summary && $updated > 0) {
            try {
                $clientJpa = Client::select('id', 'contact_name', 'contact_phone', 'last_message', 'last_message_microtime')
                    ->where('business_id', Auth::user()->business_id)
                    ->where('contact_phone', $request->summary['contact_phone'])
                    ->orderBy('updated_at', 'DESC')
                    ->first();
                $clientJpa->loadCount(['unSeenMessages']);
                EventController::notify('client.updated', $clientJpa->toArray(), ['business_id' => Auth::user()->business_id]);
            } catch (\Throwable $th) {
                // Silently skip if client does not exist or any other error occurs
            }
        }
        return [];
    }

    public function send(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            new Fetch(env('WA_URL') . '/api/send', [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'from' => 'atalaya-' . Auth::user()->business_uuid,
                    'to' => [$request->to],
                    'content' => $request->message
                ]
            ]);
        });
        return response($response->toArray(), $response->status);
    }

    private function getData(Client $jpa)
    {
        $data = ['name' => null, 'email' => null];
        if ($jpa->contact_name && $jpa->contact_name != 'Lead anonimo') {
            $data['name'] = $jpa->contact_name;
        }
        if ($jpa->contact_email && $jpa->contact_email != 'unknown@atalaya.pe') {
            $data['email'] = $jpa->contact_email;
        }
        return $data;
    }

    private function moveArchived2Lead(Business $businessJpa, Client $archiveJpa)
    {
        $archiveJpa->status = true;
        $archiveJpa->assigned_to = null;
        $archiveJpa->status_id = Setting::get('default-lead-status', $businessJpa->id);
        $archiveJpa->manage_status_id = Setting::get('default-manage-lead-status', $businessJpa->id);
        $archiveJpa->created_at = Trace::getDate('mysql');
        $archiveJpa->updated_at = Trace::getDate('mysql');

        $data = $this->getData($archiveJpa);

        $archiveJpa->complete_registration = $data['name'] && $data['email'];
        $archiveJpa->save();

        if ($data['name'] && $data['email']) {
            new Fetch(env('WA_URL') . '/api/send',  [
                'method' => 'POST',
                'headers' => [
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'body' => [
                    'from' => 'atalaya-' . $businessJpa->uuid,
                    'to' => [$archiveJpa->contact_phone],
                    'content' => 'Hola ' . explode(' ', $archiveJpa->contact_name)[0] . ', un gusto verte otra vez. En un momento un ejecutivo se pondra en contacto contigo.'
                ]
            ]);
            SendNewLeadNotification::dispatchAfterResponse($archiveJpa, $businessJpa, false);
            $this->createFirstNote($archiveJpa);
            throw new Exception('Se ha movido el registro de "archivado" a "lead"');
        }
        return $archiveJpa;
    }

    private function registerNewLead(Request $request, Business $businessJpa, array $data)
    {
        return Client::updateOrCreate([
            'business_id' => $businessJpa->id,
            'contact_phone' => $data['contact_phone'],
            'status_id' => Setting::get('default-lead-status', $businessJpa->id),
            'manage_status_id' => Setting::get('default-manage-lead-status', $businessJpa->id),
            // 'complete_registration' => false,
            'status' => true
        ], [
            'name' => $data['contact_name'] ?? 'Lead anonimo',
            'contact_name' => $data['contact_name'] ?? 'Lead anonimo',
            'message' => $data['message'],
            'source' => 'Externo',
            'triggered_by' => 'Gemini AI',
            'origin' => 'WhatsApp',
            'date' => Trace::getDate('date'),
            'time' => Trace::getDate('time'),
            'ip' => $request->ip()
        ]);
    }

    private function cloneNewLead(Request $request, Business $businessJpa, Client $clientJpa)
    {
        unset($clientJpa->client_status);
        unset($clientJpa->status_table_id);
        $leadJpa = $clientJpa->replicate();
        $leadJpa->assigned_to = null;
        $leadJpa->status_id = Setting::get('default-lead-status', $clientJpa->business_id);
        $leadJpa->manage_status_id = Setting::get('default-manage-lead-status', $clientJpa->business_id);
        $leadJpa->complete_registration = true;
        $leadJpa->message = $request->message;
        $leadJpa->save();

        new Fetch(\env('WA_URL') . '/api/send',  [
            'method' => 'POST',
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'body' => [
                'from' => 'atalaya-' . $businessJpa->uuid,
                'to' => [$leadJpa->contact_phone],
                'content' => 'Hola ' . explode(' ', $leadJpa->contact_name)[0] . ', veo que has sido cliente nuestro. En un momento un ejecutivo se pondra en contacto contigo.'
            ]
        ]);

        SendNewLeadNotification::dispatchAfterResponse($leadJpa, $businessJpa, false);
        $this->createFirstNote($leadJpa);
        throw new Exception('Se ha clonado el registro de "cliente" como "lead"');
    }

    private function createFirstNote(Client $leadJpa)
    {
        $noteJpa = ClientNote::create([
            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
            'client_id' => $leadJpa->id,
            'name' => 'Lead anonimo',
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

    public function byPhone(Request $request, string $sessionId)
    {
        $response = Response::simpleTryCatch(function ($response) use ($sessionId, $request) {
            [, $businessUUID] = \explode('-', $sessionId, 2);

            $businessJpa = Business::where('uuid', $businessUUID)->first();
            if (!$businessJpa) throw new Exception('No existe una empresa vinculada a esta sesion');

            $clientExists = Client::select([
                'clients.*',
                'clients.status AS client_status',
                'status.table_id AS status_table_id'
            ])
                ->join('statuses AS status', 'status.id', 'clients.status_id')
                ->where('clients.business_id', $businessJpa->id)
                ->where(function ($query) use ($request) {
                    return $query->where('clients.contact_phone', $request->waId)
                        ->orWhere('clients.contact_phone', $request->justPhone);
                })
                // ->where('complete_registration', true)
                // ->whereNotNull('assigned_to')
                // ->where('status', true)
                ->orderBy('clients.created_at', 'DESC')
                ->first();

            $leadJpa = new Client();
            if (!$clientExists) {
                $leadJpa = $this->registerNewLead($request, $businessJpa, [
                    'contact_phone' => $request->waId,
                    'contact_name' => $request->contact_name,
                    'message' => $request->message
                ]);
            } else {
                $clientExists->contact_phone = $request->waId;
                if ($clientExists->client_status == null) {
                    $leadJpa = $this->moveArchived2Lead($businessJpa, $clientExists);
                } else  if ($clientExists->status_table_id == 'a8367789-666e-4929-aacb-7cbc2fbf74de') {
                    $this->cloneNewLead($request, $businessJpa, $clientExists);
                } else if ($clientExists->assigned_to) {
                    throw new Exception('El lead ya esta siendo atendido');
                } else if ($clientExists->complete_registration) {
                    throw new Exception('El lead ya ha sido registrado en Atalaya');
                } else {
                    $leadJpa = $clientExists;
                }
            }

            if (!$request->from_me && $leadJpa->wasRecentlyCreated) {
                $this->createFirstNote($leadJpa);
            }

            $businessApiKey = Setting::get('gemini-api-key', $businessJpa->id);
            if (!$businessApiKey) throw new Exception('Esta empresa no tiene integracion con AI');


            if ($request->from_me) {
                $response->summary = [
                    'alreadySent' => Message::where('wa_id', 'like', "%{$request->waId}")
                        ->where('message', $request->message)
                        ->where('created_at', '>=', now()->subSeconds(10))
                        ->exists(),
                ];
                return;
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
                    ->where('created_at', '>=', now()->subSeconds(10))
                    ->exists(),
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
        $body['microtime'] = (int) (microtime(true) * 1_000_000);

        $messageJpa = Message::where('business_id', $businessJpa->id)
            ->where('wa_id', $body['wa_id'])
            ->where('message', 'like', '/attachment:%')
            ->where('message', 'like', '%' . $body['message'])
            ->where('created_at', '>=', now()->subSeconds(10))
            ->first();
        if ($messageJpa) throw new Exception('Ya se ha registrado este mensaje');

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
