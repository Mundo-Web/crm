<?php

namespace App\Http\Controllers;

use App\Models\DefaultMessage;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends BasicController
{
    public $model = Message::class;
    public $reactView = 'Chat';

    public function setReactViewProperties(Request $request)
    {
        $usersJpa = User::byBusiness();
        $defaultMessagesJpa = DefaultMessage::with(['attachments'])
            ->where('business_id', Auth::user()->business_id)
            ->where('type', 'whatsapp')
            ->get();
        return [
            'activeLeadId' => $request->lead,
            'users' => $usersJpa,
            'defaultMessages' => $defaultMessagesJpa
        ];
    }
}
