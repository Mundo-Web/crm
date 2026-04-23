<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('integrations', function (Blueprint $table) {
            // Token de app/usuario con permisos de ads_management, ads_read, pages_manage_ads
            // Usado para sincronizar jerarquía de campañas desde Meta
            $table->longText('meta_app_token')->nullable()->after('meta_access_token');
        });
    }

    public function down(): void
    {
        Schema::table('integrations', function (Blueprint $table) {
            $table->dropColumn('meta_app_token');
        });
    }
};
