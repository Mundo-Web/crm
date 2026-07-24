<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$jsonFile = __DIR__ . '/july_2026_sync_data.json';
if (!file_exists($jsonFile)) {
    die("Error: july_2026_sync_data.json no existe en el servidor.\n");
}

$data = json_decode(file_get_contents($jsonFile), true);
$records = $data['records'] ?? [];

echo "Iniciando actualización inteligente en el servidor (" . count($records) . " registros)...\n";

$updatedCount = 0;
$notFoundCount = 0;
$alreadyCorrect = 0;

foreach ($records as $item) {
    $entryId        = $item['entry_id'];
    $clientId       = $item['client_id'];
    $localEntryDate = $item['entry_date'];
    $email          = trim(mb_strtolower($item['contact_email'] ?? ''));
    $phone          = preg_replace('/[^0-9]/', '', $item['contact_phone'] ?? '');
    if (strlen($phone) > 9) $phone = substr($phone, -9);

    $matchedEntryId = null;

    // A. Buscar por entry_id exacto en client_entries
    $entryByEntryId = DB::table('client_entries')->where('id', $entryId)->first();
    if ($entryByEntryId) {
        $matchedEntryId = $entryByEntryId->id;
    }

    // B. Si no, buscar por client_id exacto
    if (!$matchedEntryId && $clientId) {
        $entryByClientId = DB::table('client_entries')->where('client_id', $clientId)->first();
        if ($entryByClientId) {
            $matchedEntryId = $entryByClientId->id;
        }
    }

    // C. Si no, buscar por teléfono de cliente (últimos 9 dígitos)
    if (!$matchedEntryId && strlen($phone) >= 7) {
        $clientByPhone = DB::table('clients')->whereRaw("RIGHT(REGEXP_REPLACE(contact_phone, '[^0-9]', ''), 9) = ?", [$phone])->first();
        if ($clientByPhone) {
            $entryByClient = DB::table('client_entries')->where('client_id', $clientByPhone->id)->first();
            if ($entryByClient) {
                $matchedEntryId = $entryByClient->id;
            }
        }
    }

    // D. Si no, buscar por email
    if (!$matchedEntryId && !empty($email)) {
        $clientByEmail = DB::table('clients')->whereRaw("LOWER(contact_email) = ?", [$email])->first();
        if ($clientByEmail) {
            $entryByClient = DB::table('client_entries')->where('client_id', $clientByEmail->id)->first();
            if ($entryByClient) {
                $matchedEntryId = $entryByClient->id;
            }
        }
    }

    if ($matchedEntryId) {
        $current = DB::table('client_entries')->where('id', $matchedEntryId)->first();
        if ($current && $current->entry_date !== $localEntryDate) {
            DB::table('client_entries')->where('id', $matchedEntryId)->update([
                'entry_date' => $localEntryDate,
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            $updatedCount++;
        } else {
            $alreadyCorrect++;
        }
    } else {
        $notFoundCount++;
    }
}

echo "=== RESULTADO DE LA SINCRONIZACIÓN EN EL SERVIDOR ===\n";
echo "✓ Registros corregidos/actualizados a fecha local: {$updatedCount}\n";
echo "✓ Registros que ya tenían la fecha correcta: {$alreadyCorrect}\n";
echo "⚠ Registros no encontrados: {$notFoundCount}\n";
echo "¡Proceso completado!\n";
