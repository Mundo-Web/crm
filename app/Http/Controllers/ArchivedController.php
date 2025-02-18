<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\NoteType;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class ArchivedController extends BasicController
{
    public $model = Client::class;
    public $softDeletion = false;
    public $reactView = 'Archived';
    public $prefix4filter = 'clients';

    public function setReactViewProperties(Request $request)
    {
        $finishedProjectStatus = Setting::get('finished-project-status');
        $defaultLeadStatus = Setting::get('default-lead-status');
        $noteTypes = NoteType::all();
        return [
            'finishedProjectStatus' => $finishedProjectStatus,
            'archived' => $request->archived,
            'defaultLeadStatus' => $defaultLeadStatus,
            'noteTypes' => $noteTypes
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::select('clients.*')
            ->withCount(['notes', 'tasks', 'pendingTasks', 'projects'])
            ->with(['status', 'assigned', 'manageStatus'])
            ->join('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'status.id', 'manage_status_id')
            ->whereNull('clients.status')
            ->where('clients.business_id', Auth::user()->business_id);
    }

    public function status(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $this->model::where('id', $request->id)
                ->update([
                    'status' => 1
                ]);
        });
        return response($response->toArray(), $response->status);
    }
}
