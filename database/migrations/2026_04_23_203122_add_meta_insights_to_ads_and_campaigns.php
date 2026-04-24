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
        Schema::table('campaigns', function (Blueprint $table) {
            $table->decimal('spend', 10, 2)->nullable();
            $table->integer('impressions')->nullable();
            $table->integer('clicks')->nullable();
        });

        Schema::table('ad_sets', function (Blueprint $table) {
            $table->decimal('spend', 10, 2)->nullable();
        });

        Schema::table('ads', function (Blueprint $table) {
            $table->decimal('spend', 10, 2)->nullable();
            $table->text('preview_image_url')->nullable();
            $table->string('form_name')->nullable();
            $table->text('body_text')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn(['spend', 'impressions', 'clicks']);
        });

        Schema::table('ad_sets', function (Blueprint $table) {
            $table->dropColumn(['spend']);
        });

        Schema::table('ads', function (Blueprint $table) {
            $table->dropColumn(['spend', 'preview_image_url', 'form_name', 'body_text']);
        });
    }
};
