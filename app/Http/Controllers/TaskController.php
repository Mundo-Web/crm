<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class TaskController extends BasicController
{
    public $reactView = 'Tasks';
    public $model = Task::class;
    public $filterBusiness = false;
    public $prefix4filter = 'tasks';

    public function setPaginationInstance(string $model)
    {
        return $model::select('tasks.*')
            ->with(['clientNote', 'assigned', 'clientNote', 'clientNote.client'])
            ->join('client_notes AS client_note', 'client_note.id', 'tasks.note_id')
            ->join('clients AS client', 'client.id', 'client_note.client_id')
            ->where('client.business_id', Auth::user()->business_id);
    }

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
