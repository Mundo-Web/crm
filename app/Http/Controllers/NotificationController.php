<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Http\Requests\StoreNotificationRequest;
use App\Http\Requests\UpdateNotificationRequest;
use Illuminate\Support\Facades\Auth;

class NotificationController extends BasicController
{
    public $model = Notification::class;

    public function setPaginationInstance(string $model)
    {
        return $model::with(['creator'])
            ->where(function ($query) {
                $query->where('notify_to', Auth::user()->service_user->id);
                $query->orWhereNull('notify_to');
            })
            ->where('business_id', Auth::user()->business_id)
            ->where('module', '<>', 'Leads');
    }
}
