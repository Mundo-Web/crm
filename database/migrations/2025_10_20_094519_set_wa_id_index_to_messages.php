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
        Schema::table('clients', function (Blueprint $table) {
            $table->index('contact_phone');
        });
        Schema::table('messages', function (Blueprint $table) {
            $table->index('wa_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['wa_id']);
        });
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['contact_phone']);
        });
    }
};
