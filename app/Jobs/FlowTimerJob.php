<?php

namespace App\Jobs;

use App\Http\Controllers\FlowController;
use App\Models\Client;
use App\Models\Flow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FlowTimerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private string $flowId;
    private string $clientId;
    private string $nodeId;
    private ?string $timeoutTargetId;
    private ?string $origin;

    public function __construct(string $flowId, string $clientId, string $nodeId, ?string $timeoutTargetId = null, ?string $origin = null)
    {
        $this->flowId = $flowId;
        $this->clientId = $clientId;
        $this->nodeId = $nodeId;
        $this->timeoutTargetId = $timeoutTargetId;
        $this->origin = $origin;
    }

    public function handle()
    {
        try {
            $cacheKey = "flow_state_{$this->clientId}";
            $state = Cache::get($cacheKey);

            if (!$state || ($state['node_id'] ?? '') !== $this->nodeId) {
                // El cliente ya respondió o el flujo cambió de nodo antes de expirar
                Log::info("FlowTimerJob omitido: El lead {$this->clientId} ya respondió o avanzó de nodo.");
                return;
            }

            // Limpiar el estado de espera
            Cache::forget($cacheKey);

            if (!$this->timeoutTargetId) {
                Log::info("FlowTimerJob: El nodo de temporizador {$this->nodeId} expiró pero no tenía salida 'Expiró' conectada.");
                return;
            }

            $flow = Flow::find($this->flowId);
            $client = Client::find($this->clientId);

            if ($flow && $client) {
                Log::info("FlowTimerJob: Temporizador expirado para el lead {$client->contact_name} ({$client->id}). Reanudando por la rama 'Expiró' (nodo {$this->timeoutTargetId}).");
                FlowController::executeGraphForClient($flow, $client, $this->timeoutTargetId, $this->origin);
            }
        } catch (\Throwable $th) {
            Log::error('FlowTimerJob failed', [
                'flow_id' => $this->flowId,
                'client_id' => $this->clientId,
                'error' => $th->getMessage(),
            ]);
        }
    }
}
