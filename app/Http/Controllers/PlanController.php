<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Plan;
use Illuminate\Http\Request;

class PlanController extends BasicController
{
    public $model = Plan::class;
    public $reactView = 'Plans';
    public $reactRootView = 'public';

    public function setReactViewProperties(Request $request)
    {
        $plans = Plan::select('plans.*')
            ->join('services AS service', 'plans.service_id', 'service.id')
            ->where('service.correlative', env('APP_CORRELATIVE'))
            ->get();

        return [
            'plans' => $plans
        ];
    }
}
