<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();

            $table->string('code');   // Ej: CFB02
            $table->string('source');           // Ej: Facebook, Instagram, TikTok, Landing
            $table->longText('title');            // Ej: Promo Curso Web
            $table->longText('link')->nullable(); // URL del post o walink
            $table->longText('notes')->nullable();  // Información opcional
            $table->unsignedBigInteger('business_id');
            $table->boolean('status')->nullable()->default(true);

            $table->timestamps();

            $table->unique(['business_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
