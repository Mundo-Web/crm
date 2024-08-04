<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use Illuminate\Http\Request;
use SoDe\Extend\Response;

class TaskController extends BasicController
{
    public $model = Task::class;
    public function status(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $this->model::where('id', $request->id)
                ->update([
                    'status' => $request->status
                ]);
        });

        return response($response->toArray(), $response->status);
    }
}
