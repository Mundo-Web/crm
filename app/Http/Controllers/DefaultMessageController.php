<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\DefaultMessage;
use App\Models\DefaultMessageHasAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DefaultMessageController extends BasicController
{
    public $model = DefaultMessage::class;
    public $reactView = 'DefaultMessages';
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        return [
            'clientFields' => Client::getFields()
        ];
    }

    function setPaginationInstance(Request $request, string $model)
    {
        return $model::with(['attachments'])
            ->where('user_id', Auth::id());
    }
    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $body['user_id'] = Auth::id();
        return $body;
    }
    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $attachments = $request->attachments ?? [];
        DefaultMessageHasAttachment::where('default_message_id', $jpa->id)->delete();
        foreach ($attachments as $attachment) {
            DefaultMessageHasAttachment::create([
                'default_message_id' => $jpa->id,
                'attachment_id' => $attachment['id']
            ]);
        }
    }
}
