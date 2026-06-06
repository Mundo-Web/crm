<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Client;
use App\Models\Integration;
use SoDe\Extend\Fetch;

class SyncMetaLeads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'meta:sync-leads';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza los correos electrónicos faltantes de los leads consultando directamente a la API de Meta Graph';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Buscando leads de Meta sin correo electrónico...");

        // Buscar clientes que vengan de Forms y no tengan correo
        $clients = Client::whereNull('contact_email')
            ->whereNotNull('integration_user_id')
            ->where('source', 'Meta')
            ->where(function ($query) {
                $query->where('origin', 'Facebook')
                      ->orWhere('origin', 'Instagram')
                      ->orWhere('lead_origin', 'Facebook')
                      ->orWhere('lead_origin', 'Instagram');
            })
            ->get();

        if ($clients->isEmpty()) {
            $this->info("No se encontraron leads de Meta sin correo electrónico.");
            return;
        }

        $this->info("Se encontraron {$clients->count()} leads para sincronizar. Procesando...");

        // Agrupar por business_id para no buscar el token cada vez
        $businessTokens = [];

        $successCount = 0;
        $errorCount = 0;

        foreach ($clients as $client) {
            $businessId = $client->business_id;
            $leadgenId = $client->integration_user_id;

            // Obtener o cachear el token de integración de Forms
            if (!array_key_exists($businessId, $businessTokens)) {
                $integration = Integration::where('business_id', $businessId)
                    ->where('meta_service', 'forms')
                    ->where('status', true)
                    ->first();
                
                $businessTokens[$businessId] = $integration ? $integration->meta_access_token : null;
            }

            $accessToken = $businessTokens[$businessId];

            if (!$accessToken) {
                $this->error("❌ No hay token de Forms para el negocio ID {$businessId}. Saltando lead {$leadgenId}");
                $errorCount++;
                continue;
            }

            try {
                $facebookGraphUrl = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
                
                $leadRes = new Fetch($facebookGraphUrl . '/' . $leadgenId . '?fields=field_data', [
                    'headers' => ['Authorization' => 'Bearer ' . $accessToken]
                ]);
                
                $leadData = $leadRes->json();

                if (isset($leadData['error'])) {
                    $this->error("❌ Error de Meta para el lead {$leadgenId}: " . ($leadData['error']['message'] ?? 'Desconocido'));
                    $errorCount++;
                    continue;
                }

                $email = null;
                $phone = null;

                foreach ($leadData['field_data'] ?? [] as $field) {
                    $fieldName = strtolower($field['name']);
                    // Buscamos todas las posibles variantes del campo de correo
                    if (in_array($fieldName, ['email', 'work_email', 'correo', 'correo_electronico', 'correo_electrónico'])) {
                        $email = $field['values'][0] ?? null;
                    }
                    if (in_array($fieldName, ['phone_number', 'work_phone_number', 'telefono', 'movil'])) {
                        $phone = $field['values'][0] ?? null;
                    }
                }

                if ($email) {
                    $client->contact_email = $email;
                    if ($phone && !$client->contact_phone) {
                        $client->contact_phone = preg_replace('/[^0-9]/', '', $phone);
                    }
                    $client->save();
                    
                    $this->info("✅ Lead {$leadgenId} sincronizado: Correo encontrado -> {$email}");
                    $successCount++;
                } else {
                    $this->warn("⚠️ Lead {$leadgenId} consultado, pero el usuario no completó el campo de correo.");
                    $errorCount++;
                }

            } catch (\Exception $e) {
                $this->error("❌ Excepción en lead {$leadgenId}: " . $e->getMessage());
                $errorCount++;
            }
        }

        $this->info("====================================");
        $this->info("Sincronización terminada.");
        $this->info("Leads actualizados con éxito: {$successCount}");
        $this->info("Leads sin correo o con errores: {$errorCount}");
    }
}
