<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\FlowController;
use App\Models\Client;
use App\Models\Flow;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FlowTimeout extends Command
{
    protected $signature = 'flow:timeout {flowId} {clientId} {nodeId} {timeoutTargetId} {origin?}';

    protected $description = 'Procesa la expiración de un temporizador de flujo';

    public function handle()
    {
        $flowId = $this->argument('flowId');
        $clientId = $this->argument('clientId');
        $nodeId = $this->argument('nodeId');
        $timeoutTargetId = $this->argument('timeoutTargetId');
        $origin = $this->argument('origin');

        try {
            $cacheKey = "flow_state_{$clientId}";
            $state = Cache::get($cacheKey);

            if (!$state || ($state['node_id'] ?? '') !== $nodeId) {
                Log::info("FlowTimeoutCommand omitido: El lead {$clientId} ya respondió o avanzó de nodo.");
                return 0;
            }

            Cache::forget($cacheKey);

            $flow = Flow::find($flowId);
            $client = Client::find($clientId);

            if ($flow && $client) {
                Log::info("FlowTimeoutCommand: Temporizador expirado para el lead {$client->contact_name} ({$client->id}). Reanudando por la rama 'Expiró' (nodo {$timeoutTargetId}).");
                FlowController::executeGraphForClient($flow, $client, $timeoutTargetId, $origin);
            }
        } catch (\Throwable $th) {
            Log::error('FlowTimeoutCommand failed', [
                'flow_id' => $flowId,
                'client_id' => $clientId,
                'error' => $th->getMessage(),
            ]);
        }

        return 0;
    }
}
