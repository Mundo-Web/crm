<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class TaskController extends BasicController
{
    public $model = Task::class;
    public function status(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $taskJpa = $this->model::find($request->id);
            $taskJpa->status = $request->status;
            $taskJpa->save();

            if ($taskJpa->asignable && $taskJpa->status != 'Pendiente') {
                Client::where('id', $taskJpa->clientNote->client->id)
                    ->where('business_id', Auth::user()->business_id)
                    ->update([
                        'assigned_to' => Auth::user()->service_user->id
                    ]);
            }
            $response->data = [
                'refresh' => true
            ];
        });

        return response($response->toArray(), $response->status);
    }
}
