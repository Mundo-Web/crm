<?php

namespace App\Http\Controllers;

use App\Models\Breakdown;
use App\Models\Client;
use App\Models\Setting;
use App\Models\Status;
use App\Models\User;
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

        // Cargar asesores del negocio para el filtro
        $advisors = User::where('business_id', Auth::user()->business_id)
            ->select('id', 'name', 'relative_id')
            ->orderBy('name')
            ->get();

        // Configuración de semana personalizada
        $weekStartDay = Setting::get('campaign-week-start-day') ?? 1; // 1 = Lunes por defecto
        
        // Tipo de cambio USD a PEN — consultar API Luna en tiempo real
        $exchangeRate = $this->getLunaExchangeRate();

        return [
            'months' => $months,
            'currentMonth' => $currentMonth,
            'currentYear' => $currentYear,
            'advisors' => $advisors,
            'weekStartDay' => (int)$weekStartDay,
            'exchangeRate' => (float)$exchangeRate,
        ];
    }

    /**
     * Construye el rango de fechas del periodo anterior con la misma duración
     */
    private function getPreviousPeriod(string $dateFrom, string $dateTo): array
    {
        $from = \Carbon\Carbon::parse($dateFrom);
        $to   = \Carbon\Carbon::parse($dateTo);
        $diff = $from->diffInDays($to);

        $prevTo   = (clone $from)->subDay();
        $prevFrom = (clone $prevTo)->subDays($diff);

        return [
            $prevFrom->format('Y-m-d'),
            $prevTo->format('Y-m-d'),
        ];
    }

    /**
     * Aplica los filtros opcionales de plataforma y asesor sobre una query
     */
    private function applyOptionalFilters($query, ?string $platform, ?string $advisorId)
    {
        if ($platform && $platform !== 'all') {
            $platformMap = [
                'fb'      => ['Facebook', 'fb', 'Meta', 'facebook', 'facebook&instagram'],
                'ig'      => ['Instagram', 'ig', 'instagram', 'facebook&instagram'],
                'wa'      => ['WhatsApp', 'Whatsapp', 'whatsapp', 'wa'],
                'landing' => ['Landing', 'landing', 'integration', 'Formulario', 'CRM Atalaya'],
            ];
            $origins = $platformMap[$platform] ?? [$platform];
            $query->whereIn('clients.origin', $origins);
        }

        if ($advisorId && $advisorId !== 'all') {
            $query->where('clients.assigned_to', $advisorId);
        }

        return $query;
    }

    public function kpi(Request $request, ?string $month = null)
    {
        $response = Response::simpleTryCatch(function ($response) use ($request, $month) {

            // ──────────────────────────────────────────────────────────
            // Parsear parámetros de fecha (nuevo sistema flexible)
            // Acepta: date_from + date_to  O  el parámetro legacy "month"
            // ──────────────────────────────────────────────────────────
            if ($request->date_from && $request->date_to) {
                $dateFrom = $request->date_from;
                $dateTo   = $request->date_to;
            } elseif ($month || $request->month) {
                // Compatibilidad legacy con parámetro del segmento de ruta
                $m = $month ?? $request->month;
                [$year, $mo] = \explode('-', $m);
                $dateFrom = "{$year}-{$mo}-01";
                $lastDay  = date('t', mktime(0, 0, 0, $mo, 1, $year));
                $dateTo   = "{$year}-{$mo}-{$lastDay}";
            } else {
                // Default: mes actual
                $dateFrom = date('Y-m-01');
                $dateTo   = date('Y-m-t');

            }

            $platform  = $request->platform  ?? null;
            $advisorId = $request->advisor_id ?? null;

            // Periodo anterior (misma duración, inmediatamente antes)
            [$prevDateFrom, $prevDateTo] = $this->getPreviousPeriod($dateFrom, $dateTo);

            $defaultLeadStatus   = Setting::get('default-lead-status');
            $asignationLeadStatus = JSON::parseable(Setting::get('assignation-lead-status')) ?? [];

            $leadStatuses   = Status::forLeads()->get();
            $clientStatuses = Status::forClients()->get();

            $leadStatusesIds   = array_map(fn($s) => $s['id'], $leadStatuses->toArray());
            $clientStatusesIds = array_map(fn($s) => $s['id'], $clientStatuses->toArray());

            // ──────────────────────────────────────────────────────────
            // Query base: campaña válida + rango de fechas
            // ──────────────────────────────────────────────────────────
            $queryBase = fn() => Client::where('clients.business_id', Auth::user()->business_id)
                ->select('clients.*')
                ->join('campaigns as campaign', 'campaign.id', '=', 'clients.campaign_id')
                ->whereRaw('LENGTH(clients.campaign_id) > 10');

            // Query con filtros de ad meta (adset + ad) + fecha actual con ajuste de zona horaria de Meta (+5 horas)
            $query = function () use ($queryBase, $dateFrom, $dateTo, $platform, $advisorId) {
                $q = $queryBase()
                    ->whereNotNull('clients.adset_name')
                    ->where('clients.adset_name', '<>', '')
                    ->whereNotNull('clients.ad_name')
                    ->where('clients.ad_name', '<>', '')
                    ->whereBetween(DB::raw('DATE_ADD(clients.created_at, INTERVAL 5 HOUR)'), ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"]);
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            // Query equivalente para el periodo anterior con ajuste de zona horaria de Meta (+5 horas)
            $queryPrev = function () use ($queryBase, $prevDateFrom, $prevDateTo, $platform, $advisorId) {
                $q = $queryBase()
                    ->whereNotNull('clients.adset_name')
                    ->where('clients.adset_name', '<>', '')
                    ->whereNotNull('clients.ad_name')
                    ->where('clients.ad_name', '<>', '')
                    ->whereBetween(DB::raw('DATE_ADD(clients.created_at, INTERVAL 5 HOUR)'), ["{$prevDateFrom} 00:00:00", "{$prevDateTo} 23:59:59"]);
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            // ──────────────────────────────────────────────────────────
            // Métricas del periodo actual
            // ──────────────────────────────────────────────────────────
            $totalCount = (clone $query())->count();
            $totalSum   = (clone $query())
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

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

            $managingBase = $query()
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->where('clients.status_id', '<>', $defaultLeadStatus);

            // Query de clientes (cierres) basada en trazas — usa fecha de la traza, no de creación
            $clientsQuery = function () use ($queryBase, $dateFrom, $dateTo, $platform, $advisorId, $clientStatusesIds) {
                $q = $queryBase()
                    ->whereIn('clients.status_id', $clientStatusesIds)
                    ->whereNotNull('clients.status')
                    ->whereExists(function ($sub) use ($dateFrom, $dateTo) {
                        $sub->select(DB::raw(1))
                            ->from('client_status_traces')
                            ->join('statuses', 'statuses.id', '=', 'client_status_traces.status_id')
                            ->where('statuses.table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
                            ->whereColumn('client_status_traces.client_id', 'clients.id')
                            ->whereBetween('client_status_traces.created_at', ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"]);
                    });
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            // Query de clientes para periodo anterior
            $clientsQueryPrev = function () use ($queryBase, $prevDateFrom, $prevDateTo, $platform, $advisorId, $clientStatusesIds) {
                $q = $queryBase()
                    ->whereIn('clients.status_id', $clientStatusesIds)
                    ->whereNotNull('clients.status')
                    ->whereExists(function ($sub) use ($prevDateFrom, $prevDateTo) {
                        $sub->select(DB::raw(1))
                            ->from('client_status_traces')
                            ->join('statuses', 'statuses.id', '=', 'client_status_traces.status_id')
                            ->where('statuses.table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
                            ->whereColumn('client_status_traces.client_id', 'clients.id')
                            ->whereBetween('client_status_traces.created_at', ["{$prevDateFrom} 00:00:00", "{$prevDateTo} 23:59:59"]);
                    });
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            $clientsCount = (clone $clientsQuery())->count();
            $clientsSum   = (clone $clientsQuery())
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $archivedCount     = (clone $managingBase)->whereNull('clients.status')->count();
            $trueManagingCount = (clone $managingBase)->where('clients.status', true)->count();
            $managingCount     = (clone $managingBase)->count();

            $pendingCount = $query()
                ->where('clients.status_id', $defaultLeadStatus)
                ->count();

            $managingSum = (clone $managingBase)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            // ──────────────────────────────────────────────────────────
            // Métricas del periodo ANTERIOR (para comparativa ↑↓)
            // ──────────────────────────────────────────────────────────
            $prevTotalCount   = (clone $queryPrev())->count();
            $prevClientsCount = (clone $clientsQueryPrev())->count();
            $prevArchivedCount = (clone $queryPrev())
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->where('clients.status_id', '<>', $defaultLeadStatus)
                ->whereNull('clients.status')
                ->count();
            $prevManagingCount = (clone $queryPrev())
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->where('clients.status_id', '<>', $defaultLeadStatus)
                ->count();

            $calcVariation = function ($current, $previous) {
                if ($previous == 0) return $current > 0 ? 100 : 0;
                return round((($current - $previous) / $previous) * 100, 1);
            };

            $previousPeriod = [
                'dateFrom'      => $prevDateFrom,
                'dateTo'        => $prevDateTo,
                'totalCount'    => $prevTotalCount,
                'clientsCount'  => $prevClientsCount,
                'archivedCount' => $prevArchivedCount,
                'managingCount' => $prevManagingCount,
            ];

            $variations = [
                'totalCount'   => $calcVariation($totalCount, $prevTotalCount),
                'clientsCount' => $calcVariation($clientsCount, $prevClientsCount),
                'archivedCount'=> $calcVariation($archivedCount, $prevArchivedCount),
                'managingCount'=> $calcVariation($managingCount, $prevManagingCount),
            ];

            // ──────────────────────────────────────────────────────────
            // Gráfico por estado de gestión
            // ──────────────────────────────────────────────────────────
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

            // ──────────────────────────────────────────────────────────
            // Fuentes de leads
            // ──────────────────────────────────────────────────────────
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

            $breakdownCounts = Breakdown::whereBetween('created_at', ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"])
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

            $archivedBreakdown = (clone $managingBase)
                ->select('status.id', 'status.name', 'status.color', DB::raw('count(clients.id) as quantity'))
                ->leftJoin('statuses as status', 'status.id', '=', 'clients.manage_status_id')
                ->whereNull('clients.status')
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
                    AND client_notes.created_at BETWEEN "' . $dateFrom . ' 00:00:00" AND "' . $dateTo . ' 23:59:59"
                ) as emails_sent'),
            ];

            if ($convertedLeadStatus) $columns[] = DB::raw('(SELECT COUNT(*)
                FROM client_notes
                WHERE client_notes.user_id = clients.assigned_to
                AND client_notes.manage_status_id = "' . $convertedLeadStatus . '"
                AND client_notes.created_at BETWEEN "' . $dateFrom . ' 00:00:00" AND "' . $dateTo . ' 23:59:59"
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

            // ──────────────────────────────────────────────────────────
            // Jerarquía: Campaign → AdSet → Ads
            // ──────────────────────────────────────────────────────────
            $rawAdsData = Client::whereBetween('clients.created_at', ["{$dateFrom} 00:00:00", "{$dateTo} 23:59:59"])
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
                ->when($platform && $platform !== 'all', function ($q) use ($platform) {
                    $platformMap = [
                        'fb'      => ['Facebook', 'fb', 'Meta'],
                        'ig'      => ['Instagram', 'ig'],
                        'wa'      => ['WhatsApp', 'wa'],
                        'landing' => ['Landing', 'integration', 'Formulario'],
                    ];
                    $origins = $platformMap[$platform] ?? [$platform];
                    $q->whereIn('clients.origin', $origins);
                })
                ->when($advisorId && $advisorId !== 'all', function ($q) use ($advisorId) {
                    $q->where('clients.assigned_to', $advisorId);
                })
                ->groupBy('clients.campaign_id', 'campaign.title', 'clients.adset_name', 'clients.ad_name')
                ->orderBy('campaign.title', 'asc')
                ->orderBy('total', 'desc')
                ->get();

            $hierarchy = [];
            foreach ($rawAdsData as $row) {
                if (!isset($hierarchy[$row->campaign_id])) {
                    $hierarchy[$row->campaign_id] = [
                        'id'     => $row->campaign_id,
                        'name'   => $row->campaign_name,
                        'adSets' => []
                    ];
                }

                if (!isset($hierarchy[$row->campaign_id]['adSets'][$row->adset_name])) {
                    $hierarchy[$row->campaign_id]['adSets'][$row->adset_name] = [
                        'name' => $row->adset_name,
                        'ads'  => []
                    ];
                }

                $adName = $row->ad_name;
                if (!isset($hierarchy[$row->campaign_id]['adSets'][$row->adset_name]['ads'][$adName])) {
                    $hierarchy[$row->campaign_id]['adSets'][$row->adset_name]['ads'][$adName] = [
                        'name'      => $adName,
                        'total'     => 0,
                        'contacted' => 0,
                        'archived'  => 0,
                        'sales'     => 0
                    ];
                }

                $ad = &$hierarchy[$row->campaign_id]['adSets'][$row->adset_name]['ads'][$adName];
                $ad['total']     += $row->total;
                $ad['contacted'] += ($row->total - $row->pending);
                $ad['archived']  += $row->archived;
                $ad['sales']     += $row->sales;
            }

            // Convertir adSets y ads de asociativo a indexado
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

            // ──────────────────────────────────────────────────────────
            // Ranking de asesores
            // ──────────────────────────────────────────────────────────
            $usersRanking = (clone $clientsQuery())
                ->select([
                    'assigned_to',
                    DB::raw('count(distinct clients.id) as count'),
                    DB::raw('SUM(chp.price) as total')
                ])
                ->leftJoin('client_has_products as chp', 'chp.client_id', 'clients.id')
                ->with('assigned')
                ->whereNotNull('assigned_to')
                ->groupBy('assigned_to')
                ->orderBy('total', 'desc')
                ->get();

            $clientsListRaw = (clone $clientsQuery())
                ->with(['products', 'assigned', 'campaign'])
                ->get();

            $groupedClients = [];
            foreach ($clientsListRaw as $client) {
                $campaignName = $client->campaign->title ?? 'Sin Campaña';
                $adsetName    = $client->adset_name ?? 'Sin Adset';
                $adName       = $client->ad_name ?? 'Sin Anuncio';

                if (!isset($groupedClients[$campaignName])) $groupedClients[$campaignName] = [];
                if (!isset($groupedClients[$campaignName][$adsetName])) $groupedClients[$campaignName][$adsetName] = [];
                if (!isset($groupedClients[$campaignName][$adsetName][$adName])) $groupedClients[$campaignName][$adsetName][$adName] = [];

                $groupedClients[$campaignName][$adsetName][$adName][] = $client;
            }

            $clientsList = [];
            foreach ($groupedClients as $cName => $adsets) {
                $cData = ['name' => $cName, 'adsets' => []];
                foreach ($adsets as $asName => $ads) {
                    $asData = ['name' => $asName, 'ads' => []];
                    foreach ($ads as $aName => $leads) {
                        $asData['ads'][] = ['name' => $aName, 'leads' => $leads];
                    }
                    $cData['adsets'][] = $asData;
                }
                $clientsList[] = $cData;
            }

            // ──────────────────────────────────────────────────────────
            // Ganadores por Cierres (ventas)
            // ──────────────────────────────────────────────────────────
            $winningCampaign = (clone $clientsQuery())
                ->leftJoin('client_has_products as chp', 'chp.client_id', 'clients.id')
                ->select('campaign.title as name', 'clients.campaign_id', DB::raw('count(distinct clients.id) as count'), DB::raw('SUM(chp.price) as total_amount'))
                ->groupBy('campaign.title', 'clients.campaign_id')
                ->orderByDesc('count')
                ->first();

            $winningAdset = null;
            $winningAd    = null;

            if ($winningCampaign) {
                $winningAdset = (clone $clientsQuery())
                    ->where('clients.campaign_id', $winningCampaign->campaign_id)
                    ->leftJoin('client_has_products as chp', 'chp.client_id', 'clients.id')
                    ->select('clients.adset_name as name', DB::raw('count(distinct clients.id) as count'), DB::raw('SUM(chp.price) as total_amount'))
                    ->groupBy('clients.adset_name')
                    ->orderByDesc('count')
                    ->first();

                if ($winningAdset) {
                    $winningAd = (clone $clientsQuery())
                        ->where('clients.campaign_id', $winningCampaign->campaign_id)
                        ->where('clients.adset_name', $winningAdset->name)
                        ->leftJoin('client_has_products as chp', 'chp.client_id', 'clients.id')
                        ->select('clients.ad_name as name', DB::raw('count(distinct clients.id) as count'), DB::raw('SUM(chp.price) as total_amount'))
                        ->groupBy('clients.ad_name')
                        ->orderByDesc('count')
                        ->first();
                }
            }

            $campaignsRanking = (clone $clientsQuery())
                ->select([
                    'clients.adset_name',
                    'clients.ad_name',
                    DB::raw('count(distinct clients.id) as count'),
                    DB::raw('SUM(chp.price) as total_liquidated')
                ])
                ->leftJoin('client_has_products as chp', 'chp.client_id', 'clients.id')
                ->groupBy('clients.adset_name', 'clients.ad_name')
                ->orderByDesc('total_liquidated')
                ->get();

            // ──────────────────────────────────────────────────────────
            // Ganadores por Leads totales (captación)
            // ──────────────────────────────────────────────────────────
            $leadWinningCampaign = (clone $query())
                ->select('campaign.title as name', 'clients.campaign_id', DB::raw('count(*) as count'))
                ->groupBy('campaign.title', 'clients.campaign_id')
                ->orderByDesc('count')
                ->first();

            $leadWinningAdset = null;
            $leadWinningAd    = null;

            if ($leadWinningCampaign) {
                $leadWinningAdset = (clone $query())
                    ->where('clients.campaign_id', $leadWinningCampaign->campaign_id)
                    ->select('clients.adset_name as name', DB::raw('count(*) as count'))
                    ->groupBy('clients.adset_name')
                    ->orderByDesc('count')
                    ->first();

                if ($leadWinningAdset) {
                    $leadWinningAd = (clone $query())
                        ->where('clients.campaign_id', $leadWinningCampaign->campaign_id)
                        ->where('clients.adset_name', $leadWinningAdset->name)
                        ->select('clients.ad_name as name', DB::raw('count(*) as count'))
                        ->groupBy('clients.ad_name')
                        ->orderByDesc('count')
                        ->first();
                }
            }

            // ──────────────────────────────────────────────────────────
            // Leads por día (para el gráfico timeline) con ajuste timezone (+5 horas)
            // ──────────────────────────────────────────────────────────
            $leadsByDay = $query()
                ->select([
                    DB::raw('DATE(DATE_ADD(clients.created_at, INTERVAL 5 HOUR)) as date'),
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') AND clients.status IS NOT NULL THEN 1 END) as sales'),
                    DB::raw('COUNT(CASE WHEN clients.status IS NULL THEN 1 END) as archived'),
                ])
                ->groupBy(DB::raw('DATE(DATE_ADD(clients.created_at, INTERVAL 5 HOUR))'))
                ->orderBy(DB::raw('DATE(DATE_ADD(clients.created_at, INTERVAL 5 HOUR))'), 'asc')
                ->get();

            // ──────────────────────────────────────────────────────────
            // Meta de leads (campaign_goals)
            // ──────────────────────────────────────────────────────────
            $goals = [];
            $goalProgress = null;
            try {
                $goalsRaw = DB::table('campaign_goals')
                    ->where('business_id', Auth::user()->business_id)
                    ->whereNull('campaign_id')
                    ->where('period', 'monthly')
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($goalsRaw) {
                    $progress = $totalCount > 0 ? min(100, round(($totalCount / $goalsRaw->target_leads) * 100, 1)) : 0;
                    $goalProgress = [
                        'target'   => $goalsRaw->target_leads,
                        'current'  => $totalCount,
                        'percent'  => $progress,
                    ];
                }
            } catch (\Throwable $e) {
                // La tabla puede no existir aún
            }

            // ──────────────────────────────────────────────────────────
            // Gasto publicitario (spend) de campañas del periodo
            // ──────────────────────────────────────────────────────────
            $totalSpend = 0;
            $cpl = 0;
            $cpa = 0;
            $roas = 0;
            try {
                // Tipo de cambio en tiempo real desde API Luna (tc_venta)
                $exchangeRateCalc = $this->getLunaExchangeRate();
                
                $activeCampaignIds = array_keys($hierarchy ?? []);
                if (!empty($activeCampaignIds)) {
                    $campaignsForSpend = DB::table('campaigns')
                        ->where('business_id', Auth::user()->business_id)
                        ->whereIn('id', $activeCampaignIds)
                        ->get(['spend', 'currency']);
                        
                    foreach ($campaignsForSpend as $c) {
                        $cSpend = (float)$c->spend;
                        if (strtoupper($c->currency) === 'USD') {
                            $cSpend *= $exchangeRateCalc;
                        }
                        $totalSpend += $cSpend;
                    }
                } else {
                    $totalSpend = 0;
                }

                if ($totalCount > 0 && $totalSpend > 0) {
                    $cpl = round($totalSpend / $totalCount, 2);
                }
                if ($clientsCount > 0 && $totalSpend > 0) {
                    $cpa = round($totalSpend / $clientsCount, 2);
                }
                if ($totalSpend > 0 && $clientsSum > 0) {
                    $roas = round($clientsSum / $totalSpend, 2);
                }
            } catch (\Throwable $e) {
                // Columna spend puede no existir aún
            }

            $response->summary = [
                // Datos del periodo
                'dateFrom'     => $dateFrom,
                'dateTo'       => $dateTo,
                'platform'     => $platform,
                'advisorId'    => $advisorId,

                // Métricas principales
                'hierarchy'    => $finalHierarchy,
                'grouped'      => $grouped,
                'totalCount'   => $totalCount,
                'totalSum'     => $totalSum,
                'clientsCount' => $clientsCount,
                'clientsSum'   => $clientsSum,
                'archivedCount'=> $archivedCount,
                'archivedSum'  => $archivedSum,
                'pendingCount' => $pendingCount,
                'managingCount'=> $managingCount,
                'trueManagingCount' => $trueManagingCount,
                'managingSum'  => $managingSum,

                // Comparativa con periodo anterior
                'previousPeriod' => $previousPeriod,
                'variations'     => $variations,

                // Gasto publicitario
                'totalSpend'  => $totalSpend,
                'cpl'         => $cpl,
                'cpa'         => $cpa,
                'roas'        => $roas,

                // Meta de leads
                'goalProgress' => $goalProgress,

                // Timeline leads por día
                'leadsByDay'   => $leadsByDay,

                // Fuentes y orígenes
                'leadSources'  => $leadSources,
                'originCounts' => $originCounts,
                'originCampaignCounts' => $originCampaignCounts,
                'originLandingCampaignCounts' => $originLandingCampaignCounts,
                'totalConversionPercent' => $totalConversionPercent,
                'funnelCounts' => $funnelCounts,
                'breakdownCounts' => $breakdownCounts,

                // Archivados
                'totalArchivedCounts' => $totalArchivedCounts,
                'archivedLabelsCount' => $archivedLabelsCount,
                'archivedBreakdown'   => $archivedBreakdown,
                'convertedLabelsCount'=> 0,

                // Ranking
                'usersAssignation' => $usersAssignation,
                'usersRanking'     => $usersRanking,
                'campaignsRanking' => $campaignsRanking,
                'clientsList'      => $clientsList,

                // Ganadores
                'winningCampaign'    => $winningCampaign,
                'winningAdset'       => $winningAdset,
                'winningAd'          => $winningAd,
                'leadWinningCampaign'=> $leadWinningCampaign,
                'leadWinningAdset'   => $leadWinningAdset,
                'leadWinningAd'      => $leadWinningAd,
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
            'manage_status.name as manage_status_name',
            'manage_status.color as manage_status_color',
            'users.name as assigned_name',
            'users.relative_id as assigned_relative_id'
        ])
            ->leftJoin('statuses', 'statuses.id', '=', 'clients.status_id')
            ->leftJoin('statuses as manage_status', 'manage_status.id', '=', 'clients.manage_status_id')
            ->leftJoin('users', 'users.id', '=', 'clients.assigned_to')
            ->where(function ($query) use ($request) {
                // Soporte para date_from/date_to y legacy month con ajuste de zona horaria de Meta (+5 horas)
                if ($request->date_from && $request->date_to) {
                    $query->whereBetween(DB::raw('DATE_ADD(clients.created_at, INTERVAL 5 HOUR)'), [
                        $request->date_from . ' 00:00:00',
                        $request->date_to . ' 23:59:59'
                    ]);
                } elseif ($request->month) {
                    $query->whereRaw("DATE_FORMAT(DATE_ADD(clients.created_at, INTERVAL 5 HOUR), '%Y-%m') = ?", [$request->month]);
                }
                if ($request->campaign_id) {
                    $query->where('clients.campaign_id', $request->campaign_id);
                }
                if ($request->adset_name) {
                    $query->where('clients.adset_name', $request->adset_name);
                }
                if ($request->ad_name) {
                    $query->where('clients.ad_name', $request->ad_name);
                }
                if ($request->platform && $request->platform !== 'all') {
                    $platformMap = [
                        'fb'      => ['Facebook', 'fb', 'Meta', 'facebook', 'facebook&instagram'],
                        'ig'      => ['Instagram', 'ig', 'instagram', 'facebook&instagram'],
                        'wa'      => ['WhatsApp', 'Whatsapp', 'whatsapp', 'wa'],
                        'landing' => ['Landing', 'landing', 'integration', 'Formulario', 'CRM Atalaya'],
                    ];
                    $origins = $platformMap[$request->platform] ?? [$request->platform];
                    $query->whereIn('clients.origin', $origins);
                }
                if ($request->advisor_id && $request->advisor_id !== 'all') {
                    $query->where('clients.assigned_to', $request->advisor_id);
                }
            });
    }

    /**
     * Obtiene el tipo de cambio USD → PEN (tc_venta) desde la API de Luna en tiempo real.
     * Si la API falla, retorna el valor guardado en settings o 3.80 como fallback.
     */
    private function getLunaExchangeRate(): float
    {
        try {
            $res = new \SoDe\Extend\Fetch(
                'https://apiluna.cambiafx.pe/api/BackendPizarra/getTcCustomerNoAuth?idParCurrency=1'
            );
            $data = $res->json();

            if (is_array($data) && count($data) > 0) {
                $tcVenta = (float)($data[0]['tcSale'] ?? 0);
                if ($tcVenta > 0) {
                    return $tcVenta;
                }
            }
        } catch (\Throwable $e) {
            // Si la API falla, usamos el valor guardado o el fallback
        }

        return (float)(Setting::get('exchange-rate-usd-pen') ?? 3.80);
    }
}
