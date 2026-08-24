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
            $table->index(['business_id', 'status', 'created_at'], 'idx_clients_biz_status_created');
            $table->index(['business_id', 'status', 'status_id', 'created_at'], 'idx_clients_biz_status_sid_created');
            $table->index(['business_id', 'manage_status_id'], 'idx_clients_biz_manage_status');
            $table->index(['business_id', 'chat_status_id'], 'idx_clients_biz_chat_status');
            $table->index(['business_id', 'assigned_to'], 'idx_clients_biz_assigned_to');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['business_id', 'wa_id', 'role', 'microtime'], 'idx_messages_biz_wa_role_micro');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('idx_clients_biz_status_created');
            $table->dropIndex('idx_clients_biz_status_sid_created');
            $table->dropIndex('idx_clients_biz_manage_status');
            $table->dropIndex('idx_clients_biz_chat_status');
            $table->dropIndex('idx_clients_biz_assigned_to');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_biz_wa_role_micro');
        });
    }
};
