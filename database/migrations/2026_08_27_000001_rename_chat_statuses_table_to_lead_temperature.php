<?php

use App\Models\Table;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Table::where('id', '584dfcba-4b2a-464a-9721-3dfc82bf83f2')
            ->update([
                'name' => 'Temperatura del lead'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Table::where('id', '584dfcba-4b2a-464a-9721-3dfc82bf83f2')
            ->update([
                'name' => 'Estados de Chat'
            ]);
    }
};
