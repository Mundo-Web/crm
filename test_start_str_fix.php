<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('business_id', 3)->first();
if ($user) \Illuminate\Support\Facades\Auth::login($user);

// Range A: 2026-07-01 00:00:00 to 2026-07-05 18:59:59 (Current buggy behavior = 80)
$qA = App\Models\Client::where('clients.business_id', 3)
    ->join('client_entries as ce', 'ce.client_id', '=', 'clients.id')
    ->join('campaigns as campaign', 'campaign.id', '=', 'ce.campaign_id')
    ->whereRaw('LENGTH(ce.campaign_id) > 10')
    ->whereNotNull('ce.adset_name')->where('ce.adset_name', '<>', '')
    ->whereNotNull('ce.ad_name')->where('ce.ad_name', '<>', '')
    ->whereBetween('ce.entry_date', ['2026-07-01 00:00:00', '2026-07-05 18:59:59']);

// Range B: 2026-06-30 19:00:00 to 2026-07-05 18:59:59 (Correct UTC behavior = 82)
$qB = App\Models\Client::where('clients.business_id', 3)
    ->join('client_entries as ce', 'ce.client_id', '=', 'clients.id')
    ->join('campaigns as campaign', 'campaign.id', '=', 'ce.campaign_id')
    ->whereRaw('LENGTH(ce.campaign_id) > 10')
    ->whereNotNull('ce.adset_name')->where('ce.adset_name', '<>', '')
    ->whereNotNull('ce.ad_name')->where('ce.ad_name', '<>', '')
    ->whereBetween('ce.entry_date', ['2026-06-30 19:00:00', '2026-07-05 18:59:59']);

$controller = new App\Http\Controllers\KPICampaignsController();
$reflector = new ReflectionClass($controller);
$method = $reflector->getMethod('kpi');

// Helper to count unique
$countUnique = function ($q) {
    $leads = (clone $q)->select('clients.contact_phone', 'clients.contact_email', 'campaign.source')->get();
    $groups = [];
    $whatsappCount = 0;
    foreach ($leads as $l) {
        $source = strtolower($l->source ?? 'facebook');
        if ($source === 'whatsapp') { $whatsappCount++; continue; }
        $phone = preg_replace('/[^0-9]/', '', $l->contact_phone ?? '');
        if (strlen($phone) > 9) $phone = substr($phone, -9);
        $email = strtolower(trim($l->contact_email ?? ''));
        $foundGroup = null;
        foreach ($groups as $idx => $g) {
            if (($phone && in_array($phone, $g['phones'])) || ($email && in_array($email, $g['emails']))) {
                $foundGroup = $idx; break;
            }
        }
        if ($foundGroup !== null) {
            if ($phone && !in_array($phone, $groups[$foundGroup]['phones'])) $groups[$foundGroup]['phones'][] = $phone;
            if ($email && !in_array($email, $groups[$foundGroup]['emails'])) $groups[$foundGroup]['emails'][] = $email;
        } else {
            $groups[] = ['phones' => $phone ? [$phone] : [], 'emails' => $email ? [$email] : []];
        }
    }
    return count($groups) + $whatsappCount;
};

echo "Range A (01/07 00:00:00 to 05/07 18:59:59) unique count: " . $countUnique($qA) . "\n";
echo "Range B (30/06 19:00:00 to 05/07 18:59:59) unique count: " . $countUnique($qB) . "\n";
