<?php
// Script de Normalización Masiva de Leads - Atalaya CRM
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Client;
use App\Models\Campaign;

echo "--- INICIANDO LIMPIEZA DE BASE DE DATOS ---\n";

// 1. Normalizar nombres de origen (Facebook/Instagram)
echo "1. Normalizando nombres de origen...\n";
Client::where('triggered_by', 'Facebook Form')->orWhere('triggered_by', 'Facebook')
    ->update([
        'triggered_by' => 'Formulario Facebook', 
        'origin' => 'Facebook', 
        'lead_origin' => 'Facebook', 
        'source' => 'Meta'
    ]);

Client::where('triggered_by', 'Instagram Form')->orWhere('triggered_by', 'Instagram')
    ->update([
        'triggered_by' => 'Formulario Instagram', 
        'origin' => 'Instagram', 
        'lead_origin' => 'Instagram', 
        'source' => 'Meta'
    ]);

// 2. Vincular leads que tienen el código de campaña (c:ID) o el TÍTULO de la campaña en el campo equivocado
echo "2. Vinculando y normalizando por códigos y títulos de campaña...\n";
$clients = Client::where('triggered_by', '!=', 'Formulario Facebook')
                ->where('triggered_by', '!=', 'Formulario Instagram')
                ->get();
$count = 0;

foreach ($clients as $c) {
    $foundCampaign = null;
    
    if ($c->campaign_id) {
        $foundCampaign = Campaign::find($c->campaign_id);
    } else {
        // Intentar por código (c:ID)
        $code = str_replace('c:', '', $c->triggered_by);
        $foundCampaign = Campaign::where('code', $code)->first();
        
        // Si no, intentar por título exacto
        if (!$foundCampaign) {
            $foundCampaign = Campaign::where('title', $c->triggered_by)->first();
        }
    }

    if ($foundCampaign) {
        $c->campaign_id = $foundCampaign->id;
        $c->triggered_by = (strtolower($foundCampaign->source) == 'instagram') ? 'Formulario Instagram' : 'Formulario Facebook';
        $c->origin = (strtolower($foundCampaign->source) == 'instagram') ? 'Instagram' : 'Facebook';
        $c->lead_origin = $c->origin;
        $c->source = 'Meta';
        $c->save();
        $count++;
    }
}

echo "--- PROCESO TERMINADO ---\n";
echo "Leads vinculados a campañas: {$count}\n";
echo "Base de datos normalizada con éxito.\n";
