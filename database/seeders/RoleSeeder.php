<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // $root = Role::create(['name' => 'Root']);
        // $admin = Role::create(['name' => 'Admin']);
        // $user = Role::create(['name' => 'User']);
        // $head = Role::create(['name' => 'Head']);

        // Permite ver usuarios root
        // Permission::create(['name' => 'users.root'])
        //     ->syncRoles([$root]);
        // Crud sobre los usuarios excepto root
        // Permission::create(['name' => 'users.all'])
        //     ->syncRoles([$root, $admin, $head]);
        // // Permite solo listar
        // Permission::create(['name' => 'users.list'])
        //     ->syncRoles([$user]);
    }
}
