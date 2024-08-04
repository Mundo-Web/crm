<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\Atalaya\User as AtalayaUser;
use Closure;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class Authenticate extends Middleware
{

    public function handle($request, Closure $next, ...$guards)
    {
        $correlative = env('APP_CORRELATIVE', 'crm');
        $domain = env('APP_DOMAIN', 'atalaya.localhost');

        if (!Auth::check()) {
            return redirect("//{$domain}/login?service={$correlative}");
        }

        $hasPermission = AtalayaUser::select([
            'users.*',
            'services_by_businesses.business_id',
            'businesses.uuid AS business_uuid',
            DB::raw('IF(businesses.created_by = users.id, true, false) AS is_owner')
        ])
            ->join('users_by_services_by_businesses', 'users_by_services_by_businesses.user_id', 'users.id')
            ->join('services_by_businesses', 'services_by_businesses.id', 'users_by_services_by_businesses.service_by_business_id')
            ->join('services', 'services.id', 'services_by_businesses.service_id')
            ->join('businesses', 'businesses.id', 'services_by_businesses.business_id')
            ->where('services.correlative', $correlative)
            ->where('users.id', Auth::user()->id)
            ->where('users_by_services_by_businesses.active', true)
            ->where('users_by_services_by_businesses.invitation_accepted', true)
            ->first();

        if ($hasPermission) {
            Auth::user()->is_owner = $hasPermission->is_owner;
            Auth::user()->business_id = $hasPermission->business_id;
            Auth::user()->business_uuid = $hasPermission->business_uuid;
            $serviceUser = User::updateOrCreate([
                'user_id' => Auth::user()->id,
                'business_id' => $hasPermission->business_id
            ], [
                'user_id' => Auth::user()->id,
                'business_id' => $hasPermission->business_id,
                'name' => Auth::user()->name,
                'lastname' => Auth::user()->lastname,
                'email' => Auth::user()->email,
                'fullname' => Auth::user()->name . ' ' . Auth::user()->lastname,
            ]);

            $serviceUser->getAllPermissions();
            Auth::user()->service_user = $serviceUser;

            return $next($request);
        }

        return  redirect("http://{$domain}/home?message=" . rawurldecode('No tienes permisos para utilizar el servicio de ' . env('APP_NAME')));
    }
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        return $request->expectsJson() ? null : route('login');
    }
}
