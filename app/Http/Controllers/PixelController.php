<?php

namespace App\Http\Controllers;

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
        return [
            'apikey' => Auth::user()->business_uuid
        ];
    }

    public function pixel(Request $request)
    {
        // Check if tracking cookie exists and corresponds to an existing breakdown
        $trackingId = $request->cookie('atalaya-pixel-tracking');
        $exists = false;

        if ($trackingId) {
            $exists = DB::table('breakdowns')->where('id', $trackingId)->exists();
        }

        if (!$exists) {
            $trackingId = (string) Uuid::uuid1();

            $referer = $request->headers->get('referer');
            $parsedReferer = parse_url($referer);
            $utmSource = null;
            if (isset($parsedReferer['query'])) {
                parse_str($parsedReferer['query'], $queryParams);
                $utmSource = $queryParams['utm_source'] ?? null;
            }

            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            $browser = $agent->browser();
            $os = $agent->platform();
            $device = $agent->isMobile() ? 'mobile' : 'desktop';

            DB::table('breakdowns')->insert([
                'id' => $trackingId,
                'ip_address' => $request->ip(),
                'browser' => $browser,
                'os' => $os,
                'device' => $device,
                'utm_source' => $utmSource,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response(view('utils.track')->with([
            'paths' => [],
            'selectors' => [],
            'apiKey' => $request->apiKey
        ]))->cookie('atalaya-pixel-tracking', $trackingId);
    }

    public function track(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {});
        return response($response->toArray(), $response->status);
    }
}
