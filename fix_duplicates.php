<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Client;
use App\Models\Campaign;
use Illuminate\Support\Facades\DB;

echo "--- INICIANDO FUSIÓN DE CAMPAÑAS DUPLICADAS (VERSIÓN AGRESIVA) ---\n";

$campaigns = Campaign::all();
$processed = [];
$mergedCount = 0;

foreach ($campaigns as $camp) {
    // Limpiar código usando regex (solo números)
    $cleanCode = preg_replace('/[^0-9]/', '', $camp->code);
    if (empty($cleanCode)) $cleanCode = trim($camp->code); // Fallback for codes like 'a', 'B'
    
    $key = $cleanCode . '_' . $camp->business_id;
    if (in_array($key, $processed)) continue;
    
    // Buscar todos los candidatos que coincidan con este código limpio
    $candidates = Campaign::where('business_id', $camp->business_id)->get();
    $duplicates = $candidates->filter(function($c) use ($cleanCode) {
        return preg_replace('/[^0-9]/', '', $c->code) === $cleanCode || trim($c->code) === $cleanCode;
    });

    if ($duplicates->count() > 1) {
        echo "Encontrados " . $duplicates->count() . " duplicados para el código limpio: '{$cleanCode}'\n";
        
        // Prioridad del maestro:
        // 1. El que tiene meta_id
        // 2. El que tiene más leads vinculados
        $master = $duplicates->sortByDesc(function($d) {
            return ($d->meta_id ? 1000000 : 0) + Client::where('campaign_id', $d->id)->count();
        })->first();
        
        echo " - Maestro seleccionado: {$master->id} (Code: '{$master->code}')\n";

        foreach ($duplicates as $dup) {
            if ($dup->id === $master->id) continue;
            
            echo " - Mezclando campaña {$dup->id} ('{$dup->code}') en {$master->id}...\n";
            
            // Actualizar clientes
            $updatedLeads = Client::where('campaign_id', $dup->id)->update(['campaign_id' => $master->id]);
            if ($updatedLeads > 0) echo "   ✅ {$updatedLeads} leads re-vinculados.\n";
            
            // Eliminar duplicado
            $dup->delete();
            $mergedCount++;
        }
    }
    
    $processed[] = $key;
}

// Limpiar todos los códigos finales
$allCampaigns = Campaign::all();
foreach ($allCampaigns as $c) {
    $newCode = preg_replace('/[^0-9]/', '', $c->code);
    if (!empty($newCode) && strlen($newCode) > 5) { // Solo si parece un ID de Meta
        $c->code = $newCode;
        $c->save();
    }
}

echo "--- PROCESO TERMINADO ---\n";
echo "Campañas duplicadas eliminadas: {$mergedCount}\n";
