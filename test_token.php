<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Integration;
use Illuminate\Support\Facades\Http;

$integration = Integration::where('meta_service', 'forms')->first();
if (!$integration || !$integration->meta_access_token) {
    die("No hay token de integración para forms.\n");
}

$token = $integration->meta_access_token;
$pageId = $integration->meta_business_id; // 103078851514958
$url = env('FACEBOOK_GRAPH_URL') . '/' . $pageId . '?fields=id,name,access_token';

echo "Probando acceso a la página {$pageId} contra: {$url}\n";

$response = Http::get($url, ['access_token' => $token]);

echo "RESPUESTA DE LA PÁGINA:\n";
print_r($response->json());
