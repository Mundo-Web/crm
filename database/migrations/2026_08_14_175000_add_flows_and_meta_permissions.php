<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            // Flujos
            [
                'name' => 'flows.all',
                'model_name' => 'Flujos',
                'beauty' => 'Todos',
                'description' => 'El usuario podrá gestionar todos los flujos de automatización',
                'guard_name' => 'web',
            ],
            [
                'name' => 'flows.list',
                'model_name' => 'Flujos',
                'beauty' => 'Ver',
                'description' => 'El usuario podrá ver y listar los flujos de automatización',
                'guard_name' => 'web',
            ],
            [
                'name' => 'flows.create',
                'model_name' => 'Flujos',
                'beauty' => 'Agregar',
                'description' => 'El usuario podrá crear nuevos flujos de automatización',
                'guard_name' => 'web',
            ],
            [
                'name' => 'flows.update',
                'model_name' => 'Flujos',
                'beauty' => 'Actualizar',
                'description' => 'El usuario podrá editar y modificar flujos de automatización',
                'guard_name' => 'web',
            ],
            [
                'name' => 'flows.delete',
                'model_name' => 'Flujos',
                'beauty' => 'Eliminar',
                'description' => 'El usuario podrá eliminar flujos de automatización',
                'guard_name' => 'web',
            ],

            // Formularios Meta
            [
                'name' => 'meta-forms.all',
                'model_name' => 'Formularios Meta',
                'beauty' => 'Todos',
                'description' => 'El usuario podrá gestionar todos los formularios y reglas de Meta',
                'guard_name' => 'web',
            ],
            [
                'name' => 'meta-forms.list',
                'model_name' => 'Formularios Meta',
                'beauty' => 'Ver',
                'description' => 'El usuario podrá ver las reglas y formularios de Meta',
                'guard_name' => 'web',
            ],
            [
                'name' => 'meta-forms.create',
                'model_name' => 'Formularios Meta',
                'beauty' => 'Agregar',
                'description' => 'El usuario podrá crear y configurar reglas de formularios Meta',
                'guard_name' => 'web',
            ],
            [
                'name' => 'meta-forms.update',
                'model_name' => 'Formularios Meta',
                'beauty' => 'Actualizar',
                'description' => 'El usuario podrá actualizar reglas de formularios Meta',
                'guard_name' => 'web',
            ],
            [
                'name' => 'meta-forms.delete',
                'model_name' => 'Formularios Meta',
                'beauty' => 'Eliminar',
                'description' => 'El usuario podrá eliminar reglas de formularios Meta',
                'guard_name' => 'web',
            ],

            // Integraciones (Todos)
            [
                'name' => 'integrations.all',
                'model_name' => 'Integraciones',
                'beauty' => 'Todos',
                'description' => 'El usuario tiene acceso completo a todas las integraciones',
                'guard_name' => 'web',
            ],

            // Campañas (Todos)
            [
                'name' => 'campaigns.all',
                'model_name' => 'Campañas',
                'beauty' => 'Todos',
                'description' => 'El usuario tiene acceso completo a las campañas de Meta',
                'guard_name' => 'web',
            ],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(
                ['name' => $p['name']],
                [
                    'model_name' => $p['model_name'],
                    'beauty' => $p['beauty'],
                    'description' => $p['description'],
                    'guard_name' => $p['guard_name'],
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Permission::whereIn('name', [
            'flows.all', 'flows.list', 'flows.create', 'flows.update', 'flows.delete',
            'meta-forms.all', 'meta-forms.list', 'meta-forms.create', 'meta-forms.update', 'meta-forms.delete',
            'integrations.all',
            'campaigns.all',
        ])->delete();
    }
};
