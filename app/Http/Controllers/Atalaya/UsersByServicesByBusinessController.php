<?php

namespace App\Http\Controllers\Atalaya;

use App\Http\Controllers\Controller;
use App\Models\Atalaya\UsersByServicesByBusiness as AtalayaUsersByServicesByBusiness;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class UsersByServicesByBusinessController extends Controller
{
  public function activeService(Request $request)
  {
    $response = Response::simpleTryCatch(function (Response $res) use ($request) {
      $ubsbb = AtalayaUsersByServicesByBusiness::with(['service'])
        ->select(['users_by_services_by_businesses.*'])
        ->join('services_by_businesses', 'services_by_businesses.id', 'users_by_services_by_businesses.service_by_business_id')
        ->join('services', 'services.id', 'services_by_businesses.service_id')
        ->join('businesses', 'businesses.id', 'services_by_businesses.business_id')
        ->where('user_id', Auth::user()->id)
        ->where('services.correlative', $request->service)
        ->where('businesses.uuid', Auth::user()->business_uuid)
        ->first();
      if (!$ubsbb) throw new Exception('No tienes permisos para este servicio');

      AtalayaUsersByServicesByBusiness::join('services_by_businesses', 'services_by_businesses.id', 'users_by_services_by_businesses.service_by_business_id')
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
}
