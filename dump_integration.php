<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

$integration = \App\Models\Integration::where('business_id', 35)->where('meta_service', 'whatsapp')->first();
if ($integration) {
    echo "ID: " . $integration->id . "\n";
    echo "WABA: " . $integration->meta_business_id . "\n";
    echo "PHONE: " . $integration->meta_number_id . "\n";
    echo "UUID Business: " . $integration->business->uuid . "\n";
} else {
    echo "INTEGRATION NOT FOUND\n";
}
