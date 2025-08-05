<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\ServicesByBusiness;
use App\Models\Atalaya\UsersByServicesByBusiness;
use App\Models\Setting;
use App\Models\Status;
use App\Providers\RouteServiceProvider;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class AuthController extends Controller
{

  public function init(Request $request)
  {
    DB::beginTransaction();
    $response = Response::simpleTryCatch(function () use ($request) {

      $manageStatuses = $request->manageStatuses;
      foreach ($manageStatuses as $key => $status) {
        $statusJpa =  Status::create([
          'name' => $status,
          'table_id' => '9c27e649-574a-47eb-82af-851c5d425434',
          'order' => $key + 1,
          'business_id' => Auth::user()->business_id
        ]);

        if ($status == 'Pendiente') {
          Setting::create([
            'name' => 'default-manage-lead-status',
            'value' => $statusJpa->id,
            'business_id' => Auth::user()->business_id
          ]);
        }
      }

      $statuses = $request->statuses;
      foreach ($statuses as $key => $status) {
        $statusJpa =  Status::create([
          'name' => $status,
          'table_id' => 'e05a43e5-b3a6-46ce-8d1f-381a73498f33',
          'order' => $key + 1,
          'business_id' => Auth::user()->business_id
        ]);

        if ($status == 'Nuevo') {
          Setting::create([
            'name' => 'default-lead-status',
            'value' => $statusJpa->id,
            'business_id' => Auth::user()->business_id
          ]);
        }
      }

      $clientStatusJpa =  Status::create([
        'name' => 'Cliente',
        'table_id' => 'a8367789-666e-4929-aacb-7cbc2fbf74de',
        'order' => count($statuses) + 1,
        'business_id' => Auth::user()->business_id
      ]);

      Setting::create([
        'name' => 'default-client-status',
        'value' => $clientStatusJpa->id,
        'business_id' => Auth::user()->business_id
      ]);

      $serviceJpa = ServicesByBusiness::select('services_by_businesses.*')
        ->join('services', 'services.id', '=', 'services_by_businesses.service_id')
        ->join('businesses', 'businesses.id', '=', 'services_by_businesses.business_id')
        ->where('services.correlative', env('APP_CORRELATIVE'))
        ->where('services_by_businesses.business_id', Auth::user()->business_id)
        ->where('businesses.created_by', Auth::user()->id)
        ->first();
      if (!$serviceJpa) throw new Exception('No tienes acceso a este servicio');
      $serviceJpa->first_time = false;
      $serviceJpa->save();

      DB::commit();
    }, fn() => DB::rollBack());
    return response($response->toArray(), $response->status);
  }

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

  public function activeService(Request $request, string $business)
  {
    $response = Response::simpleTryCatch(function (Response $res) use ($request, $business) {
      $ubsbb = UsersByServicesByBusiness::with(['service'])
        ->select(['users_by_services_by_businesses.*'])
        ->join('services_by_businesses', 'services_by_businesses.id', 'users_by_services_by_businesses.service_by_business_id')
        ->join('services', 'services.id', 'services_by_businesses.service_id')
        ->join('businesses', 'businesses.id', 'services_by_businesses.business_id')
        ->where('user_id', Auth::user()->id)
        ->where('services.correlative', env('APP_CORRELATIVE'))
        ->where('businesses.uuid', $business)
        ->first();
      if (!$ubsbb) throw new Exception('No tienes permisos para este servicio');

      UsersByServicesByBusiness::join('services_by_businesses', 'services_by_businesses.id', 'users_by_services_by_businesses.service_by_business_id')
        ->where('users_by_services_by_businesses.user_id', Auth::user()->id)
        ->where('services_by_businesses.service_id', $ubsbb->service->id)
        ->update([
          'active' => false
        ]);

      $ubsbb->active = true;
      $ubsbb->save();

      $res->message = 'En breve seras redirigido a ' . $ubsbb->service->name;
    });
    return response($response->toArray(), $response->status);
  }

  public function joinView(Request $request)
  {

    $service = ServicesByBusiness::query()
      ->join('services', 'services.id', '=', 'services_by_businesses.service_id')
      ->where('services.correlative', env('APP_CORRELATIVE'))
      ->where('services_by_businesses.business_id', Auth::user()->business_id)
      ->first();

    if (!$service) return redirect(env('APP_PROTOCOL') . '://' . env('APP_DOMAIN'));
    if (!$service->first_time) return redirect('/home');

    return Inertia::render('Join', [
      'global' => [
        'WA_URL' => env('WA_URL'),
        'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
        'APP_NAME' => env('APP_NAME'),
        'APP_URL' => env('APP_URL'),
        'APP_DOMAIN' => env('APP_DOMAIN', 'atalaya.localhost'),
        'APP_CORRELATIVE' => env('APP_CORRELATIVE', 'crm'),
      ],
    ])->rootView('public');
  }
}
