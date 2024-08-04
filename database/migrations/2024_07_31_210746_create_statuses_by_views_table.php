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
        Schema::create('statuses_by_views', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->char('status_id', 36)->index();
            $table->char('view_id', 36)->index();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('statuses')->cascadeOnDelete();
            $table->foreign('view_id')->references('id')->on('views')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('statuses_by_views');
    }
};
