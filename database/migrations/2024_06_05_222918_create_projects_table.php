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
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->char('type_id', 36)->index();
            $table->char('client_id', 36)->index();
            $table->char('status_id', 36)->index();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->decimal('cost')->default(0);
            $table->date('signed_at')->nullable();
            $table->date('starts_at');
            $table->date('ends_at');
            $table->boolean('visible')->default(true);
            $table->boolean('status')->default(true)->nullable();
            $table->bigInteger('business_id');
            $table->timestamps();

            $table->foreign('type_id')->references('id')->on('types');
            $table->foreign('client_id')->references('id')->on('clients');
            $table->foreign('status_id')->references('id')->on('statuses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
