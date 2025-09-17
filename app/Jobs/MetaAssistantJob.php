<?php

namespace App\Jobs;

use App\Http\Controllers\MetaController;
use App\Models\Client;
use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class MetaAssistantJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private Client $clientJpa;
  private Message $messageJpa;
  private ?string $origin;

  public function __construct(Client $clientJpa, Message $messageJpa, ?string $origin = null)
  {
    $this->clientJpa = $clientJpa;
    $this->messageJpa = $messageJpa;
    $this->origin = $origin;
  }

  public function handle()
  {
    try {
      MetaController::assistant($this->clientJpa, $this->messageJpa, $this->origin);
    } catch (\Throwable $th) {
    }
  }
}
