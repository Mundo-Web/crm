<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Jobs\SaveNotification;
use App\Models\ClientNote;
use App\Models\Task;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\JSON;

class ClientNoteController extends BasicController
{
    public $model = ClientNote::class;
    public $softDeletion = false;

    public function byClient(Request $request, $client): HttpResponse|ResponseFactory
    {
        $response =  new dxResponse();
        try {
            $notes = $this->model::with(['type', 'user', 'tasks', 'tasks.assigned'])
                ->where('client_id', $client)
                ->get();

            $results = [];

            foreach ($notes as $note) {
                $result = JSON::unflatten($note->toArray(), '__');
                $results[] = $result;
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

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $body['user_id'] = Auth::user()->service_user->id;
        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $mentions = $request->mentions;
        $tasks = $request->tasks;

        if (\count($mentions ?? []) > 0) {
            foreach ($mentions as $mention) {
                SaveNotification::dispatchAfterResponse([
                    'icon' => 'fas fa-at',
                    'name' => Auth::user()->service_user->fullname . ' te ha etiquetado',
                    'message' =>  Auth::user()->service_user->fullname . ' te ha etiquetado en ' . $jpa->type->name . ' de ' . $jpa->client->contact_name,
                    'module' => 'Anotaciones del cliente',
                    'description' => $request->raw ?? null,
                    'link_to' => '/leads/' . $jpa->client->id . '?annotation=' . rawurlencode($jpa->type->name),
                    'created_by' => Auth::user()->service_user->id,
                    'business_id' => Auth::user()->business_id
                ], $mention);
            }
        }

        Task::where('note_id', $jpa->id)->delete();
        if (\count($tasks ?? []) > 0) {
            foreach ($tasks as $task) {
                $object = [
                    'model_id' => ClientNote::class,
                    'note_id' => $jpa->id,
                    'type' => $task['type'],
                    'priority' => $task['priority'],
                    'name' => $task['name'],
                    'description' => $task['description'] ?? null,
                    'ends_at' => $task['ends_at'],
                    'assigned_to' => $task['assigned_to']
                ];
                if (Auth::check()) {
                    if ($object['assigned_to']) {
                        SaveNotification::dispatchAfterResponse([
                            'icon' => 'fas fa-tag',
                            'name' => Auth::user()->service_user->fullname . ' te ha asignado una tarea',
                            'message' =>  Auth::user()->service_user->fullname . ' te ha asignado una tarea de ' . $jpa->client->contact_name,
                            'module' => 'Anotaciones del cliente',
                            'description' => $object['description'] ?? $object['name'],
                            'link_to' => '/leads/' . $jpa->client->id . '?annotation=' . rawurlencode($jpa->type->name),
                            'created_by' => Auth::user()->service_user->id,
                            'business_id' => Auth::user()->business_id
                        ], $object['assigned_to']);
                    } else {
                        $object['assigned_to'] = Auth::user()->service_user->id;
                    }
                }
                Task::create($object);
            }
        }

        $newJpa = ClientNote::where('id', $jpa->id)->with(['type', 'user', 'tasks', 'tasks.assigned'])->first();

        // $jpa->type = $jpa->type()->first();
        // $jpa->user = $jpa->user()->first();
        // $jpa->tasks = $jpa->tasks()->get();
        // $jpa->tasks->assigned = $jpa->tasks()->assigned()->first();
        return $newJpa;
    }
}
