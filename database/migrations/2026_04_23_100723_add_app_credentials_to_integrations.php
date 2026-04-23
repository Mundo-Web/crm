<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('integrations', function (Blueprint $row) {
            $row->string('meta_app_id')->nullable()->after('meta_business_id');
            $row->string('meta_app_secret')->nullable()->after('meta_app_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('integrations', function (Blueprint $row) {
            $row->dropColumn(['meta_app_id', 'meta_app_secret']);
        });
    }
};
