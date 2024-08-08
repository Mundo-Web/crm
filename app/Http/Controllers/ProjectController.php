<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ProjectController extends BasicController
{
    public $model = Project::class;
    public $reactView = 'Projects';

    public function setReactViewProperties(Request $request)
    {
        $usersJpa = User::byBusiness();
        $statusesJpa = Status::select()
            ->where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')
            ->where('business_id', Auth::user()->business_id)
            ->get();

        return [
            'users' => $usersJpa,
            'statuses' => $statusesJpa
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::with(['client', 'type', 'status'])->select([
            'projects.*',
            DB::raw('COALESCE(projects.cost - SUM(payments.amount), projects.cost) AS remaining_amount'),
            DB::raw('COALESCE(SUM(payments.amount), 0) AS total_payments'),
            DB::raw('MAX(payments.created_at) AS last_payment_date'),
        ])
            ->join('clients AS client', 'client.id', 'projects.id')
            ->leftJoin('payments', 'payments.project_id', 'projects.id')
            ->groupBy('projects.id', 'projects.type_id', 'projects.status_id', 'projects.client_id', 'projects.name', 'projects.description', 'projects.cost', 'projects.signed_at', 'projects.starts_at', 'projects.ends_at', 'projects.visible', 'projects.status', 'projects.created_at', 'projects.updated_at', 'projects.business_id');
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
}
