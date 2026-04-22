<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Campaign;

$campaigns = Campaign::all();
foreach ($campaigns as $campaign) {
    $old = $campaign->code;
    $campaign->code = trim($campaign->code);
    if ($old !== $campaign->code) {
        $campaign->save();
        echo "Updated campaign {$campaign->id}: '{$old}' -> '{$campaign->code}'\n";
    }
}
echo "Done.\n";
