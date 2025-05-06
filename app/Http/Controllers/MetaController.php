<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MetaController extends Controller
{
    public function verify(Request $request)
    {
        dump($request->all());
        $challenge = $request->query('hub_challenge');
        return \response($challenge, 200);
    }

    public function webhook(Request $request, string $business_id)
    {
        dump($request->all());
        // $data = $request->all();
        // $entry = $data['entry'] ?? [];
        // switch ($data['object']) {
        //     case 'instagram':
        //         if ($entry['id'] != $entry['messaging']['sender']['id']) {
        //             dump($entry['messaging']['message']['text']);
        //         }
        //         break;
            
        //     default:
        //         # code...
        //         break;
        // }
        return \response('OK', 200);
    }
}
