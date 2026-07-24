<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$jsonFile = __DIR__ . '/july_2026_sync_data.json';
if (!file_exists($jsonFile)) {
    die("Error: july_2026_sync_data.json no existe.\n");
}

$data = json_decode(file_get_contents($jsonFile), true);
$records = $data['records'] ?? [];

echo "Iniciando actualización en el servidor con " . count($records) . " registros...\n";

$updatedCount = 0;
$notFoundCount = 0;

foreach ($records as $item) {
    $entryId = $item['entry_id'];
    $localEntryDate = $item['entry_date'];
    $phone = preg_replace('/[^0-9]/', '', $item['contact_phone'] ?? '');
    if (strlen($phone) > 9) $phone = substr($phone, -9);

    // 1. Buscar por entry_id exacto en client_entries
    $entry = DB::table('client_entries')->where('id', $entryId)->first();

    if ($entry) {
        if ($entry->entry_date !== $localEntryDate) {
            DB::table('client_entries')->where('id', $entryId)->update([
                'entry_date' => $localEntryDate,
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            $updatedCount++;
        }
    } else {
        // 2. Si no se encuentra por entry_id, buscar client por teléfono y actualizar su entry_date
        if ($phone) {
            $client = DB::table('clients')->whereRaw("RIGHT(contact_phone, 9) = ?", [$phone])->first();
            if ($client) {
                $clientEntry = DB::table('client_entries')->where('client_id', $client->id)->first();
                if ($clientEntry) {
                    DB::table('client_entries')->where('id', $clientEntry->id)->update([
                        'entry_date' => $localEntryDate,
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                    $updatedCount++;
                } else {
                    $notFoundCount++;
                }
            } else {
                $notFoundCount++;
            }
        } else {
            $notFoundCount++;
        }
    }
}

echo "=== RESULTADO DE LA SINCRONIZACIÓN ===\n";
echo "Registros actualizados exitosamente: {$updatedCount}\n";
echo "Registros no encontrados o idénticos: {$notFoundCount}\n";
echo "¡Proceso finalizado!\n";
