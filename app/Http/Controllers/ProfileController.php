<?php

namespace App\Http\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Response as HttpResponse;

class ProfileController extends Controller
{
  public function thumbnail(Request $request, $uuid)
  {
    try {
      $content = Storage::get('profile/thumbnail/' . $uuid . '.img');
      if (!$content) throw new Exception('Perfil no encontrado');
      return response($content, 200, [
        'Content-Type' => 'application/octet-stream'
      ]);
    } catch (\Throwable $th) {
      $content = Storage::get('utils/user-404.svg');
      return response($content, 200, [
        'Content-Type' => 'image/svg+xml'
      ]);
    }
  }

  public function full(Request $request, $uuid)
  {
    try {
      $content = Storage::get('profile/' . $uuid . '.img');
      if (!$content) throw new Exception('Perfil no encontrado');
      return response($content, 200, [
        'Content-Type' => 'application/octet-stream'
      ]);
    } catch (\Throwable $th) {
      $content = Storage::get('utils/user-404.svg');
      return response($content, 200, [
        'Content-Type' => 'image/svg+xml'
      ]);
    }
  }

  public function saveProfile(Request $request)
  {
    $response = new Response();
    try {
      $userId = Auth::user()->id;
      $userJpa = User::find($userId);
      if (!$userJpa->relative_id) {
        $userJpa->relative_id = Crypto::randomUUID();
        $userJpa->save();
      }

      $thumbnail = $request->file('thumbnail');
      $full = $request->file('full');

      $thumbnailPath = 'profile/thumbnail/' . $userJpa->relative_id . '.img';
      $fullPath = 'profile/' . $userJpa->relative_id . '.img';

      Storage::put($thumbnailPath, file_get_contents($thumbnail));
      Storage::put($fullPath, file_get_contents($full));

      $response->status = 200;
      $response->message = 'Operacion correcta';
      $response->data = [
        'relative_id' => $userJpa->relative_id
      ];
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function save(Request $request): HttpResponse|ResponseFactory
  {
    $response = new Response();
    try {

      $body = $request->all();

      $jpa = User::find(Auth::user()->id);
      $jpa->update($body);

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }
}
