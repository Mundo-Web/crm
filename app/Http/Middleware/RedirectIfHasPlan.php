<?php

namespace App\Http\Middleware;

use App\Models\Atalaya\PlanPayment;
use App\Models\Atalaya\ServicesByBusiness;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfHasPlan
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {

        return $next($request);
        $service = ServicesByBusiness::query()
            ->join('services', 'services.id', '=', 'services_by_businesses.service_id')
            ->where('services.correlative', env('APP_CORRELATIVE'))
            ->where('services_by_businesses.business_id', Auth::user()->business_id)
            ->first();

        if ($service->exempt) return $next($request);

        if (!$service) {
            return redirect(env('APP_PROTOCOL') . '://' . env('APP_DOMAIN'));
        }

        // Check if service was created more than a month ago
        $oneMonthAgo = now()->subMonth();
        if ($service->created_at < $oneMonthAgo && is_null($service->plan_id)) {
            return redirect('/plans');
        }

        // If has plan, verify if there's a valid payment covering current date
        if ($service->plan_id) {
            $hasValidPayment = PlanPayment::query()
                ->where('business_id', Auth::user()->business_id)
                ->where('begins_at', '<=', now())
                ->where('ends_at', '>=', now())
                ->exists();

            if (!$hasValidPayment) {
                return redirect('/plans');
            }
        }

        return $next($request);
    }
}
