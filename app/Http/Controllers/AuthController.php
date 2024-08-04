<?php
namespace App\Http\Controllers;

use App\Providers\RouteServiceProvider;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class AuthController extends Controller
{

  /**
   * Handle an incoming authentication request.
   */
  public function login(Request $request): HttpResponse | ResponseFactory | RedirectResponse
  {
    $response = new Response();
    try {
      $email = $request->email;
      $password = $request->password;

      if (!Auth::attempt([
        'email' => Controller::decode($email),
        'password' => Controller::decode($password)
      ])) {
        throw new Exception('Credenciales invalidas');
      }

      $request->session()->regenerate();

      $response->status = 200;
      $response->message = 'Autenticacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }


    $request->session()->regenerate();

    return redirect()->intended(RouteServiceProvider::HOME);
  }

  /**
   * Destroy an authenticated session.
   */
  public function destroy(Request $request)
  {
    $response = new Response();
    try {
      Auth::guard('web')->logout();

      $request->session()->invalidate();
      $request->session()->regenerateToken();

      $response->status = 200;
      $response->message = 'Cierre de sesion exitoso';
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
