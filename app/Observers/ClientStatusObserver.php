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
    }

    public function updated(Client $client)
    {
        if ($client->isDirty('status_id')) {
            $statusJpa = Status::find($client->status_id);
            $comment = 'Se actualizo el estado de gestion a ' . $statusJpa->name;
            if (Auth::check()) {
                $comment = Auth::user()->name . ' actualizo el estado de gestion a ' . $statusJpa->name;
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
            $comment = 'Se actualizo el estado a ' . $manageStatusJpa->name;
            if (Auth::check()) {
                $comment = Auth::user()->name . ' actualizo el estado a ' . $manageStatusJpa->name;
            }
            ClientStatusTrace::create([
                'client_id' => $client->id,
                'status_id' => $client->manage_status_id,
                'user_id' => Auth::user()->id ?? null,
                'comment' => $comment
            ]);
        }
    }
}
