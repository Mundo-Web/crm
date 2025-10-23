<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Fetch;
use SoDe\Extend\JSON;

class EventController extends Controller
{
    static function notify($event, $data, $filters = []): bool
    {
        try {
            $res = new Fetch(env('EVENTS_URL') . '/emit', [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json'
                ],
                'body' => [
                    'service' => env('APP_CORRELATIVE'),
                    'environment' => env('APP_ENV'),
                    'filters' => $filters,
                    'eventType' => $event,
                    'data' => $data
                ]
            ]);
            if (!$res->ok) throw new Exception('Ocurrió un error al notificar al cliente: ' . JSON::stringify($res));
            return true;
        } catch (\Throwable $th) {
            Log::error($th->getMessage());
            return false;
        }
    }
}
