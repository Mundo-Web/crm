<?php

namespace App\Http\Middleware;

use App\Models\Atalaya\ServicesByBusiness;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfFirstTime
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $service = ServicesByBusiness::query()
            ->join('services', 'services.id', '=', 'services_by_businesses.service_id')
            ->join('businesses', 'businesses.id', '=', 'services_by_businesses.business_id')
            ->where('services.correlative', env('APP_CORRELATIVE'))
            ->where('services_by_businesses.business_id', Auth::user()->business_id)
            ->where('businesses.created_by', Auth::user()->id)
            ->first();

        if (!$service) return redirect(env('APP_PROTOCOL') . '://' . env('APP_DOMAIN'));
        if ($service->first_time) return redirect('/join');

        return $next($request);
    }
}
