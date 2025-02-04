<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MetaController extends Controller
{
    public function verify(Request $request) {
        dump($request);
        return \response('OK', 200);
    }
}
