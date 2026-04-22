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
        Schema::create('ads', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            
            $table->uuid('ad_set_id');
            $table->string('meta_id')->unique();
            $table->string('name');
            $table->string('status')->nullable();
            
            $table->unsignedBigInteger('business_id');
            $table->timestamps();

            $table->foreign('ad_set_id')->references('id')->on('ad_sets')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ads');
    }
};
