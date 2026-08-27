<?php

use App\Models\Atalaya\Business;
use App\Models\Process;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            $businesses = Business::all();
            foreach ($businesses as $business) {
                Process::createDefaultsForBusiness($business->id);
            }
        } catch (\Throwable $th) {
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
