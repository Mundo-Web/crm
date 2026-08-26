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
        Schema::table('breakdowns', function (Blueprint $table) {
            $table->string('utm_medium', 255)->nullable()->after('utm_source');
            $table->string('utm_campaign', 255)->nullable()->after('utm_medium');
            $table->string('utm_term', 255)->nullable()->after('utm_campaign');
            $table->string('utm_content', 255)->nullable()->after('utm_term');
            $table->text('page_url')->nullable()->after('utm_content');
            $table->text('referrer')->nullable()->after('page_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('breakdowns', function (Blueprint $table) {
            $table->dropColumn([
                'utm_medium',
                'utm_campaign',
                'utm_term',
                'utm_content',
                'page_url',
                'referrer'
            ]);
        });
    }
};
