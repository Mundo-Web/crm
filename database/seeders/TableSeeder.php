<?php

namespace Database\Seeders;

use App\Models\Table;
use Illuminate\Database\Seeder;

use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Facades\Excel;

class TableSeeder extends Seeder
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

                Table::updateOrCreate([
                    'id' => $row[1]
                ], [
                    'name' => $row[2],
                    'description' => $row[3],
                    'configurable' => $row[4]
                ]);
            }
        }, 'storage/app/utils/Tables.xlsx');
    }
}
