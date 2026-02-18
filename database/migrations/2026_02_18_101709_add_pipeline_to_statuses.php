<?php

use App\Models\Status;
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
        Schema::table('statuses', function (Blueprint $table) {
            $table->boolean('pipeline')->default(false);
        });

        // Set pipeline = true for statuses with the specified table_id
        Status::where('table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->update(['pipeline' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('statuses', function (Blueprint $table) {
            $table->dropColumn(['pipeline']);
        });
    }
};
