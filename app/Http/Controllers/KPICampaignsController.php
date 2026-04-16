<?php

namespace App\Http\Controllers;

use App\Models\Breakdown;
use App\Models\Client;
use App\Models\Setting;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class KPICampaignsController extends BasicController
{
    public $model = Client::class;
    public $reactView = 'KPICampaigns';

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
            ->whereNotNull('clients.campaign_id')
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

            $query = fn() => Client::byMonth($year, $month)
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNotNull('campaign_id');

            $grouped = $query()
                ->select([
                    'status.id',
                    'status.name',
                    'status.color',
                    'status.order',
                    DB::raw('count(clients.id) AS quantity')
                ])
                ->leftJoin('statuses AS status', 'status.id', 'clients.status_id')
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->groupBy('status.id', 'status.name', 'status.color', 'status.order')
                ->orderBy('status.order', 'asc')
                ->get();

            $totalCount = $query()->count();
            $totalSum = $query()
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');
            $clientsCount = $query()
                ->whereIn('status_id', $clientStatusesIds)
                ->whereNotNull('status')
                ->count();
            $clientsSum = $query()
                ->whereIn('status_id', $clientStatusesIds)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');
            $archivedCount = $query()
                ->whereNull('status')
                ->count();
            $archivedSum = $query()
                ->whereNull('clients.status')
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');
            $pendingCount = $query()
                ->where('status_id', $defaultLeadStatus)
                ->count();
            $managingCount = $query()
                ->whereIn('status_id', $leadStatusesIds)
                ->where('status_id', '<>', $defaultLeadStatus)
                ->count();
            $managingSum = $query()
                ->whereIn('status_id', $leadStatusesIds)
                ->where('status_id', '<>', $defaultLeadStatus)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $groupedByManageStatus = $query()
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
                ->groupBy('status.id', 'status.name', 'status.color', 'status.table_id', 'status.order')
                ->orderBy('status.table_id', 'desc')
                ->orderBy('status.order', 'asc')
                ->get();

            $leadSources = $query()
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

            $originCounts = $query()
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

            $originCampaignCounts = $query()
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
            
            $funnelRaw = $query()
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

            $originLandingCampaignCounts = $query()
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

            $archivedLeadStatusRaw = Setting::get('archived-lead-status');
            $archivedLeadStatus = is_array($archivedLeadStatusRaw) ? $archivedLeadStatusRaw : (JSON::parse($archivedLeadStatusRaw ?? '[]') ?? []);
            if (!is_array($archivedLeadStatus)) $archivedLeadStatus = [$archivedLeadStatus];

            $archivedLeadStatusDirectRaw = Setting::get('archived-lead-status-direct');
            $archivedLeadStatusDirect = is_array($archivedLeadStatusDirectRaw) ? $archivedLeadStatusDirectRaw : (JSON::parse($archivedLeadStatusDirectRaw ?? '[]') ?? []);
            if (!is_array($archivedLeadStatusDirect)) $archivedLeadStatusDirect = [$archivedLeadStatusDirect];

            $allArchivedStatuses = array_unique(array_merge($archivedLeadStatus, $archivedLeadStatusDirect));

            $archivedLabelsCount = $query()
                ->where('business_id', Auth::user()->business_id)
                ->whereIn('manage_status_id', $allArchivedStatuses)
                ->count();

            $archivedBreakdown = DB::table('clients')
                ->select('status.id', 'status.name', 'status.color', DB::raw('count(clients.id) as quantity'))
                ->leftJoin('statuses as status', 'status.id', '=', 'clients.manage_status_id')
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNotNull('clients.campaign_id')
                ->whereIn('clients.manage_status_id', $allArchivedStatuses)
                ->whereMonth('clients.created_at', $month)
                ->whereYear('clients.created_at', $year)
                ->groupBy('status.id', 'status.name', 'status.color')
                ->get();

            $totalArchivedCounts = $query()
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

            $usersAssignation = $query()
                ->select($columns)
                ->with('assigned')
                ->where('business_id', Auth::user()->business_id)
                ->whereNotNull('assigned_to')
                ->groupBy('assigned_to')
                ->orderBy('count', 'desc')
                ->orderBy('assignation_date', 'desc')
                ->get();

            // Hierarchical Data: Campaign -> Ad Set -> Ads
            $rawAdsData = $query()
                ->select([
                    DB::raw('IFNULL(campaign.title, "(Campaña desconocida)") AS campaign_name'),
                    DB::raw('IFNULL(clients.adset_name, "(Sin grupo de anuncios)") as adset_name'),
                    DB::raw('IFNULL(clients.ad_name, "(Sin anuncio)") as ad_name'),
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id = "' . $defaultLeadStatus . '" THEN 1 END) as pending'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') AND clients.status IS NOT NULL THEN 1 END) as sales'),
                    DB::raw('COUNT(CASE WHEN clients.status IS NULL THEN 1 END) as archived'),
                ])
                ->leftJoin('campaigns AS campaign', 'campaign.id', 'clients.campaign_id')
                ->where('clients.business_id', Auth::user()->business_id)
                ->groupBy('campaign.title', 'clients.adset_name', 'clients.ad_name')
                ->orderBy('campaign.title', 'asc')
                ->orderBy('total', 'desc')
                ->get();

            $hierarchy = [];
            foreach ($rawAdsData as $row) {
                if (!isset($hierarchy[$row->campaign_name])) {
                    $hierarchy[$row->campaign_name] = [
                        'name' => $row->campaign_name,
                        'adSets' => []
                    ];
                }
                if (!isset($hierarchy[$row->campaign_name]['adSets'][$row->adset_name])) {
                    $hierarchy[$row->campaign_name]['adSets'][$row->adset_name] = [
                        'name' => $row->adset_name,
                        'ads' => []
                    ];
                }
                $hierarchy[$row->campaign_name]['adSets'][$row->adset_name]['ads'][] = [
                    'name' => $row->ad_name,
                    'total' => $row->total,
                    'contacted' => $row->total - $row->pending,
                    'archived' => $row->archived,
                    'sales' => $row->sales
                ];
            }

            // Convert nested adSets to indexed array
            foreach ($hierarchy as &$campaign) {
                $campaign['adSets'] = array_values($campaign['adSets']);
            }

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
                'totalArchivedCounts' => $totalArchivedCounts,
                'archivedLabelsCount' => $archivedLabelsCount,
                'archivedBreakdown' => $archivedBreakdown,
                'hierarchy' => array_values($hierarchy)
            ];
            $response->data = $groupedByManageStatus;
        });
        return \response($response->toArray(), $response->status);
    }
}
