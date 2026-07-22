<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('client_id');
            $table->string('campaign_id', 36)->nullable();  // FK a campaigns (string UUID)
            $table->string('adset_name')->nullable();
            $table->string('ad_name')->nullable();
            $table->string('source')->nullable();           // 'Meta', 'WhatsApp', 'Landing', 'Google', etc.
            $table->string('origin')->nullable();           // 'Facebook', 'Instagram', 'Orgánico', 'Landing', etc.
            $table->string('lead_origin')->nullable();
            $table->string('triggered_by')->nullable();    // 'Formulario Facebook', 'Click-to-WhatsApp', etc.
            $table->string('source_channel')->nullable();
            $table->timestamp('entry_date');               // Fecha real de esta entrada (para KPIs por rango)
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
        });

        // ─────────────────────────────────────────────────────────────────────
        // Migrar datos históricos: crear una entry por cada cliente existente
        // usando sus campos actuales de atribución.
        // ─────────────────────────────────────────────────────────────────────
        $clients = DB::table('clients')
            ->whereNotNull('source')
            ->orWhereNotNull('campaign_id')
            ->orWhereNotNull('origin')
            ->get(['id', 'campaign_id', 'adset_name', 'ad_name', 'source', 'origin',
                   'lead_origin', 'triggered_by', 'source_channel', 'created_at']);

        $now = now();
        $entries = $clients->map(function ($client) use ($now) {
            return [
                'id'             => \Illuminate\Support\Str::uuid()->toString(),
                'client_id'      => $client->id,
                'campaign_id'    => $client->campaign_id,
                'adset_name'     => $client->adset_name,
                'ad_name'        => $client->ad_name,
                'source'         => $client->source,
                'origin'         => $client->origin,
                'lead_origin'    => $client->lead_origin,
                'triggered_by'   => $client->triggered_by,
                'source_channel' => $client->source_channel,
                'entry_date'     => $client->created_at,
                'created_at'     => $now,
                'updated_at'     => $now,
            ];
        })->toArray();

        // Insertar en lotes de 500 para no saturar la memoria
        foreach (array_chunk($entries, 500) as $chunk) {
            DB::table('client_entries')->insert($chunk);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('client_entries');
    }
};
