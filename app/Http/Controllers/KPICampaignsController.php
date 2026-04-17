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
    public $prefix4filter = 'clients';

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
            ->whereRaw('LENGTH(clients.campaign_id) > 10')
            ->whereNotNull('clients.adset_name')
            ->where('clients.adset_name', '<>', '')
            ->whereNotNull('clients.ad_name')
            ->where('clients.ad_name', '<>', '')
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
                ->join('campaigns as campaign', 'campaign.id', '=', 'clients.campaign_id')
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereRaw('LENGTH(clients.campaign_id) > 10')
                ->whereNotNull('clients.adset_name')
                ->where('clients.adset_name', '<>', '')
                ->whereNotNull('clients.ad_name')
                ->where('clients.ad_name', '<>', '');

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

            // Lógica unificada de gestión
            $managingBase = $query()
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->where('clients.status_id', '<>', $defaultLeadStatus);

            $totalCount = $query()->count();
            $totalSum = $query()
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $clientsCount = $query()
                ->where('clients.status', true)
                ->whereIn('clients.status_id', $clientStatusesIds)
                ->count();
            $clientsSum = $query()
                ->where('clients.status', true)
                ->whereIn('clients.status_id', $clientStatusesIds)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $archivedCount = (clone $managingBase)->whereNull('clients.status')->count();
            $trueManagingCount = (clone $managingBase)->where('clients.status', true)->count();
            $managingCount = (clone $managingBase)->count(); // Total (Vivo + Muerto)

            $pendingCount = $query()
                ->where('clients.status_id', $defaultLeadStatus)
                ->count();

            $managingSum = (clone $managingBase)
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
                ->where('clients.status', true)
                ->whereIn('clients.status_id', array_merge($leadStatusesIds, $clientStatusesIds))
                ->groupBy('status.id', 'status.name', 'status.color', 'status.table_id', 'status.order')
                ->orderBy('status.table_id', 'desc')
                ->orderBy('status.order', 'asc')
                ->get();

            $leadSources = $query()
                ->select([
                    DB::raw('COUNT(CASE 
                        WHEN clients.origin = "CRM Atalaya" AND clients.triggered_by = "Formulario" THEN 1 
                        END) as crm_count'),
                    DB::raw('COUNT(CASE 
                        WHEN clients.origin = "WhatsApp" AND clients.triggered_by = "Gemini AI" THEN 1 
                        END) as whatsapp_count'),
                    DB::raw('COUNT(CASE 
                        WHEN (clients.origin != "CRM Atalaya" OR clients.triggered_by != "Formulario") 
                        AND (clients.origin != "WhatsApp" OR clients.triggered_by != "Gemini AI") 
                        THEN 1 END) as integration_count')
                ])
                ->where('clients.business_id', Auth::user()->business_id)
                ->first();

            $originCounts = $query()
                ->select([
                    'clients.origin as origin',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id = "' . $defaultLeadStatus . '" THEN 1 END) as pending'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') THEN 1 END) as clients'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $leadStatusesIds)) . ') AND clients.status_id <> "' . $defaultLeadStatus . '" THEN 1 END) as managing')
                ])
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNotNull('clients.origin')
                ->where('clients.origin', '<>', '')
                ->groupBy('clients.origin')
                ->orderBy('total', 'desc')
                ->get();

            $originCampaignCounts = $query()
                ->select([
                    'clients.origin as origin',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id = "' . $defaultLeadStatus . '" THEN 1 END) as pending'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') THEN 1 END) as clients'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $leadStatusesIds)) . ') AND clients.status_id <> "' . $defaultLeadStatus . '" THEN 1 END) as managing')
                ])
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNotNull('clients.origin')
                ->where('clients.origin', '<>', '')
                ->whereNotNull('clients.campaign_id')
                ->where('clients.campaign_id', '<>', '')
                ->groupBy('clients.origin')
                ->orderBy('total', 'desc')
                ->get();

            $breakdownCounts = Breakdown::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->where('business_id', Auth::user()->business_id)
                ->count();
            
            $funnelRaw = $query()
                ->select([
                    'clients.triggered_by as triggered_by',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') THEN 1 END) as clients'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', array_merge($leadStatusesIds, $clientStatusesIds))) . ') AND clients.status_id <> "' . $defaultLeadStatus . '" AND clients.status_id <> "' . ($asignationLeadStatus['lead'] ?? '') . '" THEN 1 END) as managing')
                ])
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.lead_origin', 'integration')
                ->whereNotNull('clients.triggered_by')
                ->whereNotNull('clients.status')
                ->where('clients.triggered_by', '<>', '')
                ->groupBy('clients.triggered_by')
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
                    'clients.origin as name',
                    DB::raw('COUNT(CASE WHEN clients.lead_origin = "integration" THEN 1 END) as landing'),
                    DB::raw('COUNT(CASE WHEN clients.campaign_id IS NOT NULL THEN 1 END) as direct')
                ])
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNotNull('clients.origin')
                ->where('clients.origin', '<>', '')
                ->groupBy('clients.origin')
                ->havingRaw('COUNT(CASE WHEN clients.lead_origin = "integration" THEN 1 END) > 0 OR COUNT(CASE WHEN clients.campaign_id IS NOT NULL THEN 1 END) > 0')
                ->get();

            $archivedLeadStatusRaw = Setting::get('archived-lead-status');
            $archivedLeadStatus = is_array($archivedLeadStatusRaw) ? $archivedLeadStatusRaw : (JSON::parse($archivedLeadStatusRaw ?? '[]') ?? []);
            if (!is_array($archivedLeadStatus)) $archivedLeadStatus = [$archivedLeadStatus];

            $archivedLeadStatusDirectRaw = Setting::get('archived-lead-status-direct');
            $archivedLeadStatusDirect = is_array($archivedLeadStatusDirectRaw) ? $archivedLeadStatusDirectRaw : (JSON::parse($archivedLeadStatusDirectRaw ?? '[]') ?? []);
            if (!is_array($archivedLeadStatusDirect)) $archivedLeadStatusDirect = [$archivedLeadStatusDirect];

            $allArchivedStatuses = array_unique(array_merge($archivedLeadStatus, $archivedLeadStatusDirect));

            $archivedLabelsCount = $query()
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNull('clients.status')
                ->whereIn('clients.manage_status_id', $allArchivedStatuses)
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
                    DB::raw('IFNULL(clients.origin, "Otros") as name'),
                    DB::raw('COUNT(*) as incoming'),
                    DB::raw('COUNT(CASE WHEN clients.status IS NULL THEN 1 END) as archived')
                ])
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNull('clients.status')
                ->groupBy(DB::raw('IFNULL(clients.origin, "Otros")'))
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
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereNotNull('assigned_to')
                ->groupBy('assigned_to')
                ->orderBy('count', 'desc')
                ->orderBy('assignation_date', 'desc')
                ->get();

            // Hierarchical Data: Campaign -> Ad Set -> Ads
            // Hierarchical Data: Campaign -> Ad Set -> Ads
            $rawAdsData = Client::byMonth($year, $month)
                ->select([
                    'clients.campaign_id AS campaign_id',
                    'campaign.title AS campaign_name',
                    'clients.adset_name AS adset_name',
                    'clients.ad_name AS ad_name',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id = "' . $defaultLeadStatus . '" THEN 1 END) as pending'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') AND clients.status IS NOT NULL THEN 1 END) as sales'),
                    DB::raw('COUNT(CASE WHEN clients.status IS NULL THEN 1 END) as archived'),
                ])
                ->join('campaigns AS campaign', function($join) {
                    $join->on('campaign.id', '=', 'clients.campaign_id')
                         ->whereRaw('LENGTH(campaign.id) > 10');
                })
                ->where('clients.business_id', Auth::user()->business_id)
                ->whereRaw('LENGTH(clients.campaign_id) > 10')
                ->whereNotNull('clients.adset_name')
                ->where('clients.adset_name', '<>', '')
                ->whereNotNull('clients.ad_name')
                ->where('clients.ad_name', '<>', '')
                ->groupBy('clients.campaign_id', 'campaign.title', 'clients.adset_name', 'clients.ad_name')
                ->orderBy('campaign.title', 'asc')
                ->orderBy('total', 'desc')
                ->get();

            $hierarchy = [];
            foreach ($rawAdsData as $row) {
                if (!isset($hierarchy[$row->campaign_id])) {
                    $hierarchy[$row->campaign_id] = [
                        'id' => $row->campaign_id,
                        'name' => $row->campaign_name,
                        'adSets' => []
                    ];
                }

                if (!isset($hierarchy[$row->campaign_id]['adSets'][$row->adset_name])) {
                    $hierarchy[$row->campaign_id]['adSets'][$row->adset_name] = [
                        'name' => $row->adset_name,
                        'ads' => []
                    ];
                }

                $adName = $row->ad_name;
                if (!isset($hierarchy[$row->campaign_id]['adSets'][$row->adset_name]['ads'][$adName])) {
                    $hierarchy[$row->campaign_id]['adSets'][$row->adset_name]['ads'][$adName] = [
                        'name' => $adName,
                        'total' => 0,
                        'contacted' => 0,
                        'archived' => 0,
                        'sales' => 0
                    ];
                }

                $ad = &$hierarchy[$row->campaign_id]['adSets'][$row->adset_name]['ads'][$adName];
                $ad['total'] += $row->total;
                $ad['contacted'] += ($row->total - $row->pending);
                $ad['archived'] += $row->archived;
                $ad['sales'] += $row->sales;
            }

            // Convert adSets and ads from associative to indexed arrays
            $finalHierarchy = [];
            foreach ($hierarchy as $cId => $cData) {
                $adSets = [];
                foreach ($cData['adSets'] as $asName => $asData) {
                    $asData['ads'] = array_values($asData['ads']);
                    $adSets[] = $asData;
                }
                $cData['adSets'] = $adSets;
                $finalHierarchy[] = $cData;
            }

            $archivedSum = (clone $managingBase)
                ->whereNull('clients.status')
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $totalConversionPercent = $totalCount > 0 ? round(($clientsCount / $totalCount) * 100, 1) : 0;

            $response->summary = [
                'hierarchy' => $finalHierarchy,
                'grouped' => $grouped,
                'totalCount' => $totalCount,
                'totalSum' => $totalSum,
                'clientsCount' => $clientsCount,
                'clientsSum' => $clientsSum,
                'archivedCount' => $archivedCount,
                'archivedSum' => $archivedSum,
                'pendingCount' => $pendingCount,
                'managingCount' => $managingCount,
                'trueManagingCount' => $trueManagingCount,
                'managingSum' => $managingSum,
                'leadSources' => $leadSources,
                'originCounts' => $originCounts,
                'originCampaignCounts' => $originCampaignCounts,
                'originLandingCampaignCounts' => $originLandingCampaignCounts,
                'totalConversionPercent' => $totalConversionPercent,
                'usersAssignation' => $usersAssignation,
                'breakdownCounts' => $breakdownCounts,
                'funnelCounts' => $funnelCounts,
                'totalArchivedCounts' => $totalArchivedCounts,
                'archivedLabelsCount' => $archivedLabelsCount,
                'archivedBreakdown' => $archivedBreakdown,
            ];
            $response->data = $groupedByManageStatus;
        });
        return \response($response->toArray(), $response->status);
    }

    public function leadsPaginate(Request $request)
    {
        return $this->paginate($request);
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return Client::select([
            'clients.id',
            'clients.name',
            'clients.contact_phone',
            'clients.contact_email',
            'clients.campaign_id',
            'clients.adset_name',
            'clients.ad_name',
            'clients.created_at',
            'statuses.name as status_name',
            'statuses.color as status_color',
            'users.name as assigned_name',
            'users.relative_id as assigned_relative_id'
        ])
            ->leftJoin('statuses', 'statuses.id', '=', 'clients.status_id')
            ->leftJoin('users', 'users.id', '=', 'clients.assigned_to')
            ->where(function ($query) use ($request) {
                if ($request->month) {
                    $query->whereRaw("DATE_FORMAT(clients.created_at, '%Y-%m') = ?", [$request->month]);
                }
                if ($request->campaign_id) {
                    $query->where('clients.campaign_id', $request->campaign_id);
                }
                if ($request->adset_name) {
                    $query->where('clients.adset_name', $request->adset_name);
                }
            });
    }
}
