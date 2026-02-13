<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Breakdown;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Jenssegers\Agent\Agent;
use Ramsey\Uuid\Uuid;
use SoDe\Extend\Response;

class PixelController extends BasicController
{
    public $reactView = 'Pixels';

    public function setReactViewProperties(Request $request)
    {
        $breakdownsCount = Breakdown::where('business_id', Auth::user()->business_id)->count();
        return [
            'apikey' => Auth::user()->business_uuid,
            'breadkowns' => $breakdownsCount
        ];
    }

    public function pixel(Request $request)
    {
        // Check if tracking cookie exists and corresponds to an existing breakdown
        $businessUUID = $request->apiKey;
        $trackingId = $request->query('x-breakdown-id');
        $utmSource = $request->query('utm_source');

        $exists = false;

        if ($trackingId) {
            $exists = DB::table('breakdowns')->where('id', $trackingId)->exists();
        }

        if (!$exists) {
            $trackingId = (string) Uuid::uuid1();

            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            $browser = $agent->browser();
            $os = $agent->platform();
            $device = $agent->isMobile() ? 'mobile' : 'desktop';

            // Find the business by the given UUID
            $businessJpa = Business::where('uuid', $businessUUID)->first();
            if (!$businessJpa) {
                abort(401, 'Pixel no autorizado. El apiKey es inválido.');
            }

            DB::table('breakdowns')->insert([
                'id' => $trackingId,
                'business_id' => $businessJpa->id,
                'ip_address' => $request->ip(),
                'browser' => $browser,
                'os' => $os,
                'device' => $device,
                'utm_source' => $utmSource,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()
            ->view('utils.track', [
                'paths' => [],
                'selectors' => [],
                'breakdownId' => $trackingId
            ])
            ->header('Content-Type', 'text/javascript');
    }

    public function track(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {});
        return response($response->toArray(), $response->status);
    }
}
