<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    use Importable;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Excel::import(new class implements ToModel
        {
            public function model(array $row)
            {
                if (!is_numeric($row[0])) return null;

                Permission::updateOrCreate([
                    'name' => $row[1]
                ], [
                    'description' => $row[2]
                ]);
            }
        }, 'storage/app/utils/Permissions.xlsx');
    }
}
