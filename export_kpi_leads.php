<?php

/**
 * Script independiente para exportar los leads contados por KPI Campaigns a un archivo CSV,
 * y compararlos automáticamente con la exportación de Meta Ads (en CSV o Excel).
 * 
 * Uso en Servidor:
 *   php export_kpi_leads.php
 *   php export_kpi_leads.php 2026-07-01 2026-07-21
 *   php export_kpi_leads.php 2026-07-01 2026-07-21 mi_archivo_meta.xls
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Reader\Xml;

$businessId = 3; // Empresa Papaya
$dateFromInput = $argv[1] ?? '2026-07-01';
$dateToInput   = $argv[2] ?? '2026-07-21';

$dateFrom = \Carbon\Carbon::parse($dateFromInput . ' 00:00:00', 'America/Lima')->toDateTimeString();
$dateTo   = \Carbon\Carbon::parse($dateToInput . ' 23:59:59', 'America/Lima')->toDateTimeString();

echo "========================================================================\n";
echo " EXPORTADOR Y COMPARADOR DE LEADS DE KPI CAMPAIGNS\n";
echo " RANGO DE CONSULTA EN CRM: {$dateFrom} al {$dateTo}\n";
echo "========================================================================\n\n";

// -------------------------------------------------------------------------
// 1. OBTENER LEADS USANDO EXACTAMENTE LA LÓGICA DE KPI CAMPAIGNS
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

// Deduplicación de KPI Campaigns por Teléfono o Email
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

echo "• Total de registros en BD KPI (sin deduplicar): " . count($kpiLeadsQuery) . "\n";
echo "• Total de leads ÚNICOS en KPI Campaigns (panel CRM): " . count($dedupKpiLeads) . "\n\n";

// -------------------------------------------------------------------------
// 2. GENERAR ARCHIVO CSV
// -------------------------------------------------------------------------
$csvFile = __DIR__ . '/kpi_leads_export.csv';
$fp = fopen($csvFile, 'w');
fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8

fputcsv($fp, [
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

foreach ($dedupKpiLeads as $l) {
    fputcsv($fp, [
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

echo "✅ CSV Creado exitosamente: 'kpi_leads_export.csv' (" . count($dedupKpiLeads) . " registros)\n\n";

// -------------------------------------------------------------------------
// 3. COMPARAR CON ARCHIVO EXCEL DE META (SI SE PROPORCIONA O SE ENCUENTRA)
// -------------------------------------------------------------------------
$metaExcelPath = $argv[3] ?? null;

if (!$metaExcelPath) {
    // Buscar archivos .xls o .csv en la carpeta
    $candidates = glob(__DIR__ . '/*.xls');
    if (empty($candidates)) {
        $candidates = glob(dirname(__DIR__) . '/*.xls');
    }
    if (!empty($candidates)) {
        $metaExcelPath = $candidates[0];
    }
}

if ($metaExcelPath && file_exists($metaExcelPath)) {
    echo "------------------------------------------------------------------------\n";
    echo " COMPARATIVA CONTRA EL ARCHIVO DE META:\n " . basename($metaExcelPath) . "\n";
    echo "------------------------------------------------------------------------\n";

    $reader = new Xml();
    $spreadsheet = $reader->load($metaExcelPath);
    $sheet = $spreadsheet->getActiveSheet();
    $rows = $sheet->toArray();
    $headers = array_shift($rows);

    $emailIdx = -1;
    $phoneIdx = -1;
    $nameIdx  = -1;
    $dateIdx  = -1;

    foreach ($headers as $i => $h) {
        $hLower = strtolower(trim((string)$h));
        if ($hLower === 'email') $emailIdx = $i;
        if (strpos($hLower, 'phone') !== false) $phoneIdx = $i;
        if (strpos($hLower, 'full_name') !== false || strpos($hLower, 'nombre') !== false) $nameIdx = $i;
        if (strpos($hLower, 'created_time') !== false || strpos($hLower, 'created') !== false) $dateIdx = $i;
    }

    $metaLeads = [];
    $metaKeys  = [];

    foreach ($rows as $r) {
        $email = strtolower(trim($r[$emailIdx] ?? ''));
        $phone = preg_replace('/[^0-9]/', '', $r[$phoneIdx] ?? '');
        $phoneSuffix = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
        $name = $r[$nameIdx] ?? '';
        $date = $r[$dateIdx] ?? '';

        $key = $phoneSuffix ?: $email;
        if (!$key) continue;

        $metaLeads[] = [
            'key' => $key,
            'name' => $name,
            'phone' => $phone,
            'phone_suffix' => $phoneSuffix,
            'email' => $email,
            'date' => $date
        ];
        if ($phoneSuffix) $metaKeys[$phoneSuffix] = true;
        if ($email) $metaKeys[$email] = true;
    }

    echo "• Total de registros en el Excel de Meta: " . count($rows) . "\n\n";

    // 1. Leads que están en KPI Campaigns pero NO en Meta
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

    echo "🔍 LEADS EN KPI CAMPAIGNS QUE NO ESTÁN EN EL EXCEL DE META (" . count($inKpiNotInMeta) . "):\n";
    if (count($inKpiNotInMeta) === 0) {
        echo "   (Ninguno. Todos los leads de KPI Campaigns existen en el archivo de Meta)\n\n";
    } else {
        foreach ($inKpiNotInMeta as $idx => $m) {
            echo "   [" . ($idx + 1) . "] Nombre: {$m->contact_name} | Tel: {$m->contact_phone} | Email: {$m->contact_email} | Origen: {$m->origin} | Fecha: {$m->entry_date}\n";
        }
        echo "\n";
    }

    // 2. Leads que están en Meta pero NO en KPI Campaigns
    $kpiKeys = [];
    foreach ($dedupKpiLeads as $kl) {
        $phone = preg_replace('/[^0-9]/', '', $kl->contact_phone ?? '');
        $phoneSuffix = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
        $email = strtolower(trim($kl->contact_email ?? ''));

        if ($phoneSuffix) $kpiKeys[$phoneSuffix] = true;
        if ($email) $kpiKeys[$email] = true;
    }

    $inMetaNotInKpi = [];
    foreach ($metaLeads as $ml) {
        $hasPhoneMatch = $ml['phone_suffix'] && isset($kpiKeys[$ml['phone_suffix']]);
        $hasEmailMatch = $ml['email'] && isset($kpiKeys[$ml['email']]);

        if (!$hasPhoneMatch && !$hasEmailMatch) {
            $inMetaNotInKpi[] = $ml;
        }
    }

    echo "🔍 LEADS EN EL EXCEL DE META QUE NO APARECEN EN KPI CAMPAIGNS (" . count($inMetaNotInKpi) . "):\n";
    if (count($inMetaNotInKpi) === 0) {
        echo "   (Ninguno. Todos los leads del archivo de Meta están en KPI Campaigns)\n\n";
    } else {
        foreach ($inMetaNotInKpi as $idx => $m) {
            echo "   [" . ($idx + 1) . "] Nombre: {$m['name']} | Tel: {$m['phone']} | Email: {$m['email']} | Fecha Meta: {$m['date']}\n";
        }
        echo "\n";
    }
}

echo "========================================================================\n";
echo " PROCESO COMPLETADO EXITOSAMENTE\n";
echo " Archivo exportado: crm/kpi_leads_export.csv\n";
echo "========================================================================\n";
