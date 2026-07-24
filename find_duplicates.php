<?php

/**
 * Script para identificar registros duplicados por Teléfono y/o por Email en la base de datos del CRM.
 * Permite filtrar por rango de fechas (por defecto: 2026-07-01 al 2026-07-22).
 * 
 * Uso: 
 *   php find_duplicates.php
 *   php find_duplicates.php 2026-07-01 2026-07-22
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$businessId = 3; // Empresa Papaya

$dateFrom = $argv[1] ?? '2026-07-01';
$dateTo   = $argv[2] ?? '2026-07-24';

$startStr = substr($dateFrom, 0, 10) . ' 00:00:00';
$endStr   = substr($dateTo, 0, 10) . ' 23:59:59';

echo "========================================================================\n";
echo " DIAGNÓSTICO DE REGISTROS DUPLICADOS (EMPRESA ID: {$businessId})\n";
echo " RANGO DE FECHAS: {$startStr} a {$endStr}\n";
echo "========================================================================\n\n";

// -------------------------------------------------------------------------
// 1. ANÁLISIS DE DUPLICADOS EN CLIENTES CREADOS / REGISTRADOS EN EL RANGO
// -------------------------------------------------------------------------

// Query base de entradas en el rango
$entriesInRange = DB::table('client_entries as ce')
    ->join('clients', 'clients.id', '=', 'ce.client_id')
    ->where('clients.business_id', $businessId)
    ->whereBetween('ce.entry_date', [$startStr, $endStr])
    ->select([
        'clients.id as client_id',
        'clients.name',
        'clients.contact_name',
        'clients.contact_phone',
        'clients.contact_email',
        'ce.campaign_id',
        'ce.adset_name',
        'ce.ad_name',
        'ce.origin',
        'ce.source',
        'ce.entry_date'
    ])
    ->get();

echo "• Total de registros de entradas ('client_entries') en el rango: " . count($entriesInRange) . "\n";

// Agrupar por Teléfono (últimos 9 dígitos)
$phoneGroups = [];
$emailGroups = [];

foreach ($entriesInRange as $row) {
    $phone = preg_replace('/[^0-9]/', '', $row->contact_phone ?? '');
    $phoneSuffix = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
    $email = strtolower(trim($row->contact_email ?? ''));

    if ($phoneSuffix) {
        $phoneGroups[$phoneSuffix][] = $row;
    }
    if ($email) {
        $emailGroups[$email][] = $row;
    }
}

// -------------------------------------------------------------------------
// 2. DUPLICADOS POR TELÉFONO EN EL RANGO DE FECHAS
// -------------------------------------------------------------------------
echo "\n------------------------------------------------------------------------\n";
echo "1. DUPLICADOS POR NÚMERO DE TELÉFONO EN EL RANGO DE FECHAS\n";
echo "------------------------------------------------------------------------\n";

$dupPhones = array_filter($phoneGroups, fn($list) => count($list) > 1);
echo "Se encontraron " . count($dupPhones) . " números con 2 o más entradas en el rango seleccionado.\n\n";

$i = 1;
foreach ($dupPhones as $phoneSuffix => $list) {
    echo "[{$i}] Teléfono (últimos 9 dígitos): '{$phoneSuffix}' (" . count($list) . " entradas)\n";
    foreach ($list as $item) {
        echo "   └─ Client ID: {$item->client_id} | Nombre: {$item->contact_name} | Tel: {$item->contact_phone} | Email: {$item->contact_email} | Origen: {$item->origin} | Fecha: {$item->entry_date}\n";
    }
    echo "\n";
    $i++;
}

// -------------------------------------------------------------------------
// 3. DUPLICADOS POR EMAIL EN EL RANGO DE FECHAS
// -------------------------------------------------------------------------
echo "------------------------------------------------------------------------\n";
echo "2. DUPLICADOS POR EMAIL EN EL RANGO DE FECHAS\n";
echo "------------------------------------------------------------------------\n";

$dupEmails = array_filter($emailGroups, fn($list) => count($list) > 1);
echo "Se encontraron " . count($dupEmails) . " correos con 2 o más entradas en el rango seleccionado.\n\n";

$i = 1;
foreach ($dupEmails as $email => $list) {
    echo "[{$i}] Email: '{$email}' (" . count($list) . " entradas)\n";
    foreach ($list as $item) {
        echo "   └─ Client ID: {$item->client_id} | Nombre: {$item->contact_name} | Tel: {$item->contact_phone} | Email: {$item->contact_email} | Origen: {$item->origin} | Fecha: {$item->entry_date}\n";
    }
    echo "\n";
    $i++;
}

// -------------------------------------------------------------------------
// 4. DUPLICADOS GLOBALES (CLIENTES CREADOS EN LA TABLA CLIENTS EN EL RANGO)
// -------------------------------------------------------------------------
echo "------------------------------------------------------------------------\n";
echo "3. NUEVOS REGISTROS CREADOS EN LA TABLA 'clients' ENTRE {$dateFrom} Y {$dateTo}\n";
echo "------------------------------------------------------------------------\n";

$newClients = DB::table('clients')
    ->where('business_id', $businessId)
    ->whereBetween('created_at', [$startStr, $endStr])
    ->select(['id', 'contact_name', 'contact_phone', 'contact_email', 'status', 'created_at'])
    ->orderBy('created_at', 'asc')
    ->get();

echo "• Clientes creados en 'clients' en el periodo: " . count($newClients) . "\n\n";

// -------------------------------------------------------------------------
// RESUMEN COMPARATIVO
// -------------------------------------------------------------------------
$uniqueContactsInRange = DB::table('clients')
    ->join('client_entries as ce', 'ce.client_id', '=', 'clients.id')
    ->where('clients.business_id', $businessId)
    ->whereBetween('ce.entry_date', [$startStr, $endStr])
    ->select(DB::raw("COUNT(DISTINCT COALESCE(NULLIF(RIGHT(REGEXP_REPLACE(clients.contact_phone, '[^0-9]', ''), 9), ''), LOWER(clients.contact_email))) as total_unique"))
    ->first()->total_unique;

echo "========================================================================\n";
echo " RESUMEN FINAL DEL RANGO DE FECHAS ({$dateFrom} al {$dateTo})\n";
echo "========================================================================\n";
echo "• Entradas totales en 'client_entries': " . count($entriesInRange) . "\n";
echo "• Contactos ÚNICOS normalizados (KPI Campaigns): {$uniqueContactsInRange}\n";
echo "• Teléfonos duplicados en el rango: " . count($dupPhones) . " grupos\n";
echo "• Emails duplicados en el rango: " . count($dupEmails) . " grupos\n";
echo "========================================================================\n";
