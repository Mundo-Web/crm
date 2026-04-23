<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('integrations', function (Blueprint $table) {
            // ID de la cuenta publicitaria propia de este negocio (ej: act_1960065440840205)
            // Limita el sync de campañas solo a esta cuenta, evitando traer datos de otros clientes
            $table->string('meta_ad_account_id')->nullable()->after('meta_app_token');
        });
    }

    public function down(): void
    {
        Schema::table('integrations', function (Blueprint $table) {
            $table->dropColumn('meta_ad_account_id');
        });
    }
};
