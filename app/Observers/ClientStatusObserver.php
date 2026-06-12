<?php

namespace App\Observers;

use App\Models\Client;
use App\Models\ClientStatusTrace;
use App\Models\Status;
use Illuminate\Support\Facades\Auth;

class ClientStatusObserver
{
    public function created(Client $client)
    {
        ClientStatusTrace::create([
            'client_id' => $client->id,
            'status_id' => $client->status_id,
            'user_id' => Auth::id(),
            'comment' => 'Client created'
        ]);
        ClientStatusTrace::create([
            'client_id' => $client->id,
            'status_id' => $client->manage_status_id,
            'user_id' => Auth::id(),
            'comment' => 'Client created'
        ]);
        if ($client->chat_status_id) {
            ClientStatusTrace::create([
                'client_id' => $client->id,
                'status_id' => $client->chat_status_id,
                'user_id' => Auth::id(),
                'comment' => 'Client created'
            ]);
        }

        // Notify in real-time about the new lead
        try {
            $clientJpa = Client::select('clients.*')
                ->addSelect([
                    'last_human_message_microtime' => \App\Models\Message::select('microtime')
                        ->where(function ($q) {
                            $q->whereColumn('messages.wa_id', 'clients.contact_phone')
                              ->orWhereColumn('messages.wa_id', 'clients.integration_user_id');
                        })
                        ->where('messages.role', 'Human')
                        ->whereColumn('messages.business_id', 'clients.business_id')
                        ->orderBy('microtime', 'desc')
                        ->limit(1)
                ])
                ->with(['assigned', 'status', 'manageStatus', 'chatStatus', 'integration'])
                ->withCount(['unSeenMessages'])
                ->find($client->id);
            if ($clientJpa) {
                $clientJpa->notify = true;
                \App\Http\Controllers\EventController::notify('client.updated', $clientJpa->toArray(), ['business_id' => $client->business_id]);
                \App\Http\Controllers\EventController::notify('client.updated.menu', $clientJpa->toArray(), ['business_id' => $client->business_id]);
            }
        } catch (\Throwable $th) {
            \Illuminate\Support\Facades\Log::error('Error notifying client creation: ' . $th->getMessage());
        }
    }

    public function updated(Client $client)
    {
        if ($client->isDirty('status_id')) {
            $statusJpa = Status::find($client->status_id);
            $comment = 'Se actualizo el estado de gestion a ' . ($statusJpa ? $statusJpa->name : 'Sin estado');
            if (Auth::check()) {
                $comment = Auth::user()->name . ' actualizo el estado de gestion a ' . ($statusJpa ? $statusJpa->name : 'Sin estado');
            }
            ClientStatusTrace::create([
                'client_id' => $client->id,
                'status_id' => $client->status_id,
                'user_id' => Auth::user()->id ?? null,
                'comment' => $comment
            ]);
        }
        if ($client->isDirty('manage_status_id')) {
            $manageStatusJpa = Status::find($client->manage_status_id);
            $comment = 'Se actualizo el estado a ' . ($manageStatusJpa ? $manageStatusJpa->name : 'Sin estado');
            if (Auth::check()) {
                $comment = Auth::user()->name . ' actualizo el estado a ' . ($manageStatusJpa ? $manageStatusJpa->name : 'Sin estado');
            }
            ClientStatusTrace::create([
                'client_id' => $client->id,
                'status_id' => $client->manage_status_id,
                'user_id' => Auth::user()->id ?? null,
                'comment' => $comment
            ]);
        }
        if ($client->isDirty('chat_status_id') && $client->chat_status_id) {
            $chatStatusJpa = Status::find($client->chat_status_id);
            $comment = 'Se actualizo el estado de chat a ' . ($chatStatusJpa ? $chatStatusJpa->name : 'Sin calificación');
            if (Auth::check()) {
                $comment = Auth::user()->name . ' actualizo el estado de chat a ' . ($chatStatusJpa ? $chatStatusJpa->name : 'Sin calificación');
            }
            ClientStatusTrace::create([
                'client_id' => $client->id,
                'status_id' => $client->chat_status_id,
                'user_id' => Auth::user()->id ?? null,
                'comment' => $comment
            ]);
        }

        // Notify client.updated in real-time when critical fields change
        $criticalFields = ['assigned_to', 'status_id', 'manage_status_id', 'chat_status_id', 'contact_name', 'contact_phone', 'contact_email', 'last_message', 'last_message_microtime'];
        $isCriticalDirty = false;
        foreach ($criticalFields as $field) {
            if ($client->isDirty($field)) {
                $isCriticalDirty = true;
                break;
            }
        }

        if ($isCriticalDirty) {
            try {
                $clientJpa = Client::select('clients.*')
                    ->addSelect([
                        'last_human_message_microtime' => \App\Models\Message::select('microtime')
                            ->where(function ($q) {
                                $q->whereColumn('messages.wa_id', 'clients.contact_phone')
                                  ->orWhereColumn('messages.wa_id', 'clients.integration_user_id');
                            })
                            ->where('messages.role', 'Human')
                            ->whereColumn('messages.business_id', 'clients.business_id')
                            ->orderBy('microtime', 'desc')
                            ->limit(1)
                    ])
                    ->with(['assigned', 'status', 'manageStatus', 'chatStatus', 'integration'])
                    ->withCount(['unSeenMessages'])
                    ->find($client->id);
                if ($clientJpa) {
                    \App\Http\Controllers\EventController::notify('client.updated', $clientJpa->toArray(), ['business_id' => $client->business_id]);
                    \App\Http\Controllers\EventController::notify('client.updated.menu', $clientJpa->toArray(), ['business_id' => $client->business_id]);
                }
            } catch (\Throwable $th) {
                \Illuminate\Support\Facades\Log::error('Error notifying client update: ' . $th->getMessage());
            }
        }
    }
}
