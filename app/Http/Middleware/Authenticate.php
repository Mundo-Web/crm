<?php

namespace App\Http\Middleware;

use App\Models\Atalaya\BusinessSign;
use App\Models\User;
use App\Models\Atalaya\User as AtalayaUser;
use Closure;
use Error;
use Exception;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\JSON;
use SoDe\Extend\Text;
use Illuminate\Support\Facades\Schema;

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

        if (!$hasPermission) return redirect("http://{$domain}/home?message=" . rawurldecode('No tienes permisos para utilizar el servicio de ' . env('APP_NAME')));

        Auth::user()->is_owner = $hasPermission->is_owner;
        Auth::user()->business_id = $hasPermission->business_id;
        Auth::user()->business_uuid = $hasPermission->business_uuid;

        // $signJpa = BusinessSign::select('sign')
        //     ->where('business_id', $hasPermission->business_id)
        //     ->where('user_id', Auth::user()->id)
        //     ->first();

        $serviceUser = User::updateOrCreate([
            'user_id' => $hasPermission->id,
            'business_id' => $hasPermission->business_id
        ], [
            'user_id' => $hasPermission->id,
            'business_id' => $hasPermission->business_id,
            'name' => $hasPermission->name,
            'lastname' => $hasPermission->lastname,
            'email' => $hasPermission->email,
            'fullname' => $hasPermission->name . ' ' . $hasPermission->lastname,
            'relative_id' => $hasPermission->relative_id,
            // 'mailing_sign' => $signJpa->sign ?? null
        ]);

        $serviceUser->getAllPermissions();
        Auth::user()->service_user = $serviceUser;

        return $next($request);
    }
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        return $request->expectsJson() ? null : route('login');
    }
}
