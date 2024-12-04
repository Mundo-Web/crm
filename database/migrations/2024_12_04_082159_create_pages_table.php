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
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->default(DB::raw('(UUID())'))->primary();
            $table->foreignUuid('subdomain_id')->constrained('subdomains')->cascadeOnDelete();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->string('path');
            $table->string('img_desktop');
            $table->string('img_tablet')->nullable();
            $table->string('img_mobile')->nullable();
            $table->boolean('visible')->default(true);
            $table->boolean('status')->default(true)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
