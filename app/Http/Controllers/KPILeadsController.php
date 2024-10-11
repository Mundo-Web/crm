<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Setting;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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

        $groupedLastMonth = Client::lastMonth()
            ->select([
                'status.name',
                'status.color',
                DB::raw('count(clients.id) AS quantity')
            ])
            ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
            ->whereIn('clients.status_id', $leadStatusesIds)
            ->groupBy('status_id')
            ->orderBy('status.order', 'asc')
            ->get();

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
        $totalCount = Client::thisMonth()->count();         // check
        $clientsCount = Client::thisMonth()
            ->whereIn('status_id', $clientStatusesIds)
            ->count();                                      // check
        $archivedCount = Client::thisMonth()
            ->whereNull('status')
            ->count();                                      // check
        $managingCount = Client::thisMonth()
            ->whereIn('status_id', $leadStatusesIds)
            ->where('status_id', '<>', $defaultLeadStatus)
            ->count();                                      // check

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

        return [
            'groupedLastMonth' => $groupedLastMonth,
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

    public function setPaginationInstance(string $model) {}
}
