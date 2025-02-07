<?php

namespace App\Http\Controllers;

use App\Jobs\SaveNotification;
use App\Jobs\SendNewLeadNotification;
use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Message;
use App\Models\NoteType;
use App\Models\Process;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Status;
use App\Models\Task;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

class LeadController extends BasicController
{
    public $model = Client::class;
    public $softDeletion = false;
    public $reactView = 'Leads';
    public $prefix4filter = 'clients';

    public function setReactViewProperties(Request $request)
    {
        $statuses = Status::select()
            ->where('table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();
        $defaultClientStatus = Setting::get('default-client-status');
        $defaultLeadStatus = Setting::get('default-lead-status');
        $noteTypes = NoteType::all();

        $manageStatuses = Status::select()
            ->where('table_id', '9c27e649-574a-47eb-82af-851c5d425434')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $products = Product::with('type')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $processes = Process::where('business_id', Auth::user()->business_id)->get();

        return [
            'lead' => $request->lead,
            'manageStatuses' => $manageStatuses,
            'defaultClientStatus' => $defaultClientStatus,
            'defaultLeadStatus' => $defaultLeadStatus,
            'statuses' => $statuses,
            'noteTypes' => $noteTypes,
            'products' => $products,
            'processes' => $processes,
        ];
    }

    public function get(Request $request, string $lead)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($lead) {
            $data = $this->model::select('clients.*')
                ->withCount(['notes', 'tasks', 'pendingTasks', 'products'])
                ->with(['status', 'assigned', 'manageStatus', 'creator'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
                ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.id', $lead)
                ->first();
            $response->data = $data;
        });
        return response($response->toArray(), $response->status);
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('clients.*')
            ->withCount(['notes', 'tasks', 'pendingTasks', 'products'])
            ->with(['status', 'assigned', 'manageStatus', 'creator'])
            ->join('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
            ->leftJoin('users AS assigned', 'assigned.id', 'clients.assigned_to')
            ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->where('clients.status', true)
            ->where('clients.business_id', Auth::user()->business_id);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $exists = Client::where('id', $request->id)->exists();
        if (!$exists) {
            $status = Setting::get('default-lead-status');
            $manage_status = Setting::get('default-manage-lead-status');
            $body['status_id'] = $status;
            $body['manage_status_id'] = $manage_status;
        }
        $body['created_by'] = Auth::user()->service_user->id;
        $body['source'] = env('APP_NAME');
        $body['origin'] = env('APP_NAME');
        $body['triggered_by'] = 'Formulario';
        $body['date'] = Trace::getDate('date');
        $body['time'] = Trace::getDate('time');
        $body['ip'] = $request->ip();
        $body['complete_registration'] = true;
        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if (!$isNew) {
            ClientNote::create([
                'client_id' => $jpa->id,
                'name' => Auth::user()->name . ' actualizo datos del lead',
            ]);
            $newJpa = Client::with(['status', 'assigned', 'manageStatus', 'creator'])
                ->where('id', $jpa->id)
                ->first();
            return $newJpa;
        }
        $noteJpa = ClientNote::create([
            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
            'client_id' => $jpa->id,
            'name' => 'Lead nuevo',
            'description' => UtilController::replaceData(
                Setting::get('whatsapp-new-lead-notification-message', $jpa->business_id),
                $jpa->toArray()
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

        // if ($jpa->created_by) {
        //     SaveNotification::dispatchAfterResponse([
        //         'name' => 'Nuevo lead',
        //         'message' =>  Auth::user()->service_user->fullname . ' ha creado un nuevo lead.',
        //         'module' => 'Leads',
        //         'link_to' => '/leads/' . $jpa->id,
        //         'created_by' => Auth::user()->service_user->id,
        //         'business_id' => $jpa->business_id
        //     ]);
        // } else {
        //     SaveNotification::dispatchAfterResponse([
        //         'icon' => 'fas fa-user-plus',
        //         'name' => 'Nuevo lead',
        //         'message' =>  'Se ha registrado un nuevo lead desde ' . $jpa->origin,
        //         'module' => 'Leads',
        //         'link_to' => '/leads/' . $jpa->id,
        //         'business_id' => $jpa->business_id
        //     ]);
        // }

        $newJpa = Client::with(['status', 'assigned', 'manageStatus', 'creator'])
            ->where('id', $jpa->id)
            ->first();

        return $newJpa;
    }

    public function all(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $clients = Client::select('clients.*')
                ->withCount(['notes', 'tasks', 'pendingTasks'])
                ->with(['status', 'assigned', 'manageStatus'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.status', true)
                ->get();
            $response->data = $clients;
        });
        return response($response->toArray(), $response->status);
    }

    public function byStatus(Request $request, string $status)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request, $status) {
            $clients = Client::withCount('notes')
                ->where('status_id', $status)
                ->where('business_id', Auth::user()->business_id)
                ->get();
            $response->data = $clients;
        });
        return response($response->toArray(), $response->status);
    }

    public function leadStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            $leadJpa->status_id = $request->status;

            try {
                $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                if ($leadJpa->status_id == ($assignationStatus['lead'] ?? '')) StatusController::updateStatus4Lead($leadJpa, true);
                if ($leadJpa->status_id == ($revertionStatus['lead'] ?? '')) StatusController::updateStatus4Lead($leadJpa, false);
            } catch (\Throwable $th) {
            }

            $leadJpa->save();
        });
        return response($response->toArray(), $response->status);
    }

    public function manageStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            $leadJpa->manage_status_id = $request->status;

            try {
                $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                if ($leadJpa->manage_status_id == ($assignationStatus['manage'] ?? '')) StatusController::updateStatus4Lead($leadJpa, true);
                if ($leadJpa->manage_status_id == ($revertionStatus['manage'] ?? '')) StatusController::updateStatus4Lead($leadJpa, false);
            } catch (\Throwable $th) {
            }

            $leadJpa->save();
        });
        return response($response->toArray(), $response->status);
    }

    public function attend(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');

            StatusController::updateStatus4Lead($leadJpa, $request->method() != 'DELETE');

            $leadJpa->save();
        });
        return response($response->toArray(), $response->status);
    }

    public function external(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {

            $authorizationHeader = $request->header('Authorization');

            if (Text::nullOrEmpty($authorizationHeader)) {
                throw new Exception("Debe enviar los parámetros de autenticación 'Authorization'");
            }

            if (!Text::startsWith($authorizationHeader, 'Bearer ')) {
                throw new Exception("El token de autorización debe ser de tipo Bearer");
            }

            $uuid = \str_replace('Bearer ', '', $authorizationHeader);
            $uuid = \str_replace('bearer ', '', $uuid);
            $uuid = \str_replace('atalaya-', '', $uuid);

            $businessJpa = Business::select('id')->where('uuid', $uuid)->first();
            if (!$businessJpa) {
                throw new Exception("Empresa no encontrada para el token proporcionado");
            }

            $messages = [
                'contact_name.required' => 'El nombre de contacto es obligatorio.',
                'contact_phone.required' => 'El teléfono de contacto es obligatorio.',
                'contact_phone.max' => 'El teléfono de contacto no debe exceder los 15 caracteres.',
                'contact_email.required' => 'El correo electrónico es obligatorio.',
                'contact_email.email' => 'El correo electrónico debe tener el formato user@domain.com.',
                'contact_email.max' => 'El correo electrónico no debe exceder los 320 caracteres.',
                'contact_position.string' => 'La posición de contacto debe ser una cadena de texto.',
                // 'tradename.required' => 'El nombre comercial es obligatorio.',
                // 'tradename.string' => 'El nombre comercial debe ser una cadena de texto.',
                'message.required' => 'El mensaje es obligatorio.',
                'message.string' => 'El mensaje debe ser una cadena de texto.',
                'origin.required' => 'El origen es obligatorio.',
                'origin.string' => 'El origen debe ser una cadena de texto.'
            ];

            $validatedData = $request->validate([
                'contact_name' => 'required|string',
                'contact_phone' => 'required|max:15',
                'contact_email' => 'required|email|max:320',
                'contact_position' => 'nullable|string',
                // 'tradename' => 'required|string',
                'workers' => 'nullable|string',
                'source' => 'nullable|string',
                'message' => 'required|string',
                'origin' => 'required|string',
                'triggered_by' => 'nullable|string'
            ], $messages);

            $validatedData['business_id'] = $businessJpa->id;
            $validatedData['name'] = $validatedData['contact_name'];
            $validatedData['source'] = $validatedData['source'] ?? 'Externo';
            $validatedData['date'] = Trace::getDate('date');
            $validatedData['time'] = Trace::getDate('time');
            $validatedData['ip'] = $request->ip();
            $validatedData['status_id'] = Setting::get('default-lead-status', $businessJpa->id);
            $validatedData['manage_status_id'] = Setting::get('default-manage-lead-status', $businessJpa->id);
            $validatedData['complete_registration'] = true;

            if ($validatedData['origin'] == 'WhatsApp') {
                $leadJpa = Client::updateOrCreate([
                    'contact_phone' => $validatedData['contact_phone']
                ], $validatedData);
            } else {
                $leadJpa = Client::create($validatedData);
            }

            $this->afterSave($request, $leadJpa, true);

            SendNewLeadNotification::dispatchAfterResponse($leadJpa, $businessJpa);

            $response->message = 'Se ha creado el lead correctamente';
        });
        return response($response->toArray(), $response->status);
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $leadJpa = Client::find($id);
            $deleted = $this->softDeletion
                ? $this->model::where('id', $id)
                ->update(['status' => null])
                : $this->model::where('id', $id)
                ->delete();

            if (!$deleted) throw new Exception('No se ha eliminado ningun registro');

            try {
                Message::where('wa_id', $leadJpa->contact_phone)->delete();
            } catch (\Throwable $th) {
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }
}
