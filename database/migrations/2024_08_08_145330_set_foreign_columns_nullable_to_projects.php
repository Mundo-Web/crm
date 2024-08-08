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
        Schema::table('projects', function (Blueprint $table) {
            // Elimina las restricciones de clave foránea existentes
            $table->dropForeign(['client_id']);
            $table->dropForeign(['status_id']);
            $table->dropForeign(['type_id']);

            // Modifica las columnas para que sean nulleables
            $table->char('client_id', 36)->nullable()->change();
            $table->char('status_id', 36)->nullable()->change();
            $table->char('type_id', 36)->nullable()->change();

            // Añade de nuevo las restricciones de clave foránea con la acción en cascada
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('status_id')->references('id')->on('statuses')->onDelete('set null');
            $table->foreign('type_id')->references('id')->on('types')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Vuelve a establecer las columnas como no nulleables y restaura las restricciones originales
            $table->dropForeign(['client_id']);
            $table->dropForeign(['status_id']);
            $table->dropForeign(['type_id']);

            $table->char('client_id', 36)->nullable(false)->change();
            $table->char('status_id', 36)->nullable(false)->change();
            $table->char('type_id', 36)->nullable(false)->change();

            $table->foreign('client_id')->references('id')->on('clients');
            $table->foreign('status_id')->references('id')->on('statuses');
            $table->foreign('type_id')->references('id')->on('types');
        });
    }
};
