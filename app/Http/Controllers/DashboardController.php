<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class DashboardController
{
  public function revenue(Request $request, $range)
  {
    $response = new Response();
    try {

      $data = [];

      switch ($range) {
        case 'daily': // Diario
          $data = Payment::select([
            DB::raw('IFNULL(DATE(payments.date), DATE(payments.created_at)) as date'),
            DB::raw('SUM(payments.amount) as total')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->groupBy(DB::raw('IFNULL(DATE(payments.date), DATE(payments.created_at))'))
            ->orderBy(DB::raw('IFNULL(DATE(payments.date), DATE(payments.created_at))'), 'desc')
            ->limit(30) // Máximo de 30 registros
            ->get();
          break;
        case 'weekly': // Semanal
          $data = Payment::select([
            DB::raw('IFNULL(YEARWEEK(payments.date), YEARWEEK(payments.created_at)) as week'),
            DB::raw('SUM(payments.amount) as total')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->groupBy(DB::raw('IFNULL(YEARWEEK(payments.date), YEARWEEK(payments.created_at))'))
            ->orderBy(DB::raw('IFNULL(YEARWEEK(payments.date), YEARWEEK(payments.created_at))'), 'desc')
            ->limit(16) // Máximo de 16 registros
            ->get();
          break;
        case 'monthly': // Mensual
          $data = Payment::select([
            DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at)) as year'),
            DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at)) as month'),
            DB::raw('SUM(payments.amount) as total')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->groupBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at))'))
            ->orderBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), 'desc')
            ->orderBy(DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at))'), 'desc')
            ->limit(12) // Máximo de 12 registros
            ->get();
          break;
        case 'annually': // Anual
          $data = Payment::select([
            DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at)) as year'),
            DB::raw('SUM(payments.amount) as total')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->groupBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'))
            ->orderBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), 'desc')
            ->limit(6) // Máximo de 6 registros
            ->get();
          break;
        case 'last-revenues': // Últimos ingresos (dos últimos meses incluyendo el actual)
          // Obtener los dos últimos meses con registros, asegurando incluir el mes actual
          $lastTwoMonths = Payment::select([
            DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at)) as year'),
            DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at)) as month')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->groupBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at))'))
            ->orderBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), 'desc')
            ->orderBy(DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at))'), 'desc')
            ->limit(2)
            ->get();

          $data = Payment::select([
            DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at)) as month'),
            DB::raw('SUM(payments.amount) as total')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->where(function ($query) use ($lastTwoMonths) {
              foreach ($lastTwoMonths as $month) {
                $query->orWhere(function ($query) use ($month) {
                  $query->whereYear(DB::raw('IFNULL(payments.date, payments.created_at)'), $month->year)
                    ->whereMonth(DB::raw('IFNULL(payments.date, payments.created_at)'), $month->month);
                });
              }
            })
            ->groupBy('month')
            ->limit(2)
            ->get();
          break;
        default: // Mensual
          $data = Payment::select([
            DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at)) as year'),
            DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at)) as month'),
            DB::raw('SUM(payments.amount) as total')
          ])
            ->leftJoin('projects', 'projects.id', 'payments.project_id')
            ->where('projects.business_id', Auth::user()->business_id)
            ->groupBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at))'))
            ->orderBy(DB::raw('IFNULL(YEAR(payments.date), YEAR(payments.created_at))'), 'desc')
            ->orderBy(DB::raw('IFNULL(MONTH(payments.date), MONTH(payments.created_at))'), 'desc')
            ->limit(12) // Máximo de 12 registros
            ->get();
          break;
      }

      $response->status = 200;
      $response->message = 'Operación correcta';
      $response->data = $data;
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }
}
