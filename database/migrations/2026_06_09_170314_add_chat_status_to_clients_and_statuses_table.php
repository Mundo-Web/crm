<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('statuses', 'icon')) {
            Schema::table('statuses', function (Blueprint $table) {
                $table->string('icon', 100)->nullable();
            });
        }

        if (!Schema::hasColumn('clients', 'chat_status_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->foreignIdFor(\App\Models\Status::class, 'chat_status_id')
                    ->nullable()
                    ->constrained('statuses')
                    ->nullOnDelete();
            });
        }

        // Insert "Estados de Chat" table configuration
        DB::table('tables')->updateOrInsert(
            ['id' => '584dfcba-4b2a-464a-9721-3dfc82bf83f2'],
            [
                'model_name' => 'App\\Models\\Client',
                'table_name' => 'clients',
                'column_pivot' => 'chat_status_id',
                'name' => 'Estados de Chat',
                'description' => 'Estados de chat para calificación',
                'configurable' => 1,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('tables')->where('id', '584dfcba-4b2a-464a-9721-3dfc82bf83f2')->delete();

        if (Schema::hasColumn('clients', 'chat_status_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropForeign(['chat_status_id']);
                $table->dropColumn('chat_status_id');
            });
        }

        if (Schema::hasColumn('statuses', 'icon')) {
            Schema::table('statuses', function (Blueprint $table) {
                $table->dropColumn('icon');
            });
        }
    }
};
