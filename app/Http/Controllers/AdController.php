<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use Illuminate\Http\Request;

class AdController extends BasicController
{
    public $model = Ad::class;

    public function setPaginationInstance(Request $request, string $model)
    {
        \Illuminate\Support\Facades\Log::info('Paginando Ads', [
            'ad_set_id' => $request->ad_set_id,
            'business_id' => \Illuminate\Support\Facades\Auth::user()->business_id
        ]);
        return Ad::where('ad_set_id', $request->ad_set_id)
            ->where('business_id', \Illuminate\Support\Facades\Auth::user()->business_id);
    }
}
