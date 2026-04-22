<?php

namespace App\Http\Controllers;

use App\Models\AdSet;
use Illuminate\Http\Request;

class AdSetController extends BasicController
{
    public $model = AdSet::class;

    public function setPaginationInstance(Request $request, string $model)
    {
        \Illuminate\Support\Facades\Log::info('Paginando Ad Sets', [
            'campaign_id' => $request->campaign_id,
            'business_id' => \Illuminate\Support\Facades\Auth::user()->business_id
        ]);
        return AdSet::where('campaign_id', $request->campaign_id)
            ->where('business_id', \Illuminate\Support\Facades\Auth::user()->business_id);
    }
}
