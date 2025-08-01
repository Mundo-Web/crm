<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientNote;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\Status;
use App\Models\Table;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\JSON;
use SoDe\Extend\Text;

class StatusController extends BasicController
{
    public $model = Status::class;
    public $softDeletion = true;
    public $reactView = 'Statuses';
    public $prefix4filter = 'statuses';

    public function setReactViewProperties(Request $request)
    {
        $statuses = Status::with(['table'])
            ->where('business_id', Auth::user()->business_id)
            ->whereNotNull('status')
            ->get();
        $tables = Table::where('configurable', true)->get();
        return [
            'statuses' => $statuses,
            'tables' => $tables,
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::select([
            'statuses.*'
        ])
            ->with(['table'])
            ->join('tables AS table', 'table.id', 'table_id');
    }

    static function updateStatus4Lead(Client $leadJpa, bool $assign, ?string $assignedTo = null)
    {
        try {
            $status = [];
            if ($assign) {
                $status = JSON::parse(Setting::get('assignation-lead-status') ?? '{}');
                $leadJpa->assigned_to = $assignedTo ? $assignedTo : Auth::user()->service_user->id;
            } else {
                $status = JSON::parse(Setting::get('revertion-lead-status') ?? '{}');
                $leadJpa->assigned_to = null;
            }
            if (!Text::nullOrEmpty($status['lead'] ?? '')) $leadJpa->status_id = $status['lead'];
            if (!Text::nullOrEmpty($status['manage'] ?? '')) $leadJpa->manage_status_id = $status['manage'];
            if (!Text::nullOrEmpty($status['task'] ?? '')) Task::join('client_notes AS cn', 'cn.id', 'tasks.note_id')
                ->join('clients AS c', 'c.id', 'cn.client_id')
                ->where('model_id', ClientNote::class)
                ->where('c.business_id', Auth::user()->business_id)
                ->where('c.id', $leadJpa->id)
                ->where('tasks.asignable', true)
                ->update([
                    'tasks.status' => $status['task']
                ]);

            if ($assignedTo) {
                Notification::create([
                    'name' => 'Te asignaron un lead',
                    'message' => Auth::user()->name . ' te ha asignado un lead.',
                    'description' => 'Clic aquí para ver los datos de ' . $leadJpa->contact_name,
                    'icon' => 'mdi mdi-account',
                    'module' => 'Assigned',
                    'link_to' => '/leads/' . $leadJpa->id,
                    'created_by' => Auth::user()->service_user->id,
                    'notify_to' => $assignedTo,
                    'business_id' => Auth::user()->business_id
                ]);
            }
        } catch (\Throwable $th) {
        }
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $jpa->table = $jpa->table()->first();
        return $jpa;
    }
}
