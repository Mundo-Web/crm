<?php

namespace App\Jobs;

use App\Http\Controllers\MetaController;
use App\Models\Client;
use App\Models\Message;
use Closure;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use SoDe\Extend\JSON;

class MetaAssistantJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private $clientJpa;
  private $messageJpa;

  public function __construct(Client $clientJpa, Message $messageJpa)
  {
    $this->clientJpa = $clientJpa;
    $this->messageJpa = $messageJpa;
  }

  public function handle()
  {
    try {
      MetaController::assistant($this->clientJpa, $this->messageJpa);
    } catch (\Throwable $th) {
    }
  }
}
