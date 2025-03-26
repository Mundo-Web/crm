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
        $currentMonth = date('m');
        $currentYear = date('Y');

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
            ->get()->toArray();

        $found = false;
        foreach ($months as $month) {
            if ($month['id'] == ("{$currentYear}-{$currentMonth}")) {
                $found = true;
                break;
            }
        }

        // Si no se encontró, agregar un nuevo item
        if (!$found) {
            array_unshift($months, [
                'id' => "{$currentYear}-{$currentMonth}",
                'year' => $currentYear,
                'month' => $currentMonth,
                'quantity' => 0
            ]);
        }

        return [
            'months' => $months,
            'currentMonth' => $currentMonth,
            'currentYear' => $currentYear
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
            $totalSum = Client::byMonth($year, $month)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');
            $clientsCount = Client::byMonth($year, $month)
                ->whereIn('status_id', $clientStatusesIds)
                ->count();
            $clientsSum = Client::byMonth($year, $month)
                ->whereIn('status_id', $clientStatusesIds)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');
            $archivedCount = Client::byMonth($year, $month)
                ->whereNull('status')
                ->count();
            $archivedSum = Client::byMonth($year, $month)
                ->whereNull('clients.status')
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');
            $managingCount = Client::byMonth($year, $month)
                ->whereIn('status_id', $leadStatusesIds)
                ->where('status_id', '<>', $defaultLeadStatus)
                ->count();
            $managingSum = Client::byMonth($year, $month)
                ->whereIn('status_id', $leadStatusesIds)
                ->where('status_id', '<>', $defaultLeadStatus)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

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

            $leadSources = Client::byMonth($year, $month)
                ->select([
                    DB::raw('COUNT(CASE 
                        WHEN origin = "CRM Atalaya" AND triggered_by = "Formulario" THEN 1 
                        END) as crm_count'),
                    DB::raw('COUNT(CASE 
                        WHEN origin = "WhatsApp" AND triggered_by = "Gemini AI" THEN 1 
                        END) as whatsapp_count'),
                    DB::raw('COUNT(CASE 
                        WHEN (origin != "CRM Atalaya" OR triggered_by != "Formulario") 
                        AND (origin != "WhatsApp" OR triggered_by != "Gemini AI") 
                        THEN 1 END) as integration_count')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->first();

            $originCounts = Client::byMonth($year, $month)
                ->select([
                    'origin',
                    DB::raw('COUNT(*) as count')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->whereNotIn('origin', ['WhatsApp', 'CRM Atalaya'])
                ->groupBy('origin')
                ->orderBy('count', 'desc')
                ->get();

            $usersAssignation = Client::byMonth($year, $month)
                ->select([
                    'assigned_to',
                    DB::raw('MAX(assignation_date) as assignation_date'),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('(SELECT COUNT(*) 
                        FROM client_notes 
                        WHERE client_notes.user_id = clients.assigned_to
                        AND client_notes.note_type_id = "37b1e8e2-04c4-4246-a8c9-838baa7f8187"
                        AND YEAR(client_notes.created_at) = ' . $year . '
                        AND MONTH(client_notes.created_at) = ' . $month . '
                    ) as emails_sent')
                ])
                ->with('assigned')
                ->where('business_id', Auth::user()->business_id)
                ->whereNotNull('assigned_to')
                ->groupBy('assigned_to')
                ->orderBy('count', 'desc')
                ->orderBy('assignation_date', 'desc')
                // ->limit(5)
                ->get();

            $response->summary = [
                'grouped' => $grouped,
                'totalCount' => $totalCount,
                'totalSum' => $totalSum,
                'clientsCount' => $clientsCount,
                'clientsSum' => $clientsSum,
                'archivedCount' => $archivedCount,
                'archivedSum' => $archivedSum,
                'managingCount' => $managingCount,
                'managingSum' => $managingSum,
                'leadSources' => $leadSources,
                'originCounts' => $originCounts,
                'usersAssignation' => $usersAssignation
            ];
            $response->data = $groupedByManageStatus;
        });
        return \response($response->toArray(), $response->status);
    }
}
