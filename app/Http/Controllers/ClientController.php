<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\NoteType;
use App\Models\Setting;
use App\Models\Status;
use App\Models\View;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;
use SoDe\Extend\Trace;

class ClientController extends BasicController
{
    public $model = Client::class;
    public $softDeletion = true;
    public $reactView = 'Clients';
    public $prefix4filter = 'clients';

    public function setReactViewProperties(Request $request)
    {
        $finishedProjectStatus = Setting::get('finished-project-status');
        $defaultClientStatus = Setting::get('default-client-status');
        $noteTypes = NoteType::all();

        $properties = [
            'finishedProjectStatus' => $finishedProjectStatus,
            'client' => $request->client,
            'noteTypes' => $noteTypes,
            'defaultClientStatus' => $defaultClientStatus
        ];

        if ($request->view) {
            $view = View::with(['statuses'])
                ->where('id', $request->view)
                ->where('business_id', Auth::user()->business_id)
                ->first();
            $properties['view']  =  $view;
        }
        $properties['clientStatuses'] = Status::select()
            ->where('table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
            ->where('business_id', Auth::user()->business_id)
            ->get();
        $properties['projectStatuses'] = Status::select()
            ->where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')
            ->where('business_id', Auth::user()->business_id)
            ->get();

        $properties['manageStatuses'] = Status::select()
            ->where('table_id', '9c27e649-574a-47eb-82af-851c5d425434')
            ->where('business_id', Auth::user()->business_id)
            ->get();
        return $properties;
    }

    public function get(Request $request, string $lead)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($lead) {
            $data = $this->model::select('clients.*')
                ->withCount(['notes', 'tasks', 'pendingTasks'])
                ->with(['status', 'assigned', 'manageStatus', 'creator'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
                ->where('status.table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
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
            ->withCount(['notes', 'tasks', 'pendingTasks', 'projects'])
            ->with(['status', 'assigned', 'manageStatus'])
            ->join('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'status.id', 'manage_status_id')
            ->where('status.table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
            ->where('clients.status', true)
            ->where('clients.business_id', Auth::user()->business_id);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $body['source'] = $body['source'] ?? 'Atalaya';
        $body['origin'] = $body['origin'] ?? 'Directo';
        $body['date'] = Trace::getDate('date');
        $body['time'] = Trace::getDate('time');
        $body['ip'] = $request->ip();
        $body['updated_by'] = Auth::user()->service_user->id;
        $body['complete_registration'] = true;
        return $body;
    }

    public function assign(Request $request)
    {
        $response = new Response();
        try {
            Client::where('id', $request->id)
                ->update([
                    'assigned_to' => $request->method() == 'DELETE' ? null : Auth::user()->service_user->id,
                    'complete_registration' => true
                ]);

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

    public function clientStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $res) use ($request) {
            Client::where('id', $request->client)
                ->update([
                    'updated_by' => Auth::user()->service_user->id,
                    'status_id' => $request->status
                ]);
        });
        return \response($response->toArray(), $response->status);
    }

    public function beforeDelete(Request $request)
    {
        return [
            'complete_registration' => false
        ];
    }
}
