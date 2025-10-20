<?php

namespace App\Observers;

use App\Http\Controllers\EventController;
use App\Models\Client;
use App\Models\Message;

class MessageObserver
{
    public function creating(Message $message)
    {
        if ($message->role != 'Human') {
            $message->seen = true;
        }
    }
    public function created(Message $message)
    {
        EventController::notify('message.created', $message->toArray(), ['business_id' => $message->business_id]);

        if ($message->seen) {
            Message::query()
                ->where('business_id', $message->business_id)
                ->where('wa_id', $message->wa_id)
                ->where('seen', false)
                ->update(['seen' => true]);
        }
        try {
            $clientJpa = Client::select('id', 'contact_name', 'contact_phone', 'last_message', 'last_message_microtime')
                ->where('business_id', $message->business_id)
                ->where('contact_phone', $message->wa_id)
                ->orderBy('updated_at', 'DESC')
                ->first();

            if ($clientJpa) {
                $clientJpa->last_message = $message->message;
                $clientJpa->last_message_microtime = $message->microtime;
                $clientJpa->save();
                $clientJpa->loadCount(['unSeenMessages']);
                EventController::notify('client.updated', $clientJpa->toArray(), ['business_id' => $message->business_id]);
            }
        } catch (\Exception $e) {
            // Silently skip if client does not exist or any other error occurs
        }
    }
    public function updated(Message $message)
    {
        EventController::notify('message.updated', $message->toArray(), ['business_id' => $message->business_id]);

        try {
            $clientJpa = Client::select('id', 'contact_name', 'contact_phone', 'last_message', 'last_message_microtime')
                ->where('business_id', $message->business_id)
                ->where('contact_phone', $message->wa_id)
                ->orderBy('updated_at', 'DESC')
                ->first();

            if ($clientJpa) {
                $clientJpa->last_message = $message->message;
                $clientJpa->last_message_microtime = $message->microtime;
                $clientJpa->save();
                $clientJpa->loadCount(['unSeenMessages']);
                EventController::notify('client.updated', $clientJpa->toArray(), ['business_id' => $message->business_id]);
            }
        } catch (\Exception $e) {
            // Silently skip if client does not exist or any other error occurs
        }
    }
}
