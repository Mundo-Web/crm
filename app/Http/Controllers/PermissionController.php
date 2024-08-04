<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\dxDataGrid;
use App\Models\PermissionsByRole;
use App\Models\RoleHasPermissions;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response =  new dxResponse();
        try {
            $instance = Permission::select();

            if ($request->group != null) {
                [$grouping] = $request->group;
                $selector = \str_replace('.', '__', $grouping['selector']);
                $instance = Permission::select([
                    "{$selector} AS key"
                ])
                    ->groupBy($selector);
            }

            if ($request->filter) {
                $instance->where(function ($query) use ($request) {
                    dxDataGrid::filter($query, $request->filter ?? []);
                });
            }

            if ($request->sort != null) {
                foreach ($request->sort as $sorting) {
                    $selector = \str_replace('.', '__', $sorting['selector']);
                    $instance->orderBy(
                        $selector,
                        $sorting['desc'] ? 'DESC' : 'ASC'
                    );
                }
            } else {
                $instance->orderBy('id', 'DESC');
            }

            $totalCount = $instance->count('*');
            $jpas = $request->isLoadingAll
                ? $instance->get()
                : $instance
                ->skip($request->skip ?? 0)
                ->take($request->take ?? 10)
                ->get();

            $results = [];

            foreach ($jpas as $jpa) {
                $result = JSON::unflatten($jpa->toArray(), '__');
                // unset($result['_business']);
                // $result['default'] = isset($result['id']) && $result['id'] == $session['setting']['status'];
                $results[] = $result;
            }

            $response->status = 200;
            $response->message = 'Operación correcta';
            $response->data = $results;
            $response->totalCount = $totalCount;
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

    public function byRole(Request $request, $role): HttpResponse|ResponseFactory
    {
        $response =  new dxResponse();
        try {
            $permissions = PermissionsByRole::select([
                'permission__id AS id',
                'permission__name AS name',
                'permission__description AS description',
                'role__id',
                'role__name',
                'role__description'

            ])
                ->where('role__id', $role)
                ->get();

            $results = [];

            foreach ($permissions as $permission) {
                $results[] = JSON::unflatten($permission->toArray(), '__');
            }

            $response->status = 200;
            $response->message = 'Operación correcta';
            $response->data = $results;
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

    public function massiveByRole(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            RoleHasPermissions::where('role_id', $request->role_id)
                ->delete();

            $permissions = $request->permissions;

            foreach ($permissions as $permission) {
                RoleHasPermissions::create([
                    'role_id' => $request->role_id,
                    'permission_id' => $permission
                ]);
            }

            $response->status = 200;
            $response->message = 'Operación correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }

    public function save(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {

            $body = $request->all();
            $jpa = Permission::find($request->id);

            if (!$jpa) {
                Permission::create($body);
            } else {
                $jpa->update($body);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            Permission::where('id', $request->id)
                ->update([
                    'status' => $request->status ? 0 : 1
                ]);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $deleted = Permission::where('id', $id)
                ->update(['status' => null]);

            if (!$deleted) throw new Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }
}
