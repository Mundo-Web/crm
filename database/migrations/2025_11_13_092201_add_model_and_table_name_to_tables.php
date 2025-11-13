<?php

use App\Models\Table;
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
        Schema::table('tables', function (Blueprint $table) {
            $table->string('model_name')->after('id')->nullable();
            $table->string('table_name')->after('model_name')->nullable();
            $table->string('column_pivot')->after('table_name')->nullable();
        });
        /*
        1783c832-8dfb-4d30-810c-bc88345507bf	Productos           App\Models\Product      products        status_id
        9c27e649-574a-47eb-82af-851c5d425434	Gestión             App\Models\Client   	clients         manage_status_id
        a8367789-666e-4929-aacb-7cbc2fbf74de	Clientes            App\Models\Client       clients         status_id
        c81ad4fb-a895-4f4c-b4b3-5989a7a66a85	Notas               App\Models\Note         client_notes    status_id
        cd8bd48f-c73c-4a62-9935-024139f3be5f	Proyectos           App\Models\Project      projects        status_id
        e05a43e5-b3a6-46ce-8d1f-381a73498f33	Leads (Pipelines)   App\Models\Client       clients         status_id
        */

        // Actualizar registros con los nuevos campos
        Table::updateOrCreate(['id' => '1783c832-8dfb-4d30-810c-bc88345507bf'], [
            'model_name' => 'App\Models\Product',
            'table_name' => 'products',
            'column_pivot' => 'status_id'
        ]);

        Table::updateOrCreate(['id' => '9c27e649-574a-47eb-82af-851c5d425434'], [
            'model_name' => 'App\Models\Client',
            'table_name' => 'clients',
            'column_pivot' => 'manage_status_id'
        ]);

        Table::updateOrCreate(['id' => 'a8367789-666e-4929-aacb-7cbc2fbf74de'], [
            'model_name' => 'App\Models\Client',
            'table_name' => 'clients',
            'column_pivot' => 'status_id'
        ]);

        Table::updateOrCreate(['id' => 'c81ad4fb-a895-4f4c-b4b3-5989a7a66a85'], [
            'model_name' => 'App\Models\Note',
            'table_name' => 'client_notes',
            'column_pivot' => 'status_id'
        ]);

        Table::updateOrCreate(['id' => 'cd8bd48f-c73c-4a62-9935-024139f3be5f'], [
            'model_name' => 'App\Models\Project',
            'table_name' => 'projects',
            'column_pivot' => 'status_id'
        ]);

        Table::updateOrCreate(['id' => 'e05a43e5-b3a6-46ce-8d1f-381a73498f33'], [
            'model_name' => 'App\Models\Client',
            'table_name' => 'clients',
            'column_pivot' => 'status_id'
        ]);
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['model_name', 'table_name', 'column_pivot']);
        });
    }
};
