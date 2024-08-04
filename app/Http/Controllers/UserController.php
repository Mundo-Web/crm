<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Atalaya\UsersByServicesByBusiness;
use App\Models\dxDataGrid;
use App\Models\ModelHasRoles;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;
use Spatie\Permission\Models\Role;

class UserController extends BasicController
{
    public $model = User::class;
    public $softDeletion = false;
    public $reactView = 'Users';
    public $prefix4filter = 'users';

    public function setPaginationInstance(string $model)
    {
        return $model::select([
            'users.*',
            DB::raw("CONCAT(users.name, ' ', users.lastname) AS `users.fullname`")
        ]);
    }

    public function setReactViewProperties(Request $request)
    {
        $usersJpa = User::byBusiness();

        $rolesJpa = Role::where('business_id', Auth::user()->business_id)->get();

        return [
            'users' => $usersJpa,
            'roles' => $rolesJpa
        ];
    }

    public function assignRole(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $res) use ($request) {
            $roleJpa = Role::select()
                ->where('id', $request->role)
                ->where('business_id', Auth::user()->business_id)
                ->first();
            if (!$roleJpa) throw new Exception('Solo puedes asignar roles que pertenezcan a tu empresa. ¿Que intentas hacer?');

            $userJpa = User::select()
                ->where('user_id', $request->user)
                ->where('business_id', Auth::user()->business_id)
                ->first();

            if (!$userJpa) throw new Exception('Es problable que el usuario no pertenezca a tu empresa o no haya iniciado sesión en ' . env('APP_NAME'));

            ModelHasRoles::where([
                'model_type' => User::class,
                'model_id' => $userJpa->id,
                'business_id' => Auth::user()->business_id
            ])->delete();
            ModelHasRoles::create([
                'model_type' => User::class,
                'model_id' => $userJpa->id,
                'role_id' => $roleJpa->id,
                'business_id' => Auth::user()->business_id
            ]);
        });
        return response($response->toArray(), $response->status);
    }
}
