<?php
// Set headers to prevent caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Content-Type: text/plain; charset=UTF-8');

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Client;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "=== SERVER TIMEZONE DIAGNOSTIC ===\n\n";

echo "PHP Timezone: " . date_default_timezone_get() . "\n";
echo "Laravel App Timezone: " . config('app.timezone') . "\n";
echo "Laravel DB Timezone Config: " . DB::connection()->getConfig('timezone') . "\n";

$mysqlTime = DB::select("SELECT NOW() as local, UTC_TIMESTAMP() as utc, @@session.time_zone as session_tz, @@global.time_zone as global_tz");
echo "MySQL NOW(): " . $mysqlTime[0]->local . "\n";
echo "MySQL UTC_TIMESTAMP(): " . $mysqlTime[0]->utc . "\n";
echo "MySQL Session Timezone: " . $mysqlTime[0]->session_tz . "\n";
echo "MySQL Global Timezone: " . $mysqlTime[0]->global_tz . "\n";

$businessId = 3; // Papaya
echo "\n=== PAPAYA LEADS COUNTS FOR JULY 1st, 2026 ===\n";

// 1. Total local
$cLocalAll = Client::where('business_id', $businessId)
    ->whereBetween('created_at', ['2026-07-01 00:00:00', '2026-07-01 23:59:59'])
    ->count();
echo "1. Total Leads (Local Time, no filters): $cLocalAll\n";

// 2. Campaigns local
$cLocalCamp = Client::where('clients.business_id', $businessId)
    ->join('campaigns as campaign', 'campaign.id', '=', 'clients.campaign_id')
    ->whereNotNull('clients.adset_name')
    ->where('clients.adset_name', '<>', '')
    ->whereNotNull('clients.ad_name')
    ->where('clients.ad_name', '<>', '')
    ->whereBetween('clients.created_at', ['2026-07-01 00:00:00', '2026-07-01 23:59:59'])
    ->count();
echo "2. Campaign Leads (Local Time): $cLocalCamp\n";

// 3. Total shifted (+5H)
$cShiftedAll = Client::where('business_id', $businessId)
    ->whereBetween(DB::raw('DATE_ADD(created_at, INTERVAL 5 HOUR)'), ['2026-07-01 00:00:00', '2026-07-01 23:59:59'])
    ->count();
echo "3. Total Leads (Meta Timezone +5H): $cShiftedAll\n";

// 4. Campaigns shifted (+5H)
$cShiftedCamp = Client::where('clients.business_id', $businessId)
    ->join('campaigns as campaign', 'campaign.id', '=', 'clients.campaign_id')
    ->whereNotNull('clients.adset_name')
    ->where('clients.adset_name', '<>', '')
    ->whereNotNull('clients.ad_name')
    ->where('clients.ad_name', '<>', '')
    ->whereBetween(DB::raw('DATE_ADD(clients.created_at, INTERVAL 5 HOUR)'), ['2026-07-01 00:00:00', '2026-07-01 23:59:59'])
    ->count();
echo "4. Campaign Leads (Meta Timezone +5H): $cShiftedCamp\n";

// Let's print the actual leads registered on July 1st (Local Time) on the server
echo "\n=== LEADS REGISTERED ON JULY 1st (LOCAL TIME) ON SERVER ===\n";
$leads = Client::where('business_id', $businessId)
    ->whereBetween('created_at', ['2026-07-01 00:00:00', '2026-07-01 23:59:59'])
    ->get();
foreach ($leads as $l) {
    echo " - Name: {$l->contact_name} | CreatedAt: {$l->created_at} | Origin: {$l->origin} | CampaignID: " . ($l->campaign_id ?: 'NULL') . "\n";
}
?>
