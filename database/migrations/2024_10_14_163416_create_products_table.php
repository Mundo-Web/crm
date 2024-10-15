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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->char('type_id', 36)->index();
            $table->string('name');
            $table->decimal('price')->nullable();
            $table->string('color')->nullable();
            $table->longText('description')->nullable();
            $table->boolean('visible')->default(true);
            $table->boolean('status')->default(true)->nullable();
            $table->bigInteger('business_id');
            $table->timestamps();

            $table->foreign('type_id')->references('id')->on('types')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
