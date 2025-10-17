<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class ChatController extends BasicController
{
    public $model = Message::class;
    public $reactView = 'Chat';

    public function setReactViewProperties(Request $request)
    {
        $usersJpa = User::byBusiness();
        return [
            'users' => $usersJpa
        ];
    }
}
