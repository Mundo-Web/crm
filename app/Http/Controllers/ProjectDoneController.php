<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Project;
use App\Models\Setting;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ProjectDoneController extends BasicController
{
    public $model = Project::class;
    public $reactView = 'ProjectsArchived';
    public $prefix4filter = 'projects';
    public $ignorePrefix = ['remaining_amount', 'total_payments', 'last_payment_date'];
    public $softDeletion = true;

    public function setReactViewProperties(Request $request)
    {
        $statusesJpa = Status::select()
            ->where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')
            ->where('business_id', Auth::user()->business_id)
            ->get();

        return [
            'statuses' => $statusesJpa
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $finishedProjectStatus = Setting::get('finished-project-status');
        return $model::with(['client', 'type', 'status', 'subdomain'])->select([
            'projects.*',
            DB::raw('COALESCE(SUM(payments.amount), 0) AS total_payments'),
            DB::raw('MAX(payments.created_at) AS last_payment_date'),
        ])
            ->leftJoin('types AS type', 'type.id', 'projects.type_id')
            ->leftJoin('clients AS client', 'client.id', 'projects.client_id')
            ->leftJoin('payments', 'payments.project_id', 'projects.id')
            ->leftJoin('statuses AS status', 'status.id', 'projects.status_id')
            ->groupBy('projects.id')
            ->where('projects.status_id', $finishedProjectStatus)
            ->where('projects.business_id', Auth::user()->business_id)
            ->whereNotNull('projects.status');
    }
}
