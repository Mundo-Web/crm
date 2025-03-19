<?php

namespace App\Http\Controllers;

use App\Models\DefaultMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DefaultMessageController extends BasicController
{
    public $model = DefaultMessage::class;
    public $reactView = 'DefaultMessages';

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $body['user_id'] = Auth::id();
        return $body;
    }
}
