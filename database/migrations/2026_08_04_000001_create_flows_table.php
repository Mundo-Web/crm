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
        Schema::create('flows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('business_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_type')->default('all'); // click_to_whatsapp, meta_form, lead_status, chat_temperature, all
            $table->json('trigger_conditions')->nullable(); // form_id, chat_status_id, manage_status_id, temperature, etc.
            $table->json('tree')->nullable(); // Diagram visual (nodes, edges, questions, actions)
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flows');
    }
};
