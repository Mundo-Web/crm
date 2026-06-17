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
            // ->withCount(['notes', 'tasks', 'pendingTasks', 'projects'])
            ->with(['status', 'assigned', 'manageStatus', 'campaign', 'businessSector', 'integration'])
            ->leftJoin('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
            ->leftJoin('users AS assigned', 'assigned.id', 'clients.assigned_to')
            ->leftJoin('campaigns AS campaign', 'campaign.id', 'clients.campaign_id')
            ->leftJoin('business_sectors AS business_sector', 'business_sector.id', 'clients.business_sector_id')
            ->where(function ($q) {
                $q->whereNull('clients.status')
                    ->orWhere('clients.status', false);
            })
            ->where('clients.business_id', Auth::user()->business_id);
    }

    public function status(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $client = $this->model::findOrFail($request->id);
            $client->status = true;
            //    $client->status_id = Setting::get('default-lead-status', Auth::user()->business_id);
            //  $client->manage_status_id = Setting::get('default-manage-lead-status', Auth::user()->business_id);
            $client->save();
        });
        return response($response->toArray(), $response->status);
    }
}
