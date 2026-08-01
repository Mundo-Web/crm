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
        Schema::create('meta_form_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('business_id');
            $table->string('form_id');
            $table->string('form_name')->nullable();
            $table->json('conditions')->nullable();
            $table->string('chat_status_id')->nullable();
            $table->string('manage_status_id')->nullable();
            $table->string('status_id')->nullable();
            $table->bigInteger('assigned_to')->unsigned()->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meta_form_rules');
    }
};
