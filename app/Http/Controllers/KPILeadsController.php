<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Setting;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class KPILeadsController extends BasicController
{
    public $model = Client::class;
    public $reactView = 'KPILeads';

    public function setReactViewProperties(Request $request)
    {
        $leadStatuses = Status::forLeads()->get();
        $clientStatuses = Status::forClients()->get();

        $leadStatusesIds = array_map(fn($status) => $status['id'], $leadStatuses->toArray());
        $clientStatusesIds = array_map(fn($status) => $status['id'], $clientStatuses->toArray());

        $currentMonth = date('m');
        $currentYear = date('Y');

        $grouped = Client::thisMonth()
            ->select([
                'status.id',
                'status.name',
                'status.color',
                'status.order',
                DB::raw('count(clients.id) AS quantity')
            ])
            ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
            ->whereIn('clients.status_id', $leadStatusesIds)
            ->groupBy('status_id')
            ->orderBy('status.order', 'asc')
            ->get();

        // Conteo
        $defaultLeadStatus = Setting::get('default-lead-status');
        $totalCount = Client::thisMonth()->count();
        $clientsCount = Client::thisMonth()
            ->whereIn('status_id', $clientStatusesIds)
            ->count();
        $archivedCount = Client::thisMonth()
            ->whereNull('status')
            ->count();
        $managingCount = Client::thisMonth()
            ->whereIn('status_id', $leadStatusesIds)
            ->where('status_id', '<>', $defaultLeadStatus)
            ->count();

        $groupedByManageStatus = Client::thisMonth()
            ->select([
                'status.id AS status_id',
                'status.name AS status_name',
                'status.color AS status_color',
                'manage_status.name AS manage_status_name',
                'manage_status.color AS manage_status_color',
                DB::raw('count(clients.id) AS quantity')
            ])
            ->leftJoin('statuses AS manage_status', 'manage_status.id', 'clients.manage_status_id')
            ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
            ->whereIn('clients.status_id', $leadStatusesIds)
            ->groupBy('manage_status_id', 'status_id')
            ->orderBy('status.order', 'asc')
            ->orderBy('manage_status.order', 'asc')
            ->get();

        $months = Client::select([
            DB::raw("DATE_FORMAT(clients.created_at, '%Y-%m') as id"),
            DB::raw('YEAR(clients.created_at) AS year'),
            DB::raw('MONTH(clients.created_at) AS month'),
            DB::raw('count(clients.id) AS quantity')
        ])
            ->where('clients.business_id', Auth::user()->business_id)
            ->groupBy(
                DB::raw('YEAR(clients.created_at)'),
                DB::raw('MONTH(clients.created_at)'),
                DB::raw("DATE_FORMAT(clients.created_at, '%Y-%m')")
            )
            ->orderBy(DB::raw('YEAR(clients.created_at)'), 'desc')
            ->orderBy(DB::raw('MONTH(clients.created_at)'), 'desc')
            ->get();

        return [
            'months' => $months,
            'grouped' => $grouped,
            'totalCount' => $totalCount,
            'clientsCount' => $clientsCount,
            'archivedCount' => $archivedCount,
            'managingCount' => $managingCount,
            'currentMonth' => $currentMonth,
            'currentYear' => $currentYear,
            'groupedByManageStatus' => $groupedByManageStatus
        ];
    }

    public function kpi(Request $request)
    {
        $response = Response::simpleTryCatch(function ($response) use ($request) {
            [$year, $month] = \explode('-', $request->month);

            $defaultLeadStatus = Setting::get('default-lead-status');

            $leadStatuses = Status::forLeads()->get();
            $clientStatuses = Status::forClients()->get();

            $leadStatusesIds = array_map(fn($status) => $status['id'], $leadStatuses->toArray());
            $clientStatusesIds = array_map(fn($status) => $status['id'], $clientStatuses->toArray());

            $grouped = Client::byMonth($year, $month)
                ->select([
                    'status.id',
                    'status.name',
                    'status.color',
                    'status.order',
                    DB::raw('count(clients.id) AS quantity')
                ])
                ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->groupBy('status_id')
                ->orderBy('status.order', 'asc')
                ->get();

            $totalCount = Client::byMonth($year, $month)->count();
            $clientsCount = Client::byMonth($year, $month)
                ->whereIn('status_id', $clientStatusesIds)
                ->count();
            $archivedCount = Client::byMonth($year, $month)
                ->whereNull('status')
                ->count();
            $managingCount = Client::byMonth($year, $month)
                ->whereIn('status_id', $leadStatusesIds)
                ->where('status_id', '<>', $defaultLeadStatus)
                ->count();

            $groupedByManageStatus = Client::byMonth($year, $month)
                ->select([
                    'status.id AS status_id',
                    'status.name AS status_name',
                    'status.color AS status_color',
                    'manage_status.name AS manage_status_name',
                    'manage_status.color AS manage_status_color',
                    DB::raw('count(clients.id) AS quantity')
                ])
                ->leftJoin('statuses AS manage_status', 'manage_status.id', 'clients.manage_status_id')
                ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->groupBy('manage_status_id', 'status_id')
                ->orderBy('status.order', 'asc')
                ->orderBy('manage_status.order', 'asc')
                ->get();

            $response->summary = [
                'grouped' => $grouped,
                'totalCount' => $totalCount,
                'clientsCount' => $clientsCount,
                'archivedCount' => $archivedCount,
                'managingCount' => $managingCount,
            ];
            $response->data = $groupedByManageStatus;
        });
        return \response($response->toArray(), $response->status);
    }
}
