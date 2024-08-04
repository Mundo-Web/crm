<?php

namespace App\Jobs;

use App\Http\Controllers\SettingController;
use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use SoDe\Extend\Fetch;
use SoDe\Extend\Text;
use App\Http\Controllers\UtilController;
use App\Models\Atalaya\Business;
use App\Models\Setting;

class SendNewLeadNotification implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  private Client $client;
  private Business $business;

  public function __construct(Client $client, Business $business)
  {
    $this->client = $client;
    $this->business = $business;
  }

  public function handle()
  {
    $client = $this->client;
    try {
      $to = Text::keep(Setting::get('whatsapp-new-lead-notification-waid', $this->business->id), '0123456789@gc.us');

      $content = UtilController::replaceData(
        Setting::get('whatsapp-new-lead-notification-message', $this->business->id),
        $client->toArray()
      );

      new Fetch('https://wajs.factusode.xyz/api/send', [
        'method' => 'POST',
        'headers' => [
          'Content-Type' => 'application/json'
        ],
        'body' => [
          'from' => 'atalaya-' . $this->business->uuid,
          'to' => [$to],
          'content' => UtilController::html2wa($content)
        ]
      ]);
    } catch (\Throwable $th) {
      // dump($th->getMessage());
    }
  }
}
