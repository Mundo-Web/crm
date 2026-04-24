<?php
use App\Models\Client;
use App\Models\Atalaya\Business;
use App\Models\Setting;
use App\Models\Campaign;
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Iniciando correccion masiva...\n";

// 1. Organicos: source 'Externo' y sin campaña -> 'Organico'
$affected1 = Client::where('source', 'Externo')->whereNull('campaign_id')->update(['source' => 'Organico']);
echo "1. Organicos corregidos (Externo -> Organico): $affected1\n";

// 2. Click to WhatsApp: tienen campaña y decian 'Gemini AI' -> 'Click to WhatsApp' y 'Meta'
$affected2 = Client::whereNotNull('campaign_id')->where('triggered_by', 'Gemini AI')->update([
    'triggered_by' => 'Click to WhatsApp',
    'source' => 'Meta'
]);
echo "2. Click to WhatsApp corregidos (Gemini AI -> Click to WhatsApp): $affected2\n";

// 3. Atribucion Meta: tienen campaña y decian 'Externo' -> 'Meta'
$affected3 = Client::whereNotNull('campaign_id')->where('source', 'Externo')->update(['source' => 'Meta']);
echo "3. Origen corregido (Externo -> Meta para campañas): $affected3\n";

// 4. Correccion de 'Gemini AI' vs 'Whatsapp API' para Organicos (Todos a Whatsapp API)
echo "4. Moviendo leads orgánicos de 'Gemini AI' a 'Whatsapp API'...\n";
$affected4 = Client::whereNull('campaign_id')
    ->where('triggered_by', 'Gemini AI')
    ->update(['triggered_by' => 'Whatsapp API']);
echo "4. Leads orgánicos corregidos: $affected4\n";

// 5. Casos donde Registrado en es igual al nombre de la campaña (frecuente en Meta Ads)
$affected5 = Client::join('campaigns', 'clients.campaign_id', '=', 'campaigns.id')
    ->whereColumn('clients.triggered_by', 'campaigns.title')
    ->update(['clients.triggered_by' => 'Click to WhatsApp', 'clients.source' => 'Meta']);
echo "5. Leads con nombre de campaña en 'Registrado en' corregidos: $affected5\n";

echo "Proceso finalizado.\n";
