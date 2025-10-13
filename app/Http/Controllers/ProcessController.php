<?php

namespace App\Http\Controllers;

use App\Models\Process;

class ProcessController extends BasicController
{
    public $model = Process::class;
    public $reactView = 'Processes';
    public $softDeletion = false;
}
