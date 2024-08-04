<?php

namespace App\Http\Controllers;
use App\Models\ProjectView;
use App\Models\RemainingHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;
use SoDe\Extend\Trace;

class RemainingHistoryController extends Controller
{
    public function set()
    {
        try {
            $amount = ProjectView::select([
                DB::raw('SUM(remaining_amount) as remaining_amount'),
                DB::raw('SUM(cost) as total_amount')
            ])
            ->whereNotNull('status')
            ->where('remaining_amount', '>', 0)
            ->first();

            $month = Trace::format('m-Y');

            RemainingHistory::updateOrCreate([
                'month' => $month,
            ], [
                'remaining_amount' => $amount->remaining_amount,
                'total_amount' => $amount->total_amount
            ]);
            return response('success', 200);
        } catch (\Throwable $th) {
            return response($th->getMessage(), 400);
        }
    }

    public function get(Request $request, $month) {
        $response = new Response();
        try {
            $remaining = RemainingHistory::where('month', $month)->first();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $remaining;
            return response()->json($remaining, 200);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response()->json($response, $response->status);
        }
    }
}
