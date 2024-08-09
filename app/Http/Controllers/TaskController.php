<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
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

            if ($taskJpa->asignable) {
                $leadJpa = $taskJpa->clientNote->client;

                if ($taskJpa->status != 'Pendiente') {
                    StatusController::updateStatus4Lead($leadJpa, true);
                } else {
                    StatusController::updateStatus4Lead($leadJpa, false);
                }

                $leadJpa->save();
            }
            $response->data = [
                'refresh' => true
            ];
        });

        return response($response->toArray(), $response->status);
    }
}
