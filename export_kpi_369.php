<?php

/**
 * Script para exportar EXACTAMENTE los 369 leads que muestra la card "TOTAL LEADS" 
 * en KPI Campaigns (Julio 2026) y hacer la comparativa directa contra la exportación de Meta.
 * 
 * Uso:
 *   php export_kpi_369.php
 *   php export_kpi_369.php 2026-07
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$monthInput = $argv[1] ?? '2026-07';
[$year, $mo] = explode('-', $monthInput);

$dateFrom = \Carbon\Carbon::parse("{$year}-{$mo}-01 00:00:00", 'America/Lima')->toDateTimeString();
$lastDay  = date('t', mktime(0, 0, 0, (int)$mo, 1, (int)$year));
$dateTo   = \Carbon\Carbon::parse("{$year}-{$mo}-{$lastDay} 23:59:59", 'America/Lima')->toDateTimeString();

$businessId = 3; // Empresa Papaya

echo "========================================================================\n";
echo " EXPORTADOR DE LOS 369 LEADS DE KPI CAMPAIGNS (JULIO 2026)\n";
echo " Business ID: {$businessId} | Periodo: {$dateFrom} al {$dateTo}\n";
echo "========================================================================\n\n";

// -------------------------------------------------------------------------
// 1. OBTENER EXACTAMENTE LOS LEADS DE KPI CAMPAIGNS PARA EL MES COMPLETO
// -------------------------------------------------------------------------
$kpiLeadsQuery = DB::table('clients')
    ->join('client_entries as ce', 'ce.client_id', '=', 'clients.id')
    ->join('campaigns as campaign', 'campaign.id', '=', 'ce.campaign_id')
    ->leftJoin('statuses as status', 'status.id', '=', 'clients.status_id')
    ->leftJoin('statuses as manage_status', 'manage_status.id', '=', 'clients.manage_status_id')
    ->where('clients.business_id', $businessId)
    ->whereRaw('LENGTH(ce.campaign_id) > 10')
    ->whereNotNull('ce.adset_name')
    ->where('ce.adset_name', '<>', '')
    ->whereNotNull('ce.ad_name')
    ->where('ce.ad_name', '<>', '')
    ->whereBetween('ce.entry_date', [$dateFrom, $dateTo])
    ->select([
        'clients.id as client_id',
        'clients.contact_name',
        'clients.contact_phone',
        'clients.contact_email',
        'status.name as status_name',
        'manage_status.name as manage_status_name',
        'campaign.title as campaign_title',
        'ce.adset_name',
        'ce.ad_name',
        'ce.source',
        'ce.origin',
        'ce.entry_date'
    ])
    ->get();

// Deduplicación exacta de KPI Campaigns
$dedupKpiLeads = [];
$seenKeys = [];

foreach ($kpiLeadsQuery as $lead) {
    $phone = preg_replace('/[^0-9]/', '', $lead->contact_phone ?? '');
    $phoneSuffix = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
    $email = strtolower(trim($lead->contact_email ?? ''));

    $key = $phoneSuffix ?: $email;
    if (!$key) continue;

    if (!isset($seenKeys[$key])) {
        $seenKeys[$key] = true;
        $dedupKpiLeads[] = $lead;
    }
}

echo "• Total de registros en la consulta de BD: " . count($kpiLeadsQuery) . "\n";
echo "• TOTAL LEADS ÚNICOS EN KPI CAMPAIGNS (Card del panel): " . count($dedupKpiLeads) . "\n\n";

// -------------------------------------------------------------------------
// 2. GENERAR ARCHIVO kpi_leads_369.csv
// -------------------------------------------------------------------------
$csvFile = __DIR__ . '/kpi_leads_369.csv';
$fp = fopen($csvFile, 'w');
fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8

fputcsv($fp, [
    '#',
    'ID Cliente',
    'Nombre Lead',
    'Teléfono',
    'Email',
    'Estado Gestión',
    'Etiqueta',
    'Campaña',
    'Grupo Anuncios',
    'Anuncio',
    'Origen',
    'Fuente',
    'Fecha Entrada'
]);

foreach ($dedupKpiLeads as $idx => $l) {
    fputcsv($fp, [
        ($idx + 1),
        $l->client_id,
        $l->contact_name,
        $l->contact_phone,
        $l->contact_email,
        $l->status_name ?? 'Sin estado',
        $l->manage_status_name ?? 'Sin etiqueta',
        $l->campaign_title ?? '',
        $l->adset_name ?? '',
        $l->ad_name ?? '',
        $l->origin ?? '',
        $l->source ?? '',
        $l->entry_date ?? ''
    ]);
}
fclose($fp);

echo "✅ Archivo generado exitosamente: 'kpi_leads_369.csv' (" . count($dedupKpiLeads) . " filas)\n\n";

// -------------------------------------------------------------------------
// 3. COMPARAR CONTRA EL ARCHIVO DE META SI EXISTE
// -------------------------------------------------------------------------
$metaCsvPath = __DIR__ . '/LEADS PPYA 2026 _ JUNIO_Leads_2026-06-30_2026-07-21.csv';
if (!file_exists($metaCsvPath)) {
    $metaCsvPath = __DIR__ . '/LEADS PPYA 2026 _ JUNIO_Leads_2026-06-30_2026-07-21.xls';
}

if (file_exists($metaCsvPath)) {
    echo "------------------------------------------------------------------------\n";
    echo " COMPARATIVA AUTOMÁTICA CONTRA META EXPORT: " . basename($metaCsvPath) . "\n";
    echo "------------------------------------------------------------------------\n";

    $rawContent = file_get_contents($metaCsvPath);
    if (substr($rawContent, 0, 2) === "\xFF\xFE" || strpos($rawContent, "\x00") !== false) {
        $rawContent = mb_convert_encoding($rawContent, 'UTF-8', 'UTF-16LE, UTF-16, UTF-8');
    }

    $tempFile = sys_get_temp_dir() . '/meta_369_cmp.csv';
    file_put_contents($tempFile, $rawContent);

    $metaFp = fopen($tempFile, 'r');
    $firstLine = fgets($metaFp);
    rewind($metaFp);
    $delimiter = (strpos($firstLine, "\t") !== false) ? "\t" : ",";

    $metaHeader = fgetcsv($metaFp, 0, $delimiter);
    $emailIdx = -1;
    $phoneIdx = -1;
    $nameIdx  = -1;
    $dateIdx  = -1;

    foreach ($metaHeader as $i => $h) {
        $hLower = strtolower(trim((string)$h));
        if ($hLower === 'email') $emailIdx = $i;
        if (strpos($hLower, 'phone') !== false) $phoneIdx = $i;
        if (strpos($hLower, 'full_name') !== false || strpos($hLower, 'nombre') !== false) $nameIdx = $i;
        if (strpos($hLower, 'created_time') !== false || strpos($hLower, 'created') !== false) $dateIdx = $i;
    }

    $metaLeads = [];
    $metaKeys  = [];

    while (($row = fgetcsv($metaFp, 0, $delimiter)) !== false) {
        if (empty($row)) continue;
        $email = strtolower(trim($row[$emailIdx] ?? ''));
        $phone = preg_replace('/[^0-9]/', '', $row[$phoneIdx] ?? '');
        $phoneSuffix = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
        $name = $row[$nameIdx] ?? '';
        $date = $row[$dateIdx] ?? '';

        $key = $phoneSuffix ?: $email;
        if (!$key) continue;

        $item = [
            'name' => $name,
            'phone' => $phone,
            'phone_suffix' => $phoneSuffix,
            'email' => $email,
            'date' => $date
        ];

        $metaLeads[] = $item;
        if ($phoneSuffix) $metaKeys[$phoneSuffix] = $item;
        if ($email) $metaKeys[$email] = $item;
    }
    fclose($metaFp);
    @unlink($tempFile);

    echo "• Total de filas en el archivo de Meta: " . count($metaLeads) . "\n\n";

    // A. Leads en KPI Campaigns que NO están en Meta
    $inKpiNotInMeta = [];
    foreach ($dedupKpiLeads as $kl) {
        $phone = preg_replace('/[^0-9]/', '', $kl->contact_phone ?? '');
        $phoneSuffix = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
        $email = strtolower(trim($kl->contact_email ?? ''));

        $hasPhoneMatch = $phoneSuffix && isset($metaKeys[$phoneSuffix]);
        $hasEmailMatch = $email && isset($metaKeys[$email]);

        if (!$hasPhoneMatch && !$hasEmailMatch) {
            $inKpiNotInMeta[] = $kl;
        }
    }

    echo "🔍 LEADS DE KPI CAMPAIGNS QUE NO ESTÁN EN META (" . count($inKpiNotInMeta) . "):\n";
    if (count($inKpiNotInMeta) === 0) {
        echo "   (Ninguno. Todos los " . count($dedupKpiLeads) . " leads están presentes en Meta)\n\n";
    } else {
        foreach ($inKpiNotInMeta as $idx => $m) {
            echo "   [" . ($idx + 1) . "] ID: {$m->client_id} | Nombre: {$m->contact_name} | Tel: {$m->contact_phone} | Email: {$m->contact_email} | Fecha: {$m->entry_date}\n";
        }
        echo "\n";
    }
}

echo "========================================================================\n";
echo " PROCESO FINALIZADO\n";
echo " Archivo exportado: crm/kpi_leads_369.csv\n";
echo "========================================================================\n";
