<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApikeyController extends BasicController
{
    public $reactView = 'Apikeys';

    public function setReactViewProperties(Request $request)
    {
        return [
            'apikey' => Auth::user()->business_uuid
        ];
    }
}
