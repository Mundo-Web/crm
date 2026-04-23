<?php
// Script de Normalización Masiva de Leads - Atalaya CRM
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Client;
use App\Models\Campaign;

echo "--- INICIANDO LIMPIEZA DE BASE DE DATOS ---\n";

// 1. Vincular leads a campañas por título o código PRIMERO
echo "1. Vinculando leads a campañas existentes...\n";
$campaigns = Campaign::where('business_id', 3)->get();
$linkedCount = 0;

foreach ($campaigns as $camp) {
    echo "Procesando campaña: {$camp->title} (ID: {$camp->id})\n";
    
    // Variaciones del título para la búsqueda
    $titleWithUnderscores = str_replace(' ', '_', $camp->title);
    $titleWithSpaces = str_replace('_', ' ', $camp->title);
    
    $updated = Client::where('business_id', 3)
        ->whereNull('campaign_id')
        ->where(function($q) use ($camp, $titleWithUnderscores, $titleWithSpaces) {
            $q->where('triggered_by', 'like', '%' . $camp->title . '%')
              ->orWhere('triggered_by', 'like', '%' . $titleWithUnderscores . '%')
              ->orWhere('triggered_by', 'like', '%' . $titleWithSpaces . '%')
              ->orWhere('triggered_by', 'c:' . $camp->code)
              ->orWhere('triggered_by', $camp->code);
        })
        ->update([
            'campaign_id' => $camp->id,
            'source' => 'Meta',
            'origin' => (strtolower($camp->source) == 'instagram') ? 'Instagram' : 'Facebook',
            'lead_origin' => 'campaign',
            'triggered_by' => (strtolower($camp->source) == 'instagram') ? 'Formulario Instagram' : 'Formulario Facebook'
        ]);
    
    if ($updated > 0) {
        echo "   ✅ {$updated} leads vinculados.\n";
        $linkedCount += $updated;
    }
}

// 2. Normalizar el resto que no se pudo vincular
echo "2. Normalizando leads restantes sin campaña...\n";

// Facebook genérico (PPYA, LEADS, etc)
$genFb = Client::where('business_id', 3)
    ->where(function($q) {
        $q->where('triggered_by', 'like', '%PPYA%')
          ->orWhere('triggered_by', 'like', '%LEADS%')
          ->orWhere('triggered_by', 'Facebook Form')
          ->orWhere('triggered_by', 'Facebook');
    })
    ->update([
        'triggered_by' => 'Formulario Facebook', 
        'origin' => 'Facebook', 
        'lead_origin' => 'Facebook', 
        'source' => 'Meta'
    ]);
echo " - {$genFb} leads de Facebook normalizados.\n";

// Instagram genérico
$genIg = Client::where('business_id', 3)
    ->where(function($q) {
        $q->where('triggered_by', 'Instagram Form')
          ->orWhere('triggered_by', 'Instagram');
    })
    ->update([
        'triggered_by' => 'Formulario Instagram', 
        'origin' => 'Instagram', 
        'lead_origin' => 'Instagram', 
        'source' => 'Meta'
    ]);
echo " - {$genIg} leads de Instagram normalizados.\n";

echo "3. Limpiando orígenes incorrectos (internal/Importación/Atalaya)...\n";
$cleaned = Client::where('business_id', 3)
    ->whereIn('source', ['internal', 'Importación', 'Atalaya'])
    ->where(function($q) {
        $q->where('triggered_by', 'like', '%Facebook%')
          ->orWhere('triggered_by', 'like', '%Instagram%')
          ->orWhere('triggered_by', 'like', '%Meta%');
    })
    ->update(['source' => 'Meta']);
echo " - {$cleaned} orígenes corregidos.\n";

echo "--- PROCESO TERMINADO ---\n";
echo "Total de leads vinculados a campañas reales: {$linkedCount}\n";
echo "Base de datos normalizada con éxito.\n";
