<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MetaController extends Controller
{
    public function verify(Request $request)
    {
        $challenge = $request->query('hub_challenge');
        return \response($challenge, 200);
    }

    public function webhook(Request $request, string $business_id)
    {
        dump($business_id);
        dump($request->all());
        return \response('OK', 200);
    }
}
