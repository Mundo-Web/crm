<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar spend_updated_at a campaigns (spend ya existe)
        if (Schema::hasTable('campaigns') && !Schema::hasColumn('campaigns', 'spend_updated_at')) {
            Schema::table('campaigns', function (Blueprint $table) {
                $table->timestamp('spend_updated_at')->nullable()->after('spend');
            });
        }

        // Crear tabla de metas de leads por campaña / negocio
        if (!Schema::hasTable('campaign_goals')) {
            Schema::create('campaign_goals', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('business_id');
                $table->uuid('campaign_id')->nullable();
                $table->enum('period', ['monthly', 'weekly'])->default('monthly');
                $table->unsignedInteger('target_leads');
                $table->decimal('target_spend', 10, 2)->nullable();
                $table->timestamps();

                $table->index('business_id');
                $table->index('campaign_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_goals');

        if (Schema::hasColumn('campaigns', 'spend_updated_at')) {
            Schema::table('campaigns', function (Blueprint $table) {
                $table->dropColumn('spend_updated_at');
            });
        }
    }
};
