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
        Schema::table('clients', function (Blueprint $table) {
            Schema::table('clients', function (Blueprint $table) {
                DB::table('clients')
                    ->where('triggered_by', 'like', '%Landing%')
                    ->where('triggered_by', 'like', '%Formulario%')
                    ->update([
                        'source' => 'Landing',
                        'triggered_by' => 'Formulario'
                    ]);
            });
        });
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
