<?php

namespace App\Jobs;

use Closure;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use SoDe\Extend\JSON;

class ExecuteAnyJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private $callable;
  private object|array|string|int|float|bool|null $params = null;

  public function __construct(callable $callable, object|array|string|int|float|bool|null $params = null)
  {
    $this->callable = $callable;
    $this->params = $params;
  }

  public function handle()
  {
    try {
      call_user_func($this->callable, $this->params ?? null);
    } catch (\Throwable $th) {
    }
  }
}
