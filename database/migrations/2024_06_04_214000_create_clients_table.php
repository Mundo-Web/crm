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
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->string('ruc')->nullable();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_address')->nullable();
            $table->boolean('status')->nullable()->default(true);

            // MIgracion 2
            $table->string('contact_position')->nullable();  //cargo
            $table->longText('message'); // mensaje
            $table->string('web_url'); // urlweb
            $table->string('source'); // source
            $table->string('date'); // fecha
            $table->string('time'); // hora
            $table->string('ip'); // ip
            $table->string('origin'); // llegade
            $table->string('client_width')->nullable(); // ancho
            $table->string('client_height')->nullable(); // alto
            $table->string('client_latitude')->nullable(); // latitud
            $table->string('client_longitude')->nullable(); // longitud
            $table->string('client_system')->nullable(); // sistema
            $table->char('status_id', 36)->index()->nullable();
            $table->char('manage_status_id', 36)->index()->nullable();

            // Migracion 3
            $table->string('tradename')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            // Migracion 4
            $table->string('sector')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable();

            $table->bigInteger('business_id');
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('statuses')->nullOnDelete();
            $table->foreign('manage_status_id')->references('id')->on('statuses')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('updated_by')->references('id')->on('users');
            $table->foreign('assigned_to')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
