<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\BusinessSign;
use App\Models\ModelHasRoles;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\File;

class UserController extends BasicController
{
    public $model = User::class;
    public $softDeletion = false;
    public $reactView = 'Users';
    public $prefix4filter = 'users';

    public function setPaginationInstance(Request $request, string $model)
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

    public function addSign(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            // Validar si el archivo fue adjuntado
            if (!$request->hasFile('sign')) {
                throw new Exception('Debes adjuntar una firma.');
            }

            $sign = $request->file('sign');

            // Validar que el archivo sea una imagen (sin usar Intervention Image)
            if (!$sign->isValid() || !in_array($sign->getMimeType(), ['image/jpeg', 'image/png', 'image/gif'])) {
                throw new Exception('El archivo adjuntado debe ser una imagen válida (jpeg, png, gif).');
            }

            $directory = public_path('storage/signs');

            // Crear la carpeta si no existe
            if (!File::exists($directory)) {
                File::makeDirectory($directory, 0755, true);
            }

            // Generar UUID y nombre de archivo para la nueva firma
            $uuid = Crypto::randomUUID();
            $filename = $uuid . '.' . $sign->getClientOriginalExtension();

            // Mover el archivo a la carpeta de destino
            $sign->move($directory, $filename);

            // Obtener el usuario autenticado
            $userJpa = User::where('business_id', Auth::user()->business_id)
                ->where('user_id', Auth::user()->id)
                ->first();

            if (!$userJpa) {
                throw new Exception('Usuario no encontrado.');
            }

            // Guardar la nueva firma en la base de datos
            $previousSign = $userJpa->mailing_sign; // Guardamos el nombre de la firma anterior
            $userJpa->mailing_sign = $filename;
            $userJpa->save();

            // Eliminar la firma anterior si existe, solo después de haber guardado la nueva
            if ($previousSign) {
                $oldSignPath = $directory . '/' . $previousSign;
                if (File::exists($oldSignPath)) {
                    File::delete($oldSignPath);
                }
            }

            return $filename;
        });

        return response($response->toArray(), $response->status);
    }

    public function deleteSign(Request $request)
    {
        $response = Response::simpleTryCatch(function () {
            $userJpa = User::where('business_id', Auth::user()->business_id)
                ->where('user_id', Auth::user()->id)
                ->first();

            if (!$userJpa) {
                throw new Exception('Usuario no encontrado.');
            }

            // Eliminar la firma anterior si existe
            $directory = public_path('storage/signs');

            if ($userJpa->mailing_sign) {
                $oldSignPath = $directory . '/' . $userJpa->mailing_sign;
                if (File::exists($oldSignPath)) {
                    File::delete($oldSignPath);
                }
            }

            $userJpa->mailing_sign = null;
            $userJpa->save();

            BusinessSign::where([
                'business_id' => Auth::user()->business_id,
                'user_id' => Auth::user()->id
            ])->delete();
        });

        return response($response->toArray(), $response->status);
    }

    public function setDefaultSign(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $userJpa = User::select()
                ->where('user_id', Auth::id())
                ->where('business_id', Auth::user()->business_id)
                ->first();
            if ($request->type == 'email') {
                $userJpa->mailing_sign = $request->sign;
            } else if ($request->type == 'whatsapp') {
                $userJpa->whatsapp_sign = $request->sign;
            }
            $userJpa->save();
        });
        return response($response->toArray(), $response->status);
    }
}
