<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class KPIProjectsController extends BasicController
{
    public $reactView = 'KPIProjects';

    public function setReactViewProperties(Request $request)
    {
        $finishedProjectStatus = Setting::get('finished-project-status');
        return [
            'finishedProjectStatus' => $finishedProjectStatus,
        ];
    }
}
