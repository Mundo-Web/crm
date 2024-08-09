<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\dxDataGrid;
use App\Models\Setting;
use App\Models\Status;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class SettingController extends BasicController
{
    public $model = Setting::class;
    public $reactView = 'Settings';

    public function setReactViewProperties(Request $request)
    {
        $constants = $this->model::select()
            ->where('business_id', Auth::user()->business_id)
            ->get();
        $statuses = Status::where('business_id', Auth::user()->business_id)->get();
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
