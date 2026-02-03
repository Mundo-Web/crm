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
        // Update origin field values to correct format
        DB::table('clients')
            ->where('origin', 'Pauta')
            ->update(['origin' => 'Google']);

        DB::table('clients')
            ->where('origin', 'ig')
            ->update(['origin' => 'Instagram']);

        DB::table('clients')
            ->where('origin', 'chatgpt.com')
            ->update(['origin' => 'Chat GPT']);

        DB::table('clients')
            ->where('origin', 'fb')
            ->update(['origin' => 'Facebook']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            //
        });
    }
};
