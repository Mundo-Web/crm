<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Jobs\SaveNotification;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\StatusController;
use App\Models\Setting;
use App\Models\Project;
use App\Models\Status as AppStatus;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use SoDe\Extend\JSON;

class ClientNoteController extends BasicController
{
    public $model = ClientNote::class;
    public $softDeletion = false;

    public function byClient(Request $request, $client): HttpResponse|ResponseFactory
    {
        $response =  new dxResponse();
        try {
            $notes = $this->model::with(['type', 'user', 'tasks', 'tasks.assigned', 'status', 'manageStatus'])
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
        \Illuminate\Support\Facades\Log::info('ClientNoteController::afterSave - PROCESANDO', [
            'jpa_id' => $jpa->id,
            'client_id' => $jpa->client_id,
            'has_client_data' => isset($request->client_data),
            'request_status' => $request->status_id,
            'request_manage_status' => $request->manage_status_id
        ]);

        $clientJpa = Client::find($jpa->client_id);
        if ($clientJpa) {
            $shouldSaveClient = false;

            // Actualizar estados si vienen en el request (aunque no se guarden en la nota)
            if ($request->status_id) {
                $clientJpa->status_id = $request->status_id;
                $shouldSaveClient = true;
            }
            if ($request->manage_status_id) {
                $clientJpa->manage_status_id = $request->manage_status_id;
                $shouldSaveClient = true;
            }

            // Si hay datos de conversión a cliente
            if ($request->client_data) {
                $clientData = $request->client_data;
                if (isset($clientData['ruc'])) $clientJpa->ruc = $clientData['ruc'];
                if (isset($clientData['dni']) && !$clientJpa->ruc) $clientJpa->ruc = $clientData['dni'];
                
                if (isset($clientData['tradename'])) {
                    $clientJpa->tradename = $clientData['tradename'];
                    $clientJpa->name = $clientData['tradename'];
                }
                if (isset($clientData['fullname'])) $clientJpa->contact_name = $clientData['fullname'];
                
                $shouldSaveClient = true;
                
                \Illuminate\Support\Facades\Log::info('ClientNoteController::afterSave - Datos de cliente cargados');
            }

            if ($shouldSaveClient) {
                try {
                    $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                    $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                    if ($clientJpa->status_id == ($assignationStatus['lead'] ?? '')) StatusController::updateStatus4Lead($clientJpa, true);
                    if ($clientJpa->status_id == ($revertionStatus['lead'] ?? '')) StatusController::updateStatus4Lead($clientJpa, false);
                    
                    if ($clientJpa->manage_status_id == ($assignationStatus['manage'] ?? '')) StatusController::updateStatus4Lead($clientJpa, true);
                    if ($clientJpa->manage_status_id == ($revertionStatus['manage'] ?? '')) StatusController::updateStatus4Lead($clientJpa, false);
                } catch (\Throwable $th) {
                    \Illuminate\Support\Facades\Log::error('ClientNoteController::afterSave - Error en StatusController: ' . $th->getMessage());
                }

                $clientJpa->save();

                // Lógica de proyectos
                $createProjectExplicitly = $request->client_data && isset($request->client_data['createProject']) && $request->client_data['createProject'];
                $skipProjectExplicitly = $request->client_data && isset($request->client_data['createProject']) && !$request->client_data['createProject'];

                if ($createProjectExplicitly) {
                    \Illuminate\Support\Facades\Log::info('ClientNoteController::afterSave - CREANDO PROYECTO MANUAL');
                    $projectData = $request->client_data['projectData'];
                    $cost = $projectData['cost'] ?? 0;
                    $projectId = Uuid::uuid1()->toString();
                    Project::create([
                        'id' => $projectId,
                        'client_id' => $clientJpa->id,
                        'name' => $projectData['name'],
                        'type_id' => $projectData['type_id'],
                        'description' => 'Proyecto generado al convertir lead desde notas',
                        'cost' => $cost,
                        'remaining_amount' => $cost,
                        'business_id' => $clientJpa->business_id,
                        'starts_at' => $projectData['starts_at'] ?? date('Y-m-d'),
                        'ends_at' => $projectData['ends_at'] ?? date('Y-m-d', strtotime('+1 month')),
                        'signed_at' => $projectData['signed_at'] ?? date('Y-m-d'),
                        'status_id' => Setting::get('default-project-status') ?? AppStatus::where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')->where('business_id', $clientJpa->business_id)->where('status', true)->first()?->id,
                    ]);
                    // Asignar al usuario actual
                    if (Auth::user()->service_user?->id) {
                        DB::table('users_by_projects')->insert([
                            'project_id' => $projectId,
                            'user_id' => Auth::user()->service_user->id
                        ]);
                    }
                } else if (!$skipProjectExplicitly && $clientJpa->status_id == Setting::get('default-client-status')) {
                    \Illuminate\Support\Facades\Log::info('ClientNoteController::afterSave - INTENTANDO CONVERSION AUTOMATICA');
                    $product = $clientJpa->products()->first();
                    if ($product) {
                        $projectExists = Project::where('client_id', $clientJpa->id)->exists();
                        if (!$projectExists) {
                            $cost = $product->pivot->price ?? $product->price ?? 0;
                            $projectId = Uuid::uuid1()->toString();
                            Project::create([
                                'id' => $projectId,
                                'client_id' => $clientJpa->id,
                                'name' => ($product->name ?? 'Servicio') . ' - ' . ($clientJpa->tradename ?: $clientJpa->contact_name),
                                'description' => 'Proyecto generado automáticamente al convertir lead desde notas',
                                'cost' => $cost,
                                'remaining_amount' => $cost,
                                'business_id' => $clientJpa->business_id,
                                'starts_at' => date('Y-m-d'),
                                'ends_at' => date('Y-m-d', strtotime('+1 month')),
                                'signed_at' => date('Y-m-d'),
                                'status_id' => Setting::get('default-project-status') ?? AppStatus::where('table_id', 'cd8bd48f-c73c-4a62-9935-024139f3be5f')->where('business_id', $clientJpa->business_id)->where('status', true)->first()?->id,
                            ]);
                            // Asignar al usuario actual
                            if (Auth::user()->service_user?->id) {
                                DB::table('users_by_projects')->insert([
                                    'project_id' => $projectId,
                                    'user_id' => Auth::user()->service_user->id
                                ]);
                            }
                        }
                    }
                }
            }
        }

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
                        $userJpa = User::find($object['assigned_to']);
                        if ($userJpa) {
                            SaveNotification::dispatchAfterResponse([
                                'icon' => 'fas fa-tag',
                                'name' => Auth::user()->service_user->fullname . ' te ha asignado una tarea',
                                'message' =>  Auth::user()->service_user->fullname . ' te ha asignado una tarea de ' . $jpa->client->contact_name,
                                'module' => 'Anotaciones del cliente',
                                'description' => $object['description'] ?? $object['name'],
                                'link_to' => '/leads/' . $jpa->client->id . '?annotation=' . rawurlencode($jpa->type->name),
                                'created_by' => Auth::user()->service_user->id,
                                'business_id' => Auth::user()->business_id
                            ], $userJpa->relative_id);
                        }
                    } else {
                        $object['assigned_to'] = Auth::user()->service_user->id;
                    }
                }
                Task::create($object);
            }
        }

        $newJpa = ClientNote::where('id', $jpa->id)
            ->with(['type', 'user', 'tasks', 'tasks.assigned', 'status', 'manageStatus'])
            ->first();

        return $newJpa;
    }
}
