<?php

namespace App\Http\Controllers;

use App\Models\Breakdown;
use App\Models\Client;
use App\Models\Setting;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Mockery\Undefined;
use SoDe\Extend\JSON;
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
            $asignationLeadStatus = JSON::parseable(Setting::get('assignation-lead-status')) ?? [];

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
                ->whereNotNull('status')
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
            $pendingCount = Client::byMonth($year, $month)
                ->where('status_id', $defaultLeadStatus)
                ->count();
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
                    DB::raw('count(clients.id) AS quantity')
                ])
                ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
                ->whereNotNull('status.status')
                ->whereNotNull('clients.status')
                ->whereIn('clients.status_id', array_merge($leadStatusesIds, $clientStatusesIds))
                ->groupBy('status_id')
                ->orderBy('status.table_id', 'desc')
                ->orderBy('status.order', 'asc')
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
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN status_id = "' . $defaultLeadStatus . '" THEN 1 END) as pending'),
                    DB::raw('COUNT(CASE WHEN status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') THEN 1 END) as clients'),
                    DB::raw('COUNT(CASE WHEN status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $leadStatusesIds)) . ') AND status_id <> "' . $defaultLeadStatus . '" THEN 1 END) as managing')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->whereNotNull('origin')
                ->where('origin', '<>', '')
                ->groupBy('origin')
                ->orderBy('total', 'desc')
                ->get();

            $originCampaignCounts = Client::byMonth($year, $month)
                ->select([
                    'origin',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN status_id = "' . $defaultLeadStatus . '" THEN 1 END) as pending'),
                    DB::raw('COUNT(CASE WHEN status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') THEN 1 END) as clients'),
                    DB::raw('COUNT(CASE WHEN status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $leadStatusesIds)) . ') AND status_id <> "' . $defaultLeadStatus . '" THEN 1 END) as managing')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->whereNotNull('origin')
                ->where('origin', '<>', '')
                ->whereNotNull('campaign_id')
                ->where('campaign_id', '<>', '')
                ->groupBy('origin')
                ->orderBy('total', 'desc')
                ->get();

            $breakdownCounts = Breakdown::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->where('business_id', Auth::user()->business_id)
                ->count();
            $funnelRaw = Client::byMonth($year, $month)
                ->select([
                    'triggered_by',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') THEN 1 END) as clients'),
                    DB::raw('COUNT(CASE WHEN status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', array_merge($leadStatusesIds, $clientStatusesIds))) . ') AND status_id <> "' . $defaultLeadStatus . '" AND status_id <> "' . ($asignationLeadStatus['lead'] ?? '') . '" THEN 1 END) as managing')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->where('lead_origin', 'integration')
                ->whereNotNull('triggered_by')
                ->whereNotNull('clients.status')
                ->where('triggered_by', '<>', '')
                ->groupBy('triggered_by')
                ->orderBy('total', 'desc')
                ->get();

            $funnelCounts = [];
            foreach ($funnelRaw as $row) {
                $funnelCounts[$row->triggered_by] = $row->total;
            }
            $funnelCounts['managing'] = $funnelRaw->sum('managing');
            $funnelCounts['clients']  = $funnelRaw->sum('clients');

            $originLandingCampaignCounts = Client::byMonth($year, $month)
                ->select([
                    'origin as name',
                    DB::raw('COUNT(CASE WHEN lead_origin = "integration" THEN 1 END) as landing'),
                    DB::raw('COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as direct')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->whereNotNull('origin')
                ->where('origin', '<>', '')
                ->groupBy('origin')
                ->havingRaw('COUNT(CASE WHEN lead_origin = "integration" THEN 1 END) > 0 OR COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) > 0')
                ->get();

            $totalArchivedCounts = Client::byMonth($year, $month)
                ->select([
                    DB::raw('IFNULL(origin, "Otros") as name'),
                    DB::raw('COUNT(*) as incoming'),
                    DB::raw('COUNT(CASE WHEN clients.status IS NULL THEN 1 END) as archived')
                ])
                ->where('business_id', Auth::user()->business_id)
                ->groupBy(DB::raw('IFNULL(origin, "Otros")'))
                ->orderBy('incoming', 'desc')
                ->get();

            $convertedLeadStatus = Setting::get('converted-lead-status');

            $columns = [
                'assigned_to',
                DB::raw('MAX(assignation_date) as assignation_date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('(SELECT COUNT(*) 
                    FROM client_notes 
                    WHERE client_notes.user_id = clients.assigned_to
                    AND client_notes.note_type_id = "37b1e8e2-04c4-4246-a8c9-838baa7f8187"
                    AND YEAR(client_notes.created_at) = ' . $year . '
                    AND MONTH(client_notes.created_at) = ' . $month . '
                ) as emails_sent'),

            ];

            if ($convertedLeadStatus) $columns[] = DB::raw('(SELECT COUNT(*)
                FROM client_notes
                WHERE client_notes.user_id = clients.assigned_to
                AND client_notes.manage_status_id = "' . $convertedLeadStatus . '"
                AND YEAR(client_notes.created_at) = ' . $year . '
                AND MONTH(client_notes.created_at) = ' . $month . '
            ) as converted');
            else $columns[] = DB::raw("NULL as converted");
            $usersAssignation = Client::byMonth($year, $month)
                ->select($columns)
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
                'pendingCount' => $pendingCount,
                'managingCount' => $managingCount,
                'managingSum' => $managingSum,
                'leadSources' => $leadSources,
                'originCounts' => $originCounts,
                'originCampaignCounts' => $originCampaignCounts,
                'originLandingCampaignCounts' => $originLandingCampaignCounts,
                'usersAssignation' => $usersAssignation,
                'breakdownCounts' => $breakdownCounts,
                'funnelCounts' => $funnelCounts,
                'totalArchivedCounts' => $totalArchivedCounts
            ];
            $response->data = $groupedByManageStatus;
        });
        return \response($response->toArray(), $response->status);
    }
}
