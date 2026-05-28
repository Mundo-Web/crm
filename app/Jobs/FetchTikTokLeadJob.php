<?php

namespace App\Jobs;

use App\Models\Integration;
use App\Models\Campaign;
use App\Models\AdSet;
use App\Models\Ad;
use App\Models\Client;
use App\Models\Message;
use App\Models\ClientNote;
use App\Models\Setting;
use App\Jobs\MetaAssistantJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Fetch;
use SoDe\Extend\Text;

class FetchTikTokLeadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private Integration $integration;
    private string $leadId;
    private string $formId;

    public function __construct(Integration $integration, string $leadId, string $formId)
    {
        $this->integration = $integration;
        $this->leadId = $leadId;
        $this->formId = $formId;
    }

    public function handle()
    {
        try {
            Log::info("FetchTikTokLeadJob starting", [
                'lead_id' => $this->leadId,
                'form_id' => $this->formId,
                'business_id' => $this->integration->business_id
            ]);

            $accessToken = $this->integration->meta_access_token;
            $advertiserId = $this->integration->meta_ad_account_id ?? $this->integration->meta_business_id;

            if (!$accessToken || !$advertiserId) {
                Log::error('FetchTikTokLeadJob failed: missing access token or advertiser ID');
                return;
            }

            // 1. Crear la tarea de descarga en la API de TikTok
            $taskUrl = "https://business-api.tiktok.com/open_api/v1.3/page/lead/task/";
            $taskRes = new Fetch($taskUrl, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Access-Token' => $accessToken
                ],
                'body' => [
                    'advertiser_id' => $advertiserId,
                    'form_id' => $this->formId
                ]
            ]);

            $taskData = $taskRes->json();
            if (isset($taskData['code']) && $taskData['code'] !== 0) {
                Log::error('TikTok Lead Task API error', ['response' => $taskData]);
                return;
            }

            $taskId = $taskData['data']['task_id'] ?? null;
            if (!$taskId) {
                Log::error('TikTok Lead Task API returned no task_id');
                return;
            }

            // 2. Pollear el estado de la tarea
            $status = 'RUNNING';
            $attempts = 0;
            $maxAttempts = 15;

            while ($status === 'RUNNING' && $attempts < $maxAttempts) {
                sleep(2);
                $attempts++;

                $pollUrl = "https://business-api.tiktok.com/open_api/v1.3/page/lead/task/?advertiser_id={$advertiserId}&task_id={$taskId}";
                $pollRes = new Fetch($pollUrl, [
                    'method' => 'GET',
                    'headers' => [
                        'Access-Token' => $accessToken,
                        'Content-Type' => 'application/json'
                    ]
                ]);

                $pollData = $pollRes->json();
                if (isset($pollData['code']) && $pollData['code'] === 0) {
                    $status = $pollData['data']['status'] ?? 'FAILED';
                } else {
                    $status = 'FAILED';
                    Log::error('TikTok Lead Task Poll API error', ['response' => $pollData]);
                }
            }

            if ($status !== 'SUCCEED') {
                Log::error("TikTok Lead Task failed to complete. Final status: {$status}");
                return;
            }

            // 3. Descargar el archivo ZIP de los leads (utilizando file_get_contents con contexto HTTP)
            $downloadUrl = "https://business-api.tiktok.com/open_api/v1.3/page/lead/task/download/?advertiser_id={$advertiserId}&task_id={$taskId}";
            
            $opts = [
                "http" => [
                    "method" => "GET",
                    "header" => "Access-Token: " . $accessToken
                ]
            ];
            $context = stream_context_create($opts);
            $zipData = file_get_contents($downloadUrl, false, $context);

            if (empty($zipData)) {
                Log::error("Failed to download TikTok Lead ZIP file or file is empty.");
                return;
            }

            // 4. Descomprimir el ZIP y parsear el CSV
            $tempFile = tempnam(sys_get_temp_dir(), 'tt_zip_');
            file_put_contents($tempFile, $zipData);

            $zip = new \ZipArchive();
            $csvContent = '';
            if ($zip->open($tempFile) === true) {
                $csvFileName = $zip->getNameIndex(0);
                if ($csvFileName) {
                    $csvContent = $zip->getFromIndex(0);
                }
                $zip->close();
            }
            unlink($tempFile);

            if (empty($csvContent)) {
                Log::error("TikTok Lead ZIP was empty or could not be unzipped.");
                return;
            }

            // Parsear el CSV
            $lines = explode("\n", trim($csvContent));
            $rows = array_map('str_getcsv', $lines);
            $header = array_shift($rows);

            if (empty($header) || empty($rows)) {
                Log::error("TikTok Lead CSV has no header or rows.");
                return;
            }

            // Limpiar encabezados
            $header = array_map(function($h) {
                return trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h));
            }, $header);

            $leadRow = null;
            foreach ($rows as $row) {
                if (count($row) < count($header)) continue;
                $mappedRow = array_combine($header, $row);
                
                // Buscar la columna del Lead ID
                foreach ($mappedRow as $colName => $colValue) {
                    if (strtolower(trim($colName)) === 'lead_id' && trim($colValue) === $this->leadId) {
                        $leadRow = $mappedRow;
                        break 2;
                    }
                }
            }

            // Si no se encuentra el lead específico, tomar la fila más reciente
            if (!$leadRow) {
                Log::warning("TikTok specific lead_id {$this->leadId} not found in CSV. Falling back to the latest row.");
                $leadRow = array_combine($header, end($rows));
            }

            // Extraer campos de contacto
            $fullName = 'TikTok User';
            $phone = '';
            $email = null;

            // Mapear campos estándar del CSV (búsqueda flexible de columnas)
            foreach ($leadRow as $colName => $colValue) {
                $cleanColName = strtolower(trim($colName));
                $colValue = trim($colValue);

                if (str_contains($cleanColName, 'name') || str_contains($cleanColName, 'nombre')) {
                    $fullName = $colValue;
                } elseif (str_contains($cleanColName, 'phone') || str_contains($cleanColName, 'tel') || str_contains($cleanColName, 'cel')) {
                    $phone = preg_replace('/[^0-9]/', '', $colValue);
                } elseif (str_contains($cleanColName, 'email') || str_contains($cleanColName, 'correo')) {
                    $email = $colValue;
                }
            }

            // Buscar si ya existe el cliente (por teléfono o email) en el negocio
            $client = Client::where('business_id', $this->integration->business_id)
                ->where('status', true)
                ->where(function($q) use ($phone, $email) {
                    if ($phone) $q->where('contact_phone', $phone);
                    if ($email) $q->orWhere('contact_email', $email);
                })
                ->first();

            // Buscar / Crear Campaña
            $campaignId = null;
            $adName = $leadRow['Ad Name'] ?? $leadRow['ad_name'] ?? null;
            $adSetName = $leadRow['Adgroup Name'] ?? $leadRow['adgroup_name'] ?? null;
            $campaignName = $leadRow['Campaign Name'] ?? $leadRow['campaign_name'] ?? 'Campaña TikTok';
            $tiktokCampaignId = $leadRow['Campaign ID'] ?? $leadRow['campaign_id'] ?? 'external';

            $campaign = Campaign::updateOrCreate([
                'business_id' => $this->integration->business_id,
                'code' => $tiktokCampaignId
            ], [
                'title' => $campaignName,
                'source' => 'tiktok',
                'status' => true
            ]);
            $campaignId = $campaign->id;

            // Si viene un Adgroup (AdSet), registrarlo
            $adSetId = $leadRow['Adgroup ID'] ?? $leadRow['adgroup_id'] ?? null;
            if ($adSetId) {
                AdSet::updateOrCreate([
                    'campaign_id' => $campaignId,
                    'meta_id' => $adSetId
                ], [
                    'name' => $adSetName ?? 'Conjunto de anuncios TikTok',
                    'status' => 'ACTIVE',
                    'business_id' => $this->integration->business_id
                ]);
            }

            if ($client) {
                // Actualizar atribución para lead existente sin campaña
                if (!$client->campaign_id) {
                    $client->update([
                        'campaign_id' => $campaignId,
                        'adset_name' => $adSetName,
                        'ad_name' => $adName,
                        'source' => 'TikTok',
                        'origin' => 'TikTok',
                        'lead_origin' => 'TikTok',
                        'triggered_by' => 'TikTok Lead Form',
                        'source_channel' => 'TikTok Ads'
                    ]);
                }
            } else {
                // Crear nuevo cliente
                $client = Client::create([
                    'integration_id' => $this->integration->id,
                    'integration_user_id' => $this->leadId,
                    'business_id' => $this->integration->business_id,
                    'name' => $fullName,
                    'contact_name' => $fullName,
                    'contact_phone' => $phone,
                    'contact_email' => $email,
                    'message' => 'Registrado por formulario de TikTok Ads',
                    'source' => 'TikTok',
                    'date' => date('Y-m-d'),
                    'time' => date('H:i:s'),
                    'status_id' => Setting::get('default-lead-status', $this->integration->business_id),
                    'manage_status_id' => Setting::get('default-manage-lead-status', $this->integration->business_id),
                    'origin' => 'TikTok',
                    'lead_origin' => 'TikTok',
                    'triggered_by' => 'TikTok Lead Form',
                    'campaign_id' => $campaignId,
                    'adset_name' => $adSetName,
                    'ad_name' => $adName,
                    'status' => true,
                    'complete_registration' => true,
                    'source_channel' => 'TikTok Ads'
                ]);
            }

            // Guardar respuestas de preguntas en una nota para historial
            $formString = "<b>Formulario TikTok Ads</b><br>";
            $qIdx = 1;
            foreach ($leadRow as $qName => $aValue) {
                if (in_array(strtolower(trim($qName)), ['lead_id', 'form_id', 'ad_id', 'ad_name', 'adgroup_id', 'adgroup_name', 'campaign_id', 'campaign_name', 'create_time', 'email', 'phone number', 'full name', 'phone_number', 'full_name'])) {
                    continue;
                }
                $formString .= "{$qIdx}. {$qName}<br>&emsp;{$aValue}<br>";
                $qIdx++;
            }

            ClientNote::create([
                'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                'client_id' => $client->id,
                'name' => 'Formulario TikTok Ads',
                'description' => $formString
            ]);

            // Disparar Gemini
            $hasApikey = Setting::get('gemini-api-key', $client->business_id);
            if ($hasApikey) {
                // Crear un mensaje mock en messages para el bot
                $message = Message::create([
                    'wa_id' => $this->leadId,
                    'role' => 'Human',
                    'message' => 'Me registré en el formulario de TikTok Ads',
                    'business_id' => $client->business_id,
                    'microtime' => (int) (microtime(true) * 1_000_000)
                ]);

                MetaAssistantJob::dispatch($client, $message, 'tiktok');
            }

            Log::info("FetchTikTokLeadJob finished successfully", ['lead_id' => $this->leadId]);

        } catch (\Throwable $th) {
            Log::error('Error in FetchTikTokLeadJob: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString(),
                'lead_id' => $this->leadId
            ]);
        }
    }
}
