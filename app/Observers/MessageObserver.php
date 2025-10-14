<?php

namespace App\Observers;

use App\Http\Controllers\EventController;
use App\Models\Message;

class MessageObserver
{
    public function created(Message $message)
    {
        EventController::notify('message.created', $message->toArray());
    }
    public function updated(Message $message)
    {
        EventController::notify('message.updated', $message->toArray());
    }
}
