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

        // tengo mi tabla clients, donde tiene dos campos triggered_by y origin, me interesa 3, dos principales que son (Origin: CRM Atalaya, triggered_by: Formulario) y el otro es (Origin: WhatsApp, triggered_by: Gemini AI), quiero que me agrupes y contabilices cuantos tienen ese, y cuantos tienen cualquier otro valor
        $leadSources = Client::select([
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
            ->whereYear('created_at', $currentYear)
            ->whereMonth('created_at', $currentMonth)
            ->first();

        $originCounts = Client::select([
            'origin',
            DB::raw('COUNT(*) as count')
        ])
            ->where('business_id', Auth::user()->business_id)
            ->whereYear('created_at', $currentYear)
            ->whereMonth('created_at', $currentMonth)
            ->whereNotIn('origin', ['WhatsApp', 'CRM Atalaya'])
            ->groupBy('origin')
            ->orderBy('count', 'desc')
            ->get();

        return [
            'months' => $months,
            'currentMonth' => $currentMonth,
            'currentYear' => $currentYear,
            'leadSources' => $leadSources,
            'originCounts' => $originCounts,
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
            ];
            $response->data = $groupedByManageStatus;
        });
        return \response($response->toArray(), $response->status);
    }
}
