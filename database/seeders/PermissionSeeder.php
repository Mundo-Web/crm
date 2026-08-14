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
                    'model_name' => $row[2],
                    'beauty' => $row[3],
                    'description' => $row[4]
                ]);
            }
        }, 'storage/app/utils/Permissions.xlsx');

        $extraPermissions = [
            ['name' => 'flows.all', 'model_name' => 'Flujos', 'beauty' => 'Todos', 'description' => 'El usuario podrá gestionar todos los flujos de automatización'],
            ['name' => 'flows.list', 'model_name' => 'Flujos', 'beauty' => 'Ver', 'description' => 'El usuario podrá ver y listar los flujos de automatización'],
            ['name' => 'flows.create', 'model_name' => 'Flujos', 'beauty' => 'Agregar', 'description' => 'El usuario podrá crear nuevos flujos de automatización'],
            ['name' => 'flows.update', 'model_name' => 'Flujos', 'beauty' => 'Actualizar', 'description' => 'El usuario podrá editar y modificar flujos de automatización'],
            ['name' => 'flows.delete', 'model_name' => 'Flujos', 'beauty' => 'Eliminar', 'description' => 'El usuario podrá eliminar flujos de automatización'],

            ['name' => 'meta-forms.all', 'model_name' => 'Formularios Meta', 'beauty' => 'Todos', 'description' => 'El usuario podrá gestionar todos los formularios y reglas de Meta'],
            ['name' => 'meta-forms.list', 'model_name' => 'Formularios Meta', 'beauty' => 'Ver', 'description' => 'El usuario podrá ver las reglas y formularios de Meta'],
            ['name' => 'meta-forms.create', 'model_name' => 'Formularios Meta', 'beauty' => 'Agregar', 'description' => 'El usuario podrá crear y configurar reglas de formularios Meta'],
            ['name' => 'meta-forms.update', 'model_name' => 'Formularios Meta', 'beauty' => 'Actualizar', 'description' => 'El usuario podrá actualizar reglas de formularios Meta'],
            ['name' => 'meta-forms.delete', 'model_name' => 'Formularios Meta', 'beauty' => 'Eliminar', 'description' => 'El usuario podrá eliminar reglas de formularios Meta'],

            ['name' => 'integrations.all', 'model_name' => 'Integraciones', 'beauty' => 'Todos', 'description' => 'El usuario tiene acceso completo a todas las integraciones'],
            ['name' => 'campaigns.all', 'model_name' => 'Campañas', 'beauty' => 'Todos', 'description' => 'El usuario tiene acceso completo a las campañas de Meta'],
        ];

        foreach ($extraPermissions as $p) {
            Permission::updateOrCreate(
                ['name' => $p['name']],
                [
                    'model_name' => $p['model_name'],
                    'beauty' => $p['beauty'],
                    'description' => $p['description'],
                    'guard_name' => 'web',
                ]
            );
        }
    }
}
