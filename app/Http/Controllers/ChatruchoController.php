<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatruchoController extends BasicController
{
    public $model = Message::class;
    public $reactView = 'Chatrucho';

    public function setReactViewProperties(Request $request)
    {
        $messages = Message::query()
            ->where('business_id', Auth::user()->business_id)
            ->where('wa_id', '51000000000')
            ->get();

        return [
            'messages' => $messages,
            'waDummy' => env('WA_DUMMY')
        ];
    }
}
