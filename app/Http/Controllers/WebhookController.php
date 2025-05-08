<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WebhookController extends BasicController
{
    public $reactView = 'Webhooks';

    public function setReactViewProperties(Request $request)
    {
        $integrations = Integration::where('business_id', Auth::user()->business_id)->get();
        return [
            'apikey' => Auth::user()->business_uuid,
            'auth_token' => hash('sha256', Auth::user()->business_uuid),
            'integrations' => $integrations
        ];
    }
}
