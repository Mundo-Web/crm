<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Notification;
use App\Models\User;

class SaveNotification implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private array $notification;
  private ?string $notify_to;

  public function __construct(array $notification, ?string $notify_to = null)
  {
    $this->notification = $notification;
    $this->notify_to = $notify_to;
  }

  public function handle()
  {
    try {
      if ($this->notify_to) {
        $userJpa = User::select('id')
          ->where('relative_id', $this->notify_to)
          ->where('business_id', $this->notification['business_id'])
          ->first();
          if ($userJpa->id == $this->notification['created_by']) return;
        $this->notification['notify_to'] = $userJpa->id;
      }
      Notification::create($this->notification);
    } catch (\Throwable $th) {
      // dump($th->getMessage());
    }
  }
}
