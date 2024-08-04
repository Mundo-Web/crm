<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\ServiceUser;
use App\Models\User;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends BasicController
{
    public $model = Role::class;
    public $softDeletion = false;
    public $reactView = 'Roles.jsx';

    public function setReactViewProperties(Request $request)
    {
        $permissions = Permission::all();
        return [
            'permissions' => $permissions
        ];
    }

    public function byUser(Request $request, $user): HttpResponse|ResponseFactory
    {
        $response =  new dxResponse();
        try {
            $user = User::find($user);

            $roles = $user->roles;

            $response->status = 200;
            $response->message = 'Operación correcta';
            $response->data = $roles;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $body['business_id'] = Auth::user()->business_id;
        return $body;
    }
}
