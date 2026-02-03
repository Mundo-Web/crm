<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingController extends BasicController
{
    public $model = Setting::class;
    public $reactView = 'Settings';

    public function setReactViewProperties(Request $request)
    {
        $constants = $this->model::select()
            ->where('business_id', Auth::user()->business_id)
            ->get();
        $statuses = Status::where('business_id', Auth::user()->business_id)
            ->where('status', true)
            ->get();
        return [
            'constants' => $constants,
            'statuses' => $statuses
        ];
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $settingJpa = Setting::select()
            ->where('name', $body['name'])
            ->where('business_id', Auth::user()->business_id)
            ->first();
        if (!$settingJpa) {
            unset($body['id']);
        } else {
            $body['id'] = $settingJpa->id;
        }
        $body['updated_by'] = Auth::user()->service_user->id;
        return $body;
    }
}
