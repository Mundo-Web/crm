<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class NotificationController extends BasicController
{
    public $model = Notification::class;

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::with(['creator'])
            ->where(function ($query) {
                $query->where('notify_to', Auth::user()->service_user->id);
                $query->orWhereNull('notify_to');
            })
            ->where('business_id', Auth::user()->business_id)
            ->where('module', '<>', 'Leads')
            ->where('seen', false)
            ->where('status', true);
    }

    public function boolean(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $data = [];
            $data[$request->field] = $request->value;

            if ($request->id) {
                $this->model::where('id', $request->id)
                    ->update($data);
            } else {
                $this->model::where('business_id', Auth::user()->business_id)
                    ->where('notify_to', Auth::user()->service_user->id)
                    ->where('seen', false)
                    ->update($data);
            }
        });
        return response($response->toArray(), $response->status);
    }
}
