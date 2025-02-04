<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MetaController extends Controller
{
    public function verify(Request $request) {
        $challenge = $request->query('hub_challenge');
        dump($request->all());
        return \response($challenge, 200);
    }
}
