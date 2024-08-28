<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ArchivedController extends BasicController
{
    public $model = Client::class;
    public $softDeletion = false;
    public $reactView = 'Archived';
    public $prefix4filter = 'clients';

    public function setPaginationInstance(string $model)
    {
        return $model::select('clients.*')
            ->withCount(['notes', 'tasks', 'pendingTasks', 'projects'])
            ->with(['status', 'assigned', 'manageStatus'])
            ->join('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'status.id', 'manage_status_id')
            ->whereNull('clients.status')
            ->where('clients.business_id', Auth::user()->business_id);
    }
}
