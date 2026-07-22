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

    private function getPreviousPeriod(string $dateFrom, string $dateTo): array
    {
        $from = \Carbon\Carbon::parse($dateFrom);
        $to   = \Carbon\Carbon::parse($dateTo);
        $diffInSeconds = $from->diffInSeconds($to);

        $prevTo   = (clone $from)->subSecond();
        $prevFrom = (clone $prevTo)->subSeconds($diffInSeconds);

        return [
            $prevFrom->toDateTimeString(),
            $prevTo->toDateTimeString(),
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
                // El frontend envía las fechas seleccionadas (ej. 2026-07-01 y 2026-07-21).
                // Meta exporta tomando el rango exacto desde medianoche UTC (que coincide con la exportación de Meta).
                $dateFromStr = substr($request->date_from, 0, 10) . ' 00:00:00';
                $dateToStr   = substr($request->date_to, 0, 10) . ' 23:59:59';
                
                $dateFrom = \Carbon\Carbon::parse($dateFromStr, 'UTC')->setTimezone('America/Lima')->toDateTimeString();
                $dateTo   = \Carbon\Carbon::parse($dateToStr, 'UTC')->setTimezone('America/Lima')->toDateTimeString();
            } elseif ($month || $request->month) {
                // Compatibilidad legacy con parámetro del segmento de ruta
                $m = $month ?? $request->month;
                [$year, $mo] = \explode('-', $m);
                // Meta registra desde medianoche UTC
                $dateFrom = \Carbon\Carbon::parse("{$year}-{$mo}-01 00:00:00", 'UTC')->setTimezone('America/Lima')->toDateTimeString();
                $lastDay  = date('t', mktime(0, 0, 0, (int)$mo, 1, (int)$year));
                $dateTo   = \Carbon\Carbon::parse("{$year}-{$mo}-{$lastDay} 23:59:59", 'UTC')->setTimezone('America/Lima')->toDateTimeString();
            } else {
                // Default: mes actual
                $dateFrom = \Carbon\Carbon::now('UTC')->startOfMonth()->setTimezone('America/Lima')->toDateTimeString();
                $dateTo   = \Carbon\Carbon::now('UTC')->endOfMonth()->setTimezone('America/Lima')->toDateTimeString();
            }

            $platform  = $request->platform  ?? null;
            $advisorId = $request->advisor_id ?? null;
            $excludeSpend = filter_var($request->input('exclude_spend'), FILTER_VALIDATE_BOOLEAN);

            // Auto-sincronización de gasto removida del proceso síncrono para agilizar la carga.
            // Se realiza asíncronamente desde el cliente frontend.

            // Periodo anterior (misma duración, inmediatamente antes)
            [$prevDateFrom, $prevDateTo] = $this->getPreviousPeriod($dateFrom, $dateTo);

            $defaultLeadStatus   = Setting::get('default-lead-status');
            $asignationLeadStatus = JSON::parseable(Setting::get('assignation-lead-status')) ?? [];

            $leadStatuses   = Status::forLeads()->get();
            $clientStatuses = Status::forClients()->get();

            $leadStatusesIds   = array_map(fn($s) => $s['id'], $leadStatuses->toArray());
            $clientStatusesIds = array_map(fn($s) => $s['id'], $clientStatuses->toArray());

            // ──────────────────────────────────────────────────────────
            // Query base: campaña válida + atribución registrada en client_entries
            // ──────────────────────────────────────────────────────────
            $queryBase = fn() => Client::where('clients.business_id', Auth::user()->business_id)
                ->select('clients.*')
                ->distinct()
                ->join('client_entries as ce', 'ce.client_id', '=', 'clients.id')
                ->join('campaigns as campaign', 'campaign.id', '=', 'ce.campaign_id')
                ->whereRaw('LENGTH(ce.campaign_id) > 10');

            // Query con filtros de ad meta (adset + ad) + fecha de entrada en client_entries con ajuste de zona horaria de Meta
            $query = function () use ($queryBase, $dateFrom, $dateTo, $platform, $advisorId) {
                $q = $queryBase()
                    ->whereNotNull('ce.adset_name')
                    ->where('ce.adset_name', '<>', '')
                    ->whereNotNull('ce.ad_name')
                    ->where('ce.ad_name', '<>', '')
                    ->whereBetween('ce.entry_date', [$dateFrom, $dateTo]);
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            // Query equivalente para el periodo anterior con ajuste de zona horaria de Meta
            $queryPrev = function () use ($queryBase, $prevDateFrom, $prevDateTo, $platform, $advisorId) {
                $q = $queryBase()
                    ->whereNotNull('ce.adset_name')
                    ->where('ce.adset_name', '<>', '')
                    ->whereNotNull('ce.ad_name')
                    ->where('ce.ad_name', '<>', '')
                    ->whereBetween('ce.entry_date', [$prevDateFrom, $prevDateTo]);
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            $countUnique = function ($q) {
                return (clone $q)
                    ->toBase()
                    ->cloneWithout(['columns', 'distinct'])
                    ->selectRaw('COUNT(DISTINCT COALESCE(NULLIF(RIGHT(REGEXP_REPLACE(clients.contact_phone, "[^0-9]", ""), 9), ""), LOWER(clients.contact_email))) as aggregate')
                    ->value('aggregate') ?? 0;
            };

            // ──────────────────────────────────────────────────────────
            // Métricas del periodo actual
            // ──────────────────────────────────────────────────────────
            $totalCount = $countUnique($query());
            $totalSum   = (clone $query())
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $grouped = $query()
                ->select([
                    'status.id',
                    'status.name',
                    'status.color',
                    'status.order',
                    DB::raw('COUNT(DISTINCT COALESCE(NULLIF(clients.contact_phone, ""), clients.contact_email)) AS quantity')
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
                            ->whereBetween('client_status_traces.created_at', [$dateFrom, $dateTo]);
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
                            ->whereBetween('client_status_traces.created_at', [$prevDateFrom, $prevDateTo]);
                    });
                return $this->applyOptionalFilters($q, $platform, $advisorId);
            };

            $clientsCount = $countUnique($clientsQuery());
            $clientsSum   = (clone $clientsQuery())
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            $archivedCount     = $countUnique((clone $managingBase)->whereNull('clients.status'));
            $trueManagingCount = $countUnique((clone $managingBase)->where('clients.status', true));
            $managingCount     = $countUnique($managingBase);

            $pendingCount = $countUnique($query()->where('clients.status_id', $defaultLeadStatus));

            $managingSum = (clone $managingBase)
                ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                ->sum('chp.price');

            // ──────────────────────────────────────────────────────────
            // Métricas del periodo ANTERIOR (para comparativa ↑↓)
            // ──────────────────────────────────────────────────────────
            $prevTotalCount   = $countUnique($queryPrev());
            $prevClientsCount = $countUnique($clientsQueryPrev());
            $prevArchivedCount = $countUnique((clone $queryPrev())
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->where('clients.status_id', '<>', $defaultLeadStatus)
                ->whereNull('clients.status'));
            $prevManagingCount = $countUnique((clone $queryPrev())
                ->whereIn('clients.status_id', $leadStatusesIds)
                ->where('clients.status_id', '<>', $defaultLeadStatus));

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
                    'status.table_id',
                    'status.order',
                    DB::raw('COUNT(DISTINCT COALESCE(NULLIF(clients.contact_phone, ""), clients.contact_email)) AS quantity')
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

            $breakdownCounts = Breakdown::whereBetween('created_at', [$dateFrom, $dateTo])
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
                    AND client_notes.created_at BETWEEN "' . $dateFrom . '" AND "' . $dateTo . '"
                ) as emails_sent'),
            ];

            if ($convertedLeadStatus) $columns[] = DB::raw('(SELECT COUNT(*)
                FROM client_notes
                WHERE client_notes.user_id = clients.assigned_to
                AND client_notes.manage_status_id = "' . $convertedLeadStatus . '"
                AND client_notes.created_at BETWEEN "' . $dateFrom . '" AND "' . $dateTo . '"
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

            // Jerarquía: Campaign → AdSet → Ads
            // ──────────────────────────────────────────────────────────
            $rawAdsData = Client::whereBetween('clients.created_at', [$dateFrom, $dateTo])
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
                // Resolviendo adset_name si es numérico
                $adsetName = $row->adset_name;
                if (is_numeric($adsetName) || preg_match('/^\d+$/', $adsetName)) {
                    $dbAdSet = DB::table('ad_sets')->where('meta_id', $adsetName)->first();
                    if ($dbAdSet && $dbAdSet->name) {
                        $adsetName = $dbAdSet->name;
                    }
                }

                // Resolviendo ad_name si es numérico
                $adName = $row->ad_name;
                if (is_numeric($adName) || preg_match('/^\d+$/', $adName)) {
                    $dbAd = DB::table('ads')->where('meta_id', $adName)->first();
                    if ($dbAd && $dbAd->name) {
                        $adName = $dbAd->name;
                    }
                }

                if (!isset($hierarchy[$row->campaign_id])) {
                    $hierarchy[$row->campaign_id] = [
                        'id'     => $row->campaign_id,
                        'name'   => $row->campaign_name,
                        'adSets' => []
                    ];
                }

                if (!isset($hierarchy[$row->campaign_id]['adSets'][$adsetName])) {
                    $hierarchy[$row->campaign_id]['adSets'][$adsetName] = [
                        'name' => $adsetName,
                        'ads'  => []
                    ];
                }

                if (!isset($hierarchy[$row->campaign_id]['adSets'][$adsetName]['ads'][$adName])) {
                    $hierarchy[$row->campaign_id]['adSets'][$adsetName]['ads'][$adName] = [
                        'name'      => $adName,
                        'total'     => 0,
                        'contacted' => 0,
                        'archived'  => 0,
                        'sales'     => 0
                    ];
                }

                $ad = &$hierarchy[$row->campaign_id]['adSets'][$adsetName]['ads'][$adName];
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

            // lookup de anuncios (imagen y gasto)
            $adsLookup = [];
            try {
                $businessAds = \App\Models\Ad::select('ads.name', 'ads.preview_image_url', 'ads.spend', 'ad_sets.name as adset_name')
                    ->join('ad_sets', 'ad_sets.id', '=', 'ads.ad_set_id')
                    ->where('ads.business_id', Auth::user()->business_id)
                    ->get();
                foreach ($businessAds as $adModel) {
                    $key = $adModel->adset_name . '|||' . $adModel->name;
                    $adsLookup[$key] = [
                        'preview_image_url' => $adModel->preview_image_url,
                        'spend' => (float)$adModel->spend
                    ];
                }
            } catch (\Throwable $e) {
                // Si falla la tabla, continuar sin lookup
            }

            $clientsList = [];
            foreach ($groupedClients as $cName => $adsets) {
                $cData = ['name' => $cName, 'adsets' => []];
                foreach ($adsets as $asName => $ads) {
                    $asData = ['name' => $asName, 'ads' => []];
                    foreach ($ads as $aName => $leads) {
                        $lookupKey = $asName . '|||' . $aName;
                        $adInfo = $adsLookup[$lookupKey] ?? [
                            'preview_image_url' => null,
                            'spend' => 0.0
                        ];
                        $asData['ads'][] = [
                            'name' => $aName,
                            'leads' => $leads,
                            'preview_image_url' => $adInfo['preview_image_url'],
                            'spend' => $adInfo['spend']
                        ];
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

            // Leads por día (para el gráfico timeline) con ajuste timezone
            // ──────────────────────────────────────────────────────────
            $leadsByDay = $query()
                ->select([
                    DB::raw("DATE(clients.created_at) as date"),
                    DB::raw('COUNT(*) as total'),
                    DB::raw('COUNT(CASE WHEN clients.status_id IN (' . implode(',', array_map(fn($id) => '"' . $id . '"', $clientStatusesIds)) . ') AND clients.status IS NOT NULL THEN 1 END) as sales'),
                    DB::raw('COUNT(CASE WHEN clients.status IS NULL THEN 1 END) as archived'),
                ])
                ->groupBy(DB::raw('DATE(clients.created_at)'))
                ->orderBy(DB::raw('DATE(clients.created_at)'), 'asc')
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
            if (!$excludeSpend) {
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
            }

            // ──────────────────────────────────────────────────────────
            // Evolución Semanal — divide el rango en semanas dinámicas
            // y calcula las métricas por semana según weekStartDay
            // ──────────────────────────────────────────────────────────
            $weeklyEvolution = [];
            try {
                $weekStartDaySetting = (int)(Setting::get('campaign-week-start-day') ?? 1); // 1 = Lunes

                $startLimit = \Carbon\Carbon::parse($dateFrom)->startOfMonth()->startOfDay();
                $endLimit   = \Carbon\Carbon::parse($dateTo)->endOfMonth()->endOfDay();

                // Obtener desglose de inversión diaria de todas las plataformas
                $dailySpends = [];
                if (!$excludeSpend) {
                    $dailySpends = $this->getDailySpendBreakdown($startLimit->toDateTimeString(), $endLimit->toDateTimeString());
                }

                $currentStart = $startLimit->copy();
                $weekNumber   = 1;

                // Día que cierra la semana: el día anterior al inicio de semana
                $targetEndDay = ($weekStartDaySetting === 0) ? 6 : ($weekStartDaySetting - 1);

                while ($currentStart->lte($endLimit)) {
                    // Calcular el último día de esta semana
                    $currentEnd = $currentStart->copy();
                    for ($i = 0; $i < 6; $i++) {
                        if ($currentEnd->dayOfWeek === $targetEndDay) break;
                        $currentEnd->addDay();
                    }
                    if ($currentEnd->gt($endLimit)) {
                        $currentEnd = $endLimit->copy();
                    }
                    $currentEnd->endOfDay();

                    $startStr = $currentStart->toDateTimeString();
                    $endStr   = $currentEnd->toDateTimeString();

                    // ── Registros (leads creados en la semana con ads) ─────
                    $weekLeadBase = Client::where('clients.business_id', Auth::user()->business_id)
                        ->join('campaigns as campaign', 'campaign.id', '=', 'clients.campaign_id')
                        ->whereRaw('LENGTH(clients.campaign_id) > 10')
                        ->whereBetween('clients.created_at', [$startStr, $endStr]);
                    $weekLeadBase = $this->applyOptionalFilters($weekLeadBase, $platform, $advisorId);

                    $registros = (clone $weekLeadBase)->count();

                    // ── Inversión de la semana (sumando gastos diarios) ───
                    $weekSpend  = 0.0;
                    $tempDate   = $currentStart->copy();
                    while ($tempDate->lte($currentEnd)) {
                        $weekSpend += ($dailySpends[$tempDate->format('Y-m-d')] ?? 0);
                        $tempDate->addDay();
                    }

                    // ── Contactados (status != default) ──────────────────
                    $contactados = (clone $weekLeadBase)
                        ->whereIn('clients.status_id', $leadStatusesIds)
                        ->where('clients.status_id', '<>', $defaultLeadStatus)
                        ->count();

                    // ── Respondió (contactados + status = true) ───────────
                    $respondio = (clone $weekLeadBase)
                        ->whereIn('clients.status_id', $leadStatusesIds)
                        ->where('clients.status_id', '<>', $defaultLeadStatus)
                        ->where('clients.status', true)
                        ->count();

                    $noContesta = max(0, $contactados - $respondio);

                    // ── Ventas (cierres trazados en esta semana) ──────────
                    $ventasBase = Client::where('clients.business_id', Auth::user()->business_id)
                        ->join('campaigns as campaign', 'campaign.id', '=', 'clients.campaign_id')
                        ->whereRaw('LENGTH(clients.campaign_id) > 10')
                        ->whereIn('clients.status_id', $clientStatusesIds)
                        ->whereExists(function ($sub) use ($startStr, $endStr) {
                            $sub->select(DB::raw(1))
                                ->from('client_status_traces')
                                ->join('statuses', 'statuses.id', '=', 'client_status_traces.status_id')
                                ->where('statuses.table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
                                ->whereColumn('client_status_traces.client_id', 'clients.id')
                                ->whereBetween('client_status_traces.created_at', [$startStr, $endStr]);
                        });
                    $ventasBase = $this->applyOptionalFilters($ventasBase, $platform, $advisorId);
                    $ventas     = (clone $ventasBase)->count();

                    // ── Monto vendido en la semana ────────────────────────
                    $salesAmount = (clone $ventasBase)
                        ->join('client_has_products AS chp', 'chp.client_id', 'clients.id')
                        ->sum('chp.price');

                    // ── Ratios ────────────────────────────────────────────
                    $cpr        = ($registros > 0 && $weekSpend > 0) ? round($weekSpend / $registros, 2)   : 0;
                    $pctContact = ($registros > 0) ? round(($contactados / $registros) * 100, 1) : 0;
                    $pctCierre  = ($registros > 0) ? round(($ventas / $registros) * 100, 1)      : 0;
                    $weekRoas   = ($weekSpend > 0 && $salesAmount > 0) ? round($salesAmount / $weekSpend, 2) : 0;

                    $weeklyEvolution[] = [
                        'label'           => 'S' . $weekNumber,
                        'start_formatted' => $currentStart->format('d/m'),
                        'end_formatted'   => $currentEnd->format('d/m'),
                        'registros'       => $registros,
                        'spend'           => round($weekSpend, 2),
                        'cpr'             => $cpr,
                        'contactados'     => $contactados,
                        'noContesta'      => $noContesta,
                        'respondio'       => $respondio,
                        'ventas'          => $ventas,
                        'salesAmount'     => round((float)$salesAmount, 2),
                        'pctContact'      => $pctContact,
                        'pctCierre'       => $pctCierre,
                        'roas'            => $weekRoas,
                        'diffContactados' => null,
                        'diffNoContesta'  => null,
                        'diffRespondio'   => null,
                        'diffVentas'      => null,
                    ];

                    // Avanzar al inicio de la siguiente semana
                    $currentStart = $currentEnd->copy()->addDay()->startOfDay();
                    $weekNumber++;
                }

                // Calcular variaciones vs semana anterior
                for ($idx = 1; $idx < count($weeklyEvolution); $idx++) {
                    $prev = $weeklyEvolution[$idx - 1];
                    $weeklyEvolution[$idx]['diffContactados'] = $weeklyEvolution[$idx]['contactados'] - $prev['contactados'];
                    $weeklyEvolution[$idx]['diffNoContesta']  = $weeklyEvolution[$idx]['noContesta']  - $prev['noContesta'];
                    $weeklyEvolution[$idx]['diffRespondio']   = $weeklyEvolution[$idx]['respondio']   - $prev['respondio'];
                    $weeklyEvolution[$idx]['diffVentas']      = $weeklyEvolution[$idx]['ventas']      - $prev['ventas'];
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Error calculando evolución semanal: ' . $e->getMessage());
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

                // Evolución Semanal
                'weeklyEvolution'    => $weeklyEvolution,
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
            'ce.campaign_id',
            'ce.adset_name',
            'ce.ad_name',
            'ce.entry_date as created_at',
            'statuses.name as status_name',
            'statuses.color as status_color',
            'manage_status.name as manage_status_name',
            'manage_status.color as manage_status_color',
            'users.name as assigned_name',
            'users.relative_id as assigned_relative_id'
        ])
            ->distinct()
            ->join('client_entries as ce', 'ce.client_id', '=', 'clients.id')
            ->leftJoin('statuses', 'statuses.id', '=', 'clients.status_id')
            ->leftJoin('statuses as manage_status', 'manage_status.id', '=', 'clients.manage_status_id')
            ->leftJoin('users', 'users.id', '=', 'clients.assigned_to')
            ->where(function ($query) use ($request) {
                if ($request->date_from && $request->date_to) {
                    $dateFromStr = substr($request->date_from, 0, 10) . ' 00:00:00';
                    $dateToStr   = substr($request->date_to, 0, 10) . ' 23:59:59';
                    $dateFrom = \Carbon\Carbon::parse($dateFromStr, 'UTC')->setTimezone('America/Lima')->toDateTimeString();
                    $dateTo   = \Carbon\Carbon::parse($dateToStr, 'UTC')->setTimezone('America/Lima')->toDateTimeString();
                    $query->whereBetween('ce.entry_date', [$dateFrom, $dateTo]);
                } elseif ($request->month) {
                    // Si mandan solo mes, ajustarlo a la zona horaria correcta de Meta (UTC)
                    [$year, $mo] = \explode('-', $request->month);
                    $dateFrom = \Carbon\Carbon::parse("{$year}-{$mo}-01 00:00:00", 'UTC')->setTimezone('America/Lima')->toDateTimeString();
                    $lastDay  = date('t', mktime(0, 0, 0, (int)$mo, 1, (int)$year));
                    $dateTo   = \Carbon\Carbon::parse("{$year}-{$mo}-{$lastDay} 23:59:59", 'UTC')->setTimezone('America/Lima')->toDateTimeString();
                    $query->whereBetween('ce.entry_date', [$dateFrom, $dateTo]);
                }
                if ($request->campaign_id) {
                    $query->where('ce.campaign_id', $request->campaign_id);
                }
                if ($request->adset_name) {
                    $query->where('ce.adset_name', $request->adset_name);
                }
                if ($request->ad_name) {
                    $query->where('ce.ad_name', $request->ad_name);
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
     * Obtiene el desfase de horas necesario para alinear las fechas de la base de datos
     * con la zona horaria UTC de Meta. Si el servidor de bases de datos ya está en UTC,
     * no se aplica ningún desfase (0). Si está en America/Lima, se le suman 5 horas.
     */
    private function getTimezoneShift(): int
    {
        try {
            $tz = DB::select("SELECT @@session.time_zone as tz")[0]->tz;
            if ($tz === 'SYSTEM') {
                $tz = DB::select("SELECT @@global.time_zone as tz")[0]->tz;
            }
            if ($tz === 'UTC' || $tz === '+00:00' || str_contains(strtolower($tz), 'utc')) {
                return 0;
            }
            return 5;
        } catch (\Throwable $e) {
            return 5;
        }
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

    /**
     * Obtiene el gasto diario desglosado para Meta, Google Ads y TikTok.
     */
    private function getDailySpendBreakdown(string $dateFrom, string $dateTo): array
    {
        $businessId = Auth::user()->business_id;
        $exchangeRateCalc = $this->getLunaExchangeRate();
        $dailySpends = [];

        $startDateStr = substr($dateFrom, 0, 10);
        $endDateStr = substr($dateTo, 0, 10);

        // 1. Meta Ads Daily Spend
        try {
            $integration = \App\Models\Integration::where('business_id', $businessId)
                ->where(function($q) {
                    $q->where('meta_service', 'forms')
                      ->orWhere('meta_service', 'messenger');
                })
                ->whereNotNull('meta_access_token')
                ->whereNotNull('meta_ad_account_id')
                ->where('meta_ad_account_id', '<>', '')
                ->first();

            if ($integration) {
                $accessToken = $integration->meta_app_token ?: $integration->meta_access_token;
                $adAccountId = ltrim($integration->meta_ad_account_id, 'act_');
                $graphUrl = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');

                // Obtener moneda
                $accountUrl = "{$graphUrl}/act_{$adAccountId}?fields=currency&access_token={$accessToken}";
                $accRes = new \SoDe\Extend\Fetch($accountUrl);
                $accBody = $accRes->json();
                $currency = $accBody['currency'] ?? 'PEN';

                // Llamar a Meta Ads API con time_increment=1
                $timeRange = json_encode(['since' => $startDateStr, 'until' => $endDateStr]);
                $url = "{$graphUrl}/act_{$adAccountId}/insights?level=campaign&time_increment=1&time_range=" . urlencode($timeRange)
                     . "&fields=spend,date_start"
                     . "&limit=500"
                     . "&access_token={$accessToken}";

                $nextUrl = $url;
                $pages = 0;
                while ($nextUrl && $pages < 10) {
                    $res = new \SoDe\Extend\Fetch($nextUrl);
                    $body = $res->json();
                    if (isset($body['error'])) break;

                    if (!empty($body['data'])) {
                        foreach ($body['data'] as $item) {
                            $day = $item['date_start'] ?? null;
                            $spend = (float)($item['spend'] ?? 0);
                            if ($day) {
                                if (strtoupper($currency) === 'USD') {
                                    $spend *= $exchangeRateCalc;
                                }
                                $dailySpends[$day] = ($dailySpends[$day] ?? 0) + $spend;
                            }
                        }
                    }
                    $nextUrl = $body['paging']['next'] ?? null;
                    $pages++;
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Error fetching daily Meta spend: " . $e->getMessage());
        }

        // 2. Google Ads Daily Spend
        try {
            $integration = \App\Models\Integration::where('business_id', $businessId)
                ->where('meta_service', 'google-ads')
                ->where('status', true)
                ->first();

            if ($integration && $integration->meta_access_token) {
                $refreshToken = $integration->meta_app_token ?? $integration->meta_access_token;
                $developerToken = env('GOOGLE_ADS_DEVELOPER_TOKEN') ?: Setting::get('google-ads-developer-token');
                $customerId = $integration->meta_business_id;

                if ($developerToken && $customerId) {
                    $client = new \Google\Client();
                    $client->setAuthConfig(storage_path('app/google/credentials.json'));
                    $token = $client->fetchAccessTokenWithRefreshToken($refreshToken);
                    $accessToken = $token['access_token'] ?? null;

                    if ($accessToken) {
                        $googleAdsController = new GoogleAdsController();
                        $gaql = "SELECT segments.date, metrics.cost_micros FROM campaign WHERE segments.date BETWEEN '{$startDateStr}' AND '{$endDateStr}'";
                        $results = $googleAdsController->queryGoogleAds($customerId, $accessToken, $developerToken, $gaql);
                        
                        foreach ($results as $row) {
                            $day = $row['segments']['date'] ?? null;
                            $costMicros = (float)($row['metrics']['costMicros'] ?? 0);
                            $spend = $costMicros / 1000000;
                            // Conversión a PEN (Google Ads se almacena en USD)
                            $spend *= $exchangeRateCalc;

                            if ($day) {
                                $dailySpends[$day] = ($dailySpends[$day] ?? 0) + $spend;
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Error fetching daily Google Ads spend: " . $e->getMessage());
        }

        // 3. TikTok Daily Spend
        try {
            $integration = \App\Models\Integration::where('business_id', $businessId)
                ->where('meta_service', 'tiktok')
                ->where('status', true)
                ->first();

            if ($integration && $integration->meta_access_token) {
                $accessToken = $integration->meta_access_token;
                $advertiserId = $integration->meta_ad_account_id ?? $integration->meta_business_id;

                if ($advertiserId) {
                    $url = "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id={$advertiserId}&report_type=BASIC&data_level=AUCTION_CAMPAIGN&dimensions=" . urlencode(json_encode(["stat_time_day"])) . "&metrics=" . urlencode(json_encode(["spend"])) . "&start_date={$startDateStr}&end_date={$endDateStr}&page_size=100";
                    $res = new \SoDe\Extend\Fetch($url, [
                        'method' => 'GET',
                        'headers' => [
                            'Access-Token' => $accessToken,
                            'Content-Type' => 'application/json'
                        ]
                    ]);
                    $body = $res->json();
                    $list = $body['data']['list'] ?? [];
                    
                    foreach ($list as $item) {
                        $metrics = $item['metrics'] ?? [];
                        $dayRaw = $item['dimensions']['stat_time_day'] ?? null;
                        if ($dayRaw) {
                            $day = substr($dayRaw, 0, 10);
                            $spend = (float)($metrics['spend'] ?? 0);
                            $spend *= $exchangeRateCalc;
                            $dailySpends[$day] = ($dailySpends[$day] ?? 0) + $spend;
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Error fetching daily TikTok spend: " . $e->getMessage());
        }

        return $dailySpends;
    }
}
