<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega la columna `tree` (árbol de decisión JSON) y `tag` a meta_form_rules.
     * También agrega `name` para identificar el árbol con un nombre legible.
     */
    public function up(): void
    {
        Schema::table('meta_form_rules', function (Blueprint $table) {
            // Árbol de decisión serializado como JSON
            $table->json('tree')->nullable()->after('conditions');
            // Nombre descriptivo para el árbol (ej. "Flujo presupuesto alto")
            $table->string('rule_name')->nullable()->after('form_name');
        });
    }

    public function down(): void
    {
        Schema::table('meta_form_rules', function (Blueprint $table) {
            $table->dropColumn(['tree', 'rule_name']);
        });
    }
};
