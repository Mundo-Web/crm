<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NewLeadController extends LeadController
{
    public function setPaginationInstance(Request $request, string $model)
    {
        $defaultLeadStatus = Setting::get('default-lead-status');
        return $model::select('clients.*')
            ->withCount(['notes', 'tasks', 'pendingTasks', 'products'])
            ->with(['status', 'assigned', 'manageStatus', 'creator'])
            ->join('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
            ->leftJoin('users AS assigned', 'assigned.id', 'clients.assigned_to')
            ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->where('clients.status', true)
            ->where('clients.status_id', $defaultLeadStatus)
            ->where('clients.business_id', Auth::user()->business_id);
    }
}
