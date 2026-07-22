<?php
require 'C:/xampp/htdocs/projects/atalaya_crm/crm/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/projects/atalaya_crm/crm/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Http\Controllers\KPICampaignsController;
use Illuminate\Http\Request;

$user = User::where('business_id', 3)->first();
Auth::login($user);

$controller = new KPICampaignsController();
$req = new Request([
    'month' => '2026-07'
]);

try {
    $res = $controller->kpi($req);
    $data = json_decode($res->getContent(), true);
    echo "SUCCESS! totalCount for month=2026-07: " . ($data['data']['totalCount'] ?? 0) . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
