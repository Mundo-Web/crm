<?php

namespace App\Http\Controllers;

use App\Models\UserByProject;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class UserByProjectController extends Controller
{
    public function massiveByProject(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            UserByProject::where('project_id', $request->project_id)
                ->delete();

            $users = $request->users;

            foreach ($users as $user_id) {
                UserByProject::create([
                    'project_id' => $request->project_id,
                    'user_id' => $user_id
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

    public function massiveByUser(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            UserByProject::where('user_id', $request->user_id)
                ->delete();

            $projects = $request->projects;

            foreach ($projects as $project_id) {
                UserByProject::create([
                    'user_id' => $request->user_id,
                    'project_id' => $project_id
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

    public function getUser(Request $request, $relative_id)
    {
        $response = new Response();
        try {
            $user = UserByProject::select([
                'users.id',
                'users.name',
                'users.lastname',
                'users.email',
                'users_by_projects.created_at'
            ])
                ->join('users', 'users.id', '=', 'users_by_projects.user_id')
                ->where('relative_id', $relative_id)
                ->first();

            if (!$user) throw new Exception('Usuario no encontrado');

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $user;
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

    public function byProject(Request $request, $project_id): HttpResponse|ResponseFactory
    {
        $response =  new Response();
        try {
            $users = UserByProject::select([
                'users.id',
                DB::raw('CONCAT(users.name, " ", users.lastname) as fullname')
            ])
                ->join('users', 'users.id', '=', 'users_by_projects.user_id')
                ->where('project_id', $project_id)
                ->get();

            $response->status = 200;
            $response->message = 'Operación correcta';
            $response->data = $users;
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
}
