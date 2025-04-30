<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ProjectArchivedController extends BasicController
{
    public $model = Project::class;
    public $reactView = 'Projects';
    public $prefix4filter = 'projects';
    public $ignorePrefix = ['remaining_amount', 'total_payments', 'last_payment_date'];
    public $softDeletion = false;

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::with(['client', 'type', 'status', 'subdomain'])->select([
            'projects.*',
            DB::raw('COALESCE(SUM(payments.amount), 0) AS total_payments'),
            DB::raw('MAX(payments.date) AS last_payment_date'),
        ])
            ->leftJoin('types AS type', 'type.id', 'projects.type_id')
            ->leftJoin('clients AS client', 'client.id', 'projects.client_id')
            ->leftJoin('payments', 'payments.project_id', 'projects.id')
            ->leftJoin('statuses AS status', 'status.id', 'projects.status_id')
            ->groupBy('projects.id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->whereNull('projects.status')
            ->distinct();
    }
}
