<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use Illuminate\Http\Request;

class CampaignController extends BasicController
{
    public $model = Campaign::class;
    public $reactView = 'Campaigns';

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::whereNotNull('status');
    }
}
