<?php

namespace App\Http\Controllers;

use App\Models\Project;

class TaskboardController extends BasicController
{
    public $model = Project::class;
    public $reactView = 'Taskboard';
}
