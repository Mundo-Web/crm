<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Setting;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Style\ConditionalFormatting\Wizard\Duplicates;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class ProjectController extends BasicController
{
    public $model = Project::class;
    public $reactView = 'ProjectsArchived';
    public $prefix4filter = 'projects';
    public $ignorePrefix = ['remaining_amount', 'total_payments'];
    public $softDeletion = true;

    public function setReactViewProperties(Request $request)
    {
        $finishedProjectStatus = Setting::get('finished-project-status');
        $statusesJpa = Status::select()
            ->where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')
            ->where('business_id', Auth::user()->business_id)
            ->get();

        return [
            'finishedProjectStatus' => $finishedProjectStatus,
            'statuses' => $statusesJpa
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $query = $model::with(['client', 'type', 'status', 'subdomain', 'users'])->select([
            'projects.*',
            'projects.status AS project_status',
            DB::raw('COALESCE(SUM(payments.amount), 0) AS total_payments'),
            DB::raw('MAX(payments.created_at) AS last_payment_date'),
        ])
            ->distinct()
            ->leftJoin('types AS type', 'type.id', 'projects.type_id')
            ->leftJoin('clients AS client', 'client.id', 'projects.client_id')
            ->leftJoin('payments', 'payments.project_id', 'projects.id')
            ->leftJoin('statuses AS status', 'status.id', 'projects.status_id')
            ->groupBy('projects.id')
            ->where('projects.business_id', Auth::user()->business_id);

        if (!$request->isLoadingAll) {
            $finishedProjectStatus = Setting::get('finished-project-status');
            $query = $query
                ->where('projects.status_id', '<>', $finishedProjectStatus)
                ->whereNotNull('projects.status');
        }

        $userjpa = User::find(Auth::user()->service_user->id);
        $userjpa->getAllPermissions();

        if (!($userjpa->can('projects.listall') || $userjpa->can('projects.all'))) {
            $query = $query
                ->leftJoin('users_by_projects AS ubp', 'ubp.project_id', 'projects.id')
                ->where('ubp.user_id', Auth::user()->service_user->id);
        }

        return $query;
    }

    static function projectStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            Project::where('id', $request->project)
                ->update([
                    'status_id' => $request->status
                ]);
        });
        return response($response->toArray(), $response->status);
    }

    public function afterSave(Request $request, object $projectJpa, ?bool $isNew)
    {
        Project::regularizeRemaining($projectJpa->id);
    }
}
