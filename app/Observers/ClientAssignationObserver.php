<?php

namespace App\Observers;

use App\Models\Client;
use Carbon\Carbon;
use SoDe\Extend\Trace;

class ClientAssignationObserver
{
    public function updated(Client $client)
    {
        if ($client->isDirty('assigned_to')) {
            Client::where('id', $client->id)
                ->update([
                    'assignation_date' => $client->assigned_to
                        ? Trace::getDate('mysql')
                        : null
                ]);
        }
    }
}
