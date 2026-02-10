<?php

namespace App\Http\Controllers;

use App\Jobs\SaveNotification;
use App\Jobs\SendNewLeadNotification;
use App\Models\Atalaya\Business;
use App\Models\Atalaya\BusinessSign;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\DefaultMessage;
use App\Models\Message;
use App\Models\NoteType;
use App\Models\Process;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Status;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Excel as MaatwebsiteExcel;
use Maatwebsite\Excel\Facades\Excel;
use Ramsey\Uuid\Uuid;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Trace;

use function PHPSTORM_META\map;

class LeadController extends BasicController
{
    public $model = Client::class;
    public $softDeletion = false;
    public $reactView = 'Leads';
    public $prefix4filter = 'clients';

    public function setReactViewProperties(Request $request)
    {
        $statuses = Status::select()
            ->where('table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();
        $defaultClientStatus = Setting::get('default-client-status');
        $defaultLeadStatus = Setting::get('default-lead-status');
        $convertedLeadStatus = Setting::get('converted-lead-status');

        $noteTypes = NoteType::all();

        $manageStatuses = Status::select()
            ->where('table_id', '9c27e649-574a-47eb-82af-851c5d425434')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $products = Product::with('type')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $processes = Process::where('business_id', Auth::user()->business_id)->get();

        $defaultMessages = DefaultMessage::with(['attachments'])
            ->where('business_id', Auth::user()->business_id)
            ->where('user_id', Auth::id())
            ->get();

        $signs = BusinessSign::select()
            ->where('business_id', Auth::user()->business_id)
            ->where('user_id', Auth::id())
            ->get();

        $usersJpa = User::byBusiness();

        $question = Setting::get('gemini-extra-questions');

        $hasForms = false;
        if ($question && is_string($question)) {
            $decoded = json_decode($question, true);
            if (is_array($decoded)) {
                foreach ($decoded as $form) {
                    if (isset($form['questions']) && is_array($form['questions']) && count($form['questions']) > 0) {
                        $hasForms = true;
                        break;
                    }
                }
            }
        }

        return [
            'lead' => $request->lead,
            'manageStatuses' => $manageStatuses,
            'defaultClientStatus' => $defaultClientStatus,
            'defaultLeadStatus' => $defaultLeadStatus,
            'convertedLeadStatus' => $convertedLeadStatus,
            'statuses' => $statuses,
            'noteTypes' => $noteTypes,
            'products' => $products,
            'processes' => $processes,
            'defaultMessages' => $defaultMessages,
            'signs' => $signs,
            'users' => $usersJpa,
            'hasForms' => $hasForms,
        ];
    }

    public function get(Request $request, string $lead)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($lead) {
            $data = $this->model::select('clients.*')
                ->withCount(['notes', 'tasks', 'pendingTasks', 'products'])
                ->with(['status', 'assigned', 'manageStatus', 'creator'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
                ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.id', $lead)
                ->first();
            $response->data = $data;
        });
        return response($response->toArray(), $response->status);
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $suffix = $request->suffix;
        $defaultLeadStatus = Setting::get('default-lead-status');
        $query = $model::select($request->fields ?? 'clients.*')
            ->withCount($request->withCount ?? ['notes', 'tasks', 'pendingTasks', 'products'])
            ->with($request->with ?? ['status', 'assigned', 'manageStatus', 'creator', 'integration', 'campaign'])
            ->join('statuses AS status', 'status.id', 'status_id')
            ->leftJoin('statuses AS manage_status', 'manage_status.id', 'manage_status_id')
            ->leftJoin('users AS assigned', 'assigned.id', 'clients.assigned_to')
            ->leftJoin('campaigns AS campaign', 'campaign.id', 'clients.campaign_id')
            ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->where('clients.status', true)
            ->where('clients.business_id', Auth::user()->business_id);

        if ($suffix == 'served') $query = $query->where('clients.status_id', '<>', $defaultLeadStatus);
        if ($suffix == 'new' || $suffix == 'incomplete') {
            $query = $query->where('clients.status_id', $defaultLeadStatus);
            $question = Setting::get('gemini-extra-questions');

            $hasForms = false;
            if ($question && is_string($question)) {
                $decoded = json_decode($question, true);
                if (is_array($decoded)) {
                    foreach ($decoded as $form) {
                        if (isset($form['questions']) && is_array($form['questions']) && count($form['questions']) > 0) {
                            $hasForms = true;
                            break;
                        }
                    }
                }
            }

            if ($suffix == 'new' && $hasForms) {
                $query = $query->where('clients.complete_registration', true);
            }
            if ($suffix == 'incomplete') {
                $query = $query->where('clients.complete_registration', false);
            }
        }

        return $query;
    }

    public function import(Request $request)
    {
        DB::beginTransaction();
        $response = Response::simpleTryCatch(function () use ($request) {
            $file = $request->file('file');
            $mapping = json_decode($request->mapping, true);

            $readerType = MaatwebsiteExcel::XLSX;
            $extension = strtolower($file->getClientOriginalExtension());
            if ($extension === 'xls') {
                $readerType = MaatwebsiteExcel::XLS;
            } elseif ($extension === 'csv') {
                $readerType = MaatwebsiteExcel::CSV;
            }

            $rows = Excel::toArray([], $file->getRealPath(), null, $readerType)[0];

            // Extract headers
            $headers = array_shift($rows);

            // Build objects with headers as keys
            $cleanRows = [];
            foreach ($rows as $row) {
                $rowData = [];
                foreach ($headers as $index => $header) {
                    $rowData[$header] = $row[$index] ?? null;
                }

                // Check if row has any non-empty value
                if (collect($rowData)->filter(fn($v) => trim($v) !== '')->isNotEmpty()) {
                    $cleanRows[] = $rowData;
                }
            }

            $business_id = Auth::user()->business_id;
            // Map rows to desired format using mapping
            $mappedRows = [];
            foreach ($cleanRows as $row) {
                $phone = Text::keep($row[$mapping['phone']], '0123456789');
                if (strlen($phone) === 9 && str_starts_with($phone, '9')) {
                    $phone = '51' . $phone;
                }
                $mappingDate = Carbon::parse($row[$mapping['date']]);
                $mapped = [
                    'id'     => Uuid::uuid1()->toString(),
                    'business_id' => $business_id,
                    'name' => $row[$mapping['name']] ?? null,
                    'contact_name'   => $row[$mapping['name']] ?? null,
                    'contact_email'  => $row[$mapping['email']] ?? null,
                    'contact_phone' => $phone ?: null,
                    'source' => $mapping['source'],
                    'origin' => $mapping['source'],
                    'triggered_by' => $mapping['triggered_by'] ?? 'Importación',
                    'status_id' => Setting::get('default-lead-status'),
                    'manage_status_id' => Setting::get('default-manage-lead-status'),
                    'form_answers'   => [
                        [
                            'title'     => 'Formulario de meta',
                            'completed' => true,
                            'questions' => []
                        ]
                    ],
                    'complete_form' => true,
                    'message' => 'Sin mensaje',
                    'ip' => $request->ip(),
                    'date' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? $mappingDate->format('Y-m-d')
                        : now()->subHours(5)->format('Y-m-d'),
                    'time' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? ($mappingDate->format('H:i:s') !== '00:00:00'
                            ? $mappingDate->format('H:i:s')
                            : '12:00:00')
                        : now()->subHours(5)->format('H:i:s'),
                    'created_at' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? $mappingDate
                        : now(),
                    'updated_at' => isset($mapping['date']) && !empty($row[$mapping['date']])
                        ? $mappingDate
                        : now(),
                ];

                // Build form answers array
                foreach ($mapping['form'] as $question) {
                    $mapped['form_answers'][0]['questions'][] = [
                        'text'    => $question,
                        'answer'  => $row[$question] ?? null,
                    ];
                }
                $mapped['form_answers'] = JSON::stringify($mapped['form_answers']);
                $mappedRows[] = $mapped;
            }

            // Check existing records by email or phone to avoid duplicates
            $existing = Client::where('business_id', Auth::user()->business_id)
                ->where(function ($q) use ($mappedRows) {
                    $q->whereIn('contact_email', array_column($mappedRows, 'contact_email'))
                        ->orWhereIn('contact_phone', array_column($mappedRows, 'contact_phone'));
                })
                ->get(['contact_email', 'contact_phone']);

            $existingEmails = $existing->pluck('contact_email')->toArray();
            $existingPhones = $existing->pluck('contact_phone')->toArray();

            // Filter out rows that already exist by email or phone
            $rowsToInsert = array_filter($mappedRows, function ($row) use ($existingEmails, $existingPhones) {
                return !in_array($row['contact_email'], $existingEmails) && !in_array($row['contact_phone'], $existingPhones);
            });

            // Bulk insert only the new rows
            if (!empty($rowsToInsert)) {
                Client::insert(array_values($rowsToInsert));

                // Build ClientNote records for the newly inserted leads
                $notesToInsert = [];
                foreach ($rowsToInsert as $row) {
                    $formString = '';
                    $forms = JSON::parse((string) $row['form_answers']);
                    foreach ($forms as $form) {
                        $formString .= "<b>{$form['title']}</b><br>";
                        foreach ($form['questions'] as $index => $question) {
                            $formString .= ($index + 1) . ". {$question['text']}<br>&emsp;{$question['answer']}<br>";
                        }
                        $formString .= '<br>';
                    }
                    $notesToInsert[] = [
                        'id' => Uuid::uuid1()->toString(),
                        'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
                        'client_id' => $row['id'],
                        'name' => 'Formulario ' . $row['source'],
                        'description' => $formString,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                if (!empty($notesToInsert)) {
                    ClientNote::insert($notesToInsert);
                }
            }
            DB::commit();
        }, fn() =>       DB::rollBack());

        return response($response->toArray(), $response->status);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $exists = Client::query()
            ->where('business_id', Auth::user()->business_id)
            ->where('id', $request->id)->exists();
        if (!$exists) {
            $status = Setting::get('default-lead-status');
            $manage_status = Setting::get('default-manage-lead-status');
            $body['status_id'] = $status;
            $body['manage_status_id'] = $manage_status;
        }
        $body['created_by'] = Auth::user()->service_user->id;
        $body['source'] = env('APP_NAME');
        $body['origin'] = env('APP_NAME');
        $body['triggered_by'] = 'Formulario';
        $body['date'] = Trace::getDate('date');
        $body['time'] = Trace::getDate('time');
        $body['ip'] = $request->ip();
        $body['complete_registration'] = true;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if (!$isNew) {
            ClientNote::create([
                'client_id' => $jpa->id,
                'name' => Auth::user()->name . ' actualizo datos del lead',
            ]);
            $newJpa = Client::with(['status', 'assigned', 'manageStatus', 'creator'])
                ->where('id', $jpa->id)
                ->first();
            return $newJpa;
        }
        $noteJpa = ClientNote::create([
            'note_type_id' => '8e895346-3d87-4a87-897a-4192b917c211',
            'client_id' => $jpa->id,
            'name' => 'Lead nuevo',
            'description' => UtilController::replaceData(
                Setting::get('whatsapp-new-lead-notification-message', $jpa->business_id),
                $jpa->toArray()
            )
        ]);

        Task::create([
            'model_id' => ClientNote::class,
            'note_id' => $noteJpa->id,
            'name' => 'Revisar lead',
            'description' => 'Debes revisar los requerimientos del lead',
            'ends_at' => Carbon::now()->addDay()->format('Y-m-d H:i:s'),
            'status' => 'Pendiente',
            'asignable' => true
        ]);

        // if ($jpa->created_by) {
        //     SaveNotification::dispatchAfterResponse([
        //         'name' => 'Nuevo lead',
        //         'message' =>  Auth::user()->service_user->fullname . ' ha creado un nuevo lead.',
        //         'module' => 'Leads',
        //         'link_to' => '/leads/' . $jpa->id,
        //         'created_by' => Auth::user()->service_user->id,
        //         'business_id' => $jpa->business_id
        //     ]);
        // } else {
        //     SaveNotification::dispatchAfterResponse([
        //         'icon' => 'fas fa-user-plus',
        //         'name' => 'Nuevo lead',
        //         'message' =>  'Se ha registrado un nuevo lead desde ' . $jpa->origin,
        //         'module' => 'Leads',
        //         'link_to' => '/leads/' . $jpa->id,
        //         'business_id' => $jpa->business_id
        //     ]);
        // }

        $newJpa = Client::with(['status', 'assigned', 'manageStatus', 'creator'])
            ->where('id', $jpa->id)
            ->first();

        return $newJpa;
    }

    public function all(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $clients = Client::select('clients.*')
                ->withCount(['notes', 'tasks', 'pendingTasks'])
                ->with(['status', 'assigned', 'manageStatus'])
                ->join('statuses AS status', 'status.id', 'status_id')
                ->where('status.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
                ->where('clients.business_id', Auth::user()->business_id)
                ->where('clients.status', true)
                ->get();
            $response->data = $clients;
        });
        return response($response->toArray(), $response->status);
    }

    public function byStatus(Request $request, string $status)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request, $status) {
            $clients = Client::withCount('notes')
                ->where('status_id', $status)
                ->where('business_id', Auth::user()->business_id)
                ->get();
            $response->data = $clients;
        });
        return response($response->toArray(), $response->status);
    }

    public function leadStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            $leadJpa->status_id = $request->status;

            if ($request->ruc) $leadJpa->ruc = $request->ruc;
            if ($request->tradename) $leadJpa->tradename = $request->tradename;

            try {
                $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                if ($leadJpa->status_id == ($assignationStatus['lead'] ?? '')) StatusController::updateStatus4Lead($leadJpa, true);
                if ($leadJpa->status_id == ($revertionStatus['lead'] ?? '')) StatusController::updateStatus4Lead($leadJpa, false);
            } catch (\Throwable $th) {
            }

            $leadJpa->save();
            return $leadJpa->load(['status', 'assigned', 'manageStatus', 'creator']);
        });
        return response($response->toArray(), $response->status);
    }

    public function manageStatus(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            $leadJpa->manage_status_id = $request->status;

            try {
                $assignationStatus = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $revertionStatus = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');

                if ($leadJpa->manage_status_id == ($assignationStatus['manage'] ?? '')) StatusController::updateStatus4Lead($leadJpa, true);
                if ($leadJpa->manage_status_id == ($revertionStatus['manage'] ?? '')) StatusController::updateStatus4Lead($leadJpa, false);
            } catch (\Throwable $th) {
            }

            $leadJpa->save();
            return $leadJpa->load(['status', 'assigned', 'manageStatus', 'creator']);
        });
        return response($response->toArray(), $response->status);
    }

    public function massiveAssign(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadsIds = $request->leadsId;
            $userId = $request->userId;

            foreach ($leadsIds as $leadId) {
                $leadJpa = Client::find($leadId);
                if ($leadJpa->business_id != Auth::user()->business_id) {
                    throw new Exception('Uno o más leads no pertenecen a tu empresa');
                }
                // Update lead status using StatusController
                StatusController::updateStatus4Lead($leadJpa, $userId ? true : false, $userId);
                $leadJpa->save();
            }

            $userName = Auth::user()->name;
            $leadsCount = count($leadsIds);
            EventController::notify('notification', "{$userName} te ha asignado {$leadsCount} leads nuevos", [
                'business_id' => Auth::user()->business_id,
                'user_id' => $userId
            ]);

            $response->message = 'Leads asignados exitosamente';
        });
        return response($response->toArray(), $response->status);
    }

    public function attend(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {
            $leadJpa = Client::find($request->lead);
            if ($leadJpa->business_id != Auth::user()->business_id) throw new Exception('Este lead no pertenece a tu empresa');
            $leadJpa->complete_registration = true;
            if ($leadJpa->form_answers) $leadJpa->complete_form = true;
            StatusController::updateStatus4Lead($leadJpa, $request->method() != 'DELETE');

            $leadJpa->save();
        });
        return response($response->toArray(), $response->status);
    }

    public function external(Request $request)
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($request) {

            $authorizationHeader = $request->header('Authorization');

            if (Text::nullOrEmpty($authorizationHeader)) {
                throw new Exception("Debe enviar los parámetros de autenticación 'Authorization'");
            }

            if (!Text::startsWith($authorizationHeader, 'Bearer ')) {
                throw new Exception("El token de autorización debe ser de tipo Bearer");
            }

            $uuid = \str_replace('Bearer ', '', $authorizationHeader);
            $uuid = \str_replace('bearer ', '', $uuid);
            $uuid = \str_replace('atalaya-', '', $uuid);

            $businessJpa = Business::select('id')->where('uuid', $uuid)->first();
            if (!$businessJpa) {
                throw new Exception("Empresa no encontrada para el token proporcionado");
            }

            $messages = [
                'contact_name.required' => 'El nombre de contacto es obligatorio.',
                'contact_phone.required' => 'El teléfono de contacto es obligatorio.',
                'contact_phone.max' => 'El teléfono de contacto no debe exceder los 15 caracteres.',
                'contact_email.required' => 'El correo electrónico es obligatorio.',
                'contact_email.email' => 'El correo electrónico debe tener el formato user@domain.com.',
                'contact_email.max' => 'El correo electrónico no debe exceder los 320 caracteres.',
                'contact_position.string' => 'La posición de contacto debe ser una cadena de texto.',
                // 'tradename.required' => 'El nombre comercial es obligatorio.',
                // 'tradename.string' => 'El nombre comercial debe ser una cadena de texto.',
                'message.required' => 'El mensaje es obligatorio.',
                'message.string' => 'El mensaje debe ser una cadena de texto.',
                'origin.required' => 'El origen es obligatorio.',
                'origin.string' => 'El origen debe ser una cadena de texto.'
            ];

            $validatedData = $request->validate([
                'contact_name' => 'required|string',
                'contact_phone' => 'required|max:15',
                'contact_email' => 'required|email|max:320',
                'contact_position' => 'nullable|string',
                // 'tradename' => 'required|string',
                'workers' => 'nullable|string',
                'source' => 'nullable|string',
                'message' => 'required|string',
                'origin' => 'required|string',
                'triggered_by' => 'nullable|string'
            ], $messages);

            $validatedData['business_id'] = $businessJpa->id;
            $validatedData['name'] = $validatedData['contact_name'];
            $validatedData['source'] = $validatedData['source'] ?? 'Externo';
            $validatedData['date'] = Trace::getDate('date');
            $validatedData['time'] = Trace::getDate('time');
            $validatedData['ip'] = $request->ip();
            $validatedData['status_id'] = Setting::get('default-lead-status', $businessJpa->id);
            $validatedData['manage_status_id'] = Setting::get('default-manage-lead-status', $businessJpa->id);
            $validatedData['complete_registration'] = true;

            if ($validatedData['origin'] == 'WhatsApp') {
                $leadJpa = Client::updateOrCreate([
                    'contact_phone' => $validatedData['contact_phone'],
                    'complete_registration' => false,
                    'status' => true
                ], $validatedData);
            } else {
                $leadJpa = Client::create($validatedData);
            }

            $this->afterSave($request, $leadJpa, true);

            SendNewLeadNotification::dispatchAfterResponse($leadJpa, $businessJpa);

            $response->message = 'Se ha creado el lead correctamente';
        });
        return response($response->toArray(), $response->status);
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $leadJpa = Client::find($id);
            $deleted = $this->softDeletion
                ? $this->model::where('id', $id)
                ->update(['status' => null])
                : $this->model::where('id', $id)
                ->delete();

            if (!$deleted) throw new Exception('No se ha eliminado ningun registro');

            try {
                if ($leadJpa->integration_id) {
                    Message::where('business_id', Auth::user()->business_id)
                        ->where('wa_id', $leadJpa->integration_user_id)->delete();
                } else {
                    Message::where('business_id', Auth::user()->business_id)
                        ->where('wa_id', $leadJpa->contact_phone)->delete();
                }
            } catch (\Throwable $th) {
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
}
