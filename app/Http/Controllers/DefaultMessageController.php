<?php

namespace App\Http\Controllers;

use App\Models\DefaultMessage;
use Illuminate\Http\Request;

class DefaultMessageController extends BasicController
{
    public $model = DefaultMessage::class;
    public $reactView = 'DefaultMessages';

    public function beforeSave(Request $request)
    {
        $request->merge(['user_id' => $request->user()->id]);
    }
}
