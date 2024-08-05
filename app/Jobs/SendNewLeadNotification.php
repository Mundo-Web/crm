<?php

namespace App\Jobs;

use App\Http\Classes\EmailConfig;
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
    $this->send2client();
    $this->send2owner();
  }

  public function send2owner()
  {
    $client = $this->client;
    $business = $this->business;

    try {
      $html = Text::replaceData(
        Setting::get(
          'email-new-lead-notification-message',
          $business->id
        ),
        $client->toArray()
      );
      $to = Setting::get(
        'email-new-lead-notification-message-owneremail',
        $business->id
      );
      $mail = EmailConfig::config($business->name);
      $mail->addAddress($to);
      $mail->Body = $html;
      $mail->isHTML(true);
      $mail->send();
    } catch (\Throwable $th) {
      dump("EmailError: " . $th->getMessage());
    }

    try {
      $to = Text::keep(Setting::get('whatsapp-new-lead-notification-waid', $business->id), '0123456789@gc.us');

      $content = Text::replaceData(
        Setting::get(
          'whatsapp-new-lead-notification-message',
          $business->id
        ),
        $client->toArray()
      );

      new Fetch(env('WA_URL') . '/api/send', [
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
      dump("WhatsAppError: " . $th->getMessage());
    }
  }

  public function send2client()
  {
    $client = $this->client;
    $business = $this->business;

    $html = Text::replaceData(
      Setting::get('email-new-lead-notification-message-client', $business->id),
      $client->toArray()
    );

    try {
      $mail = EmailConfig::config($client->name);
      $mail->addAddress($client->contact_email);
      $mail->Body = $html;
      $mail->isHTML(true);
      $mail->send();
    } catch (\Throwable $th) {
      dump("EmailError: " . $th->getMessage());
    }

    try {
      new Fetch(env('WA_URL') . '/api/send', [
        'method' => 'POST',
        'headers' => [
          'Accept' => 'application/json',
          'Content-Type' => 'application/json'
        ],
        'body' => [
          'from' => 'atalaya-' . $business->uuid,
          'to' => [$client->country_prefix . $client->contact_phone],
          'html' => $html
        ]
      ]);

      sleep(5);

      $message = SettingController::get('whatsapp-new-lead-notification-message-client');

      $message = Text::replaceData($message, $client->toArray());

      new Fetch(env('WA_URL') . '/api/send', [
        'method' => 'POST',
        'headers' => [
          'Accept' => 'application/json',
          'Content-Type' => 'application/json'
        ],
        'body' => [
          'from' => 'atalaya-' . $business->uuid,
          'to' => [$client->country_prefix . $client->contact_phone],
          'content' => UtilController::html2wa($message)
        ]
      ]);
    } catch (\Throwable $th) {
      dump("WhatsAppError: " . $th->getMessage());
    }
  }
}
