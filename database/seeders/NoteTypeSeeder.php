<?php

namespace Database\Seeders;

use App\Models\NoteType;
use Illuminate\Database\Seeder;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Facades\Excel;

class NoteTypeSeeder extends Seeder
{
    use Importable;

    public function run(): void
    {
        Excel::import(new class implements ToModel
        {
            public function model(array $row)
            {
                if (!is_numeric($row[0])) return null;

                NoteType::updateOrCreate([
                    'id' => $row[1]
                ], [
                    'id' => $row[1],
                    'name' => $row[2],
                    'description' => $row[3],
                    'order' => $row[4],
                    'icon' => $row[5]
                ]);
            }
        }, 'storage/app/utils/NoteTypes.xlsx');
    }
}
