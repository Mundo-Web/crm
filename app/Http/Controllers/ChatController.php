<?php

namespace App\Http\Controllers;

use App\Models\DefaultMessage;
use App\Models\Message;
use App\Models\User;
use App\Models\Status;
use App\Models\NoteType;
use App\Models\Process;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends BasicController
{
    public $model = Message::class;
    public $reactView = 'Chat';

    public function setReactViewProperties(Request $request)
    {
        $usersJpa = User::byBusiness();
        $defaultMessagesJpa = DefaultMessage::with(['attachments'])
            ->where('business_id', Auth::user()->business_id)
            ->where('type', 'whatsapp')
            ->get();

        $statuses = Status::select()
            ->whereIn('table_id', ['e05a43e5-b3a6-46ce-8d1f-381a73498f33', 'a8367789-666e-4929-aacb-7cbc2fbf74de'])
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $manageStatuses = Status::select()
            ->where('table_id', '9c27e649-574a-47eb-82af-851c5d425434')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $chatStatuses = Status::select()
            ->where('table_id', '584dfcba-4b2a-464a-9721-3dfc82bf83f2')
            ->where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();

        $noteTypes = NoteType::all();

        $processes = Process::where('business_id', Auth::user()->business_id)->get();

        return [
            'activeLeadId' => $request->lead,
            'users' => $usersJpa,
            'defaultMessages' => $defaultMessagesJpa,
            'statuses' => $statuses,
            'manageStatuses' => $manageStatuses,
            'chatStatuses' => $chatStatuses,
            'noteTypes' => $noteTypes,
            'processes' => $processes,
            'session' => Auth::user()
        ];
    }
}
