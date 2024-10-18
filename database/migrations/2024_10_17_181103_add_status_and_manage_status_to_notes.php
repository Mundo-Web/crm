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
        Schema::table('client_notes', function (Blueprint $table) {
            $table->char('status_id', 36)->nullable()->index();
            $table->char('manage_status_id')->nullable()->index();

            $table->foreign('status_id')->references('id')->on('statuses')->nullOnDelete();
            $table->foreign('manage_status_id')->references('id')->on('statuses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('client_notes', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->dropForeign(['manage_status_id']);
            $table->dropColumn(['status_id', 'manage_status_id']);
        });
    }
};
