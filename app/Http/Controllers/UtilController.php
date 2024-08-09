<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Setting;
use App\Models\Status;
use App\Models\Type;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Facades\Excel;
use SoDe\Extend\File;
use SoDe\Extend\Response;
use SoDe\Extend\Text;

class UtilController
{
  use Importable;

  static function html2wa(String $string = '')
  {

    $string = str_replace('{{session.sign}}', '', $string);

    $string = preg_replace_callback('/<p>(.*?)<\/p>/', function ($matches) {
      return "\n" . trim($matches[1]);
    }, $string);
    $string = preg_replace_callback('/<strong>(.*?)<\/strong>/', function ($matches) {
      return '*' . trim($matches[1]) . '*';
    }, $string);
    $string = preg_replace_callback('/<b>(.*?)<\/b>/', function ($matches) {
      return '*' . trim($matches[1]) . '*';
    }, $string);
    $string = preg_replace_callback('/<i>(.*?)<\/i>/', function ($matches) {
      return '_' . trim($matches[1]) . '_';
    }, $string);
    $string = preg_replace_callback('/<em>(.*?)<\/em>/', function ($matches) {
      return '_' . trim($matches[1]) . '_';
    }, $string);
    $string = preg_replace_callback('/<s>(.*?)<\/s>/', function ($matches) {
      return '~' . trim($matches[1]) . '~';
    }, $string);
    $string = preg_replace_callback('/<code>(.*?)<\/code>/', function ($matches) {
      return '```' . trim($matches[1]) . '```';
    }, $string);
    $string = preg_replace_callback('/<pre>(.*?)<\/pre>/', function ($matches) {
      return '```' . trim($matches[1]) . '```';
    }, $string);
    $string = preg_replace_callback('/<blockquote>(.*?)<\/blockquote>/', function ($matches) {
      return "\n> " . trim($matches[1]);
    }, $string);
    $string = str_replace('<br>', "\n", $string);
    $string = str_replace('</br>', "\n", $string);

    // Removing remaining HTML tags
    $string = preg_replace('/<[^>]*>?/', '', $string);

    return trim($string);
  }

  public function start(Request $request, string $uuid)
  {
    $response = Response::simpleTryCatch(function (Response $response) use ($uuid) {
      $businessJpa = Business::where('uuid', $uuid)->first();
      $rows = Excel::toArray([], '../storage/app/utils/Statuses.xlsx');

      foreach ($rows[0] as $row) {
        if (!is_numeric($row[0])) continue;

        $statusJpa = Status::updateOrCreate([
          'name' => $row[1],
          'business_id' => $businessJpa->id
        ], [
          'name' => $row[1],
          'description' => $row[2],
          'color' => $row[3],
          'table_id' => $row[4],
          'order' => $row[0],
          'business_id' => $businessJpa->id
        ]);

        if (Text::nullOrEmpty($row[5])) continue;

        foreach (explode('|', $row[5]) as $name) {
          Setting::set($name, $statusJpa->id, $businessJpa->id);
        }
      }

      Setting::set('asignation-lead-status[task]', 'En curso', $businessJpa->id);
      Setting::set('revertion-lead-status[task]', 'Pendiente', $businessJpa->id);

      Setting::set('whatsapp-new-lead-notification-message', File::get('../storage/app/utils/whatsapp-new-lead-notification-message.html'), $businessJpa->id);
      Setting::set('whatsapp-new-lead-notification-message-client', File::get('../storage/app/utils/whatsapp-new-lead-notification-message-client.html'), $businessJpa->id);

      Setting::set('email-new-lead-notification-message', File::get('../storage/app/utils/email-new-lead-notification-message.html'), $businessJpa->id);
      Setting::set('email-new-lead-notification-message-client', File::get('../storage/app/utils/email-new-lead-notification-message-client.html'), $businessJpa->id);
      Setting::set('email-new-lead-notification-owneremail', $businessJpa->creator->email, $businessJpa->id);

    });
    return response($response->toArray(), $response->status);
  }

  static function replaceData(string $string, array $object)
  {
    foreach ($object as $key => $value) {
      $string = str_replace('{{' . $key . '}}', $value, $string);
    }
    return $string;
  }
}
