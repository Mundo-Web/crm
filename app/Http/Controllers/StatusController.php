<?php

namespace App\Http\Controllers;

use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StatusController extends BasicController
{
    public $model = Status::class;
    public $softDeletion = true;
    public $reactView = 'Statuses';
    public $prefix4filter = 'statuses';

    public function setPaginationInstance(string $model)
    {
        return $model::select([
            'statuses.*'
        ])
            ->with(['table'])
            ->join('tables AS table', 'table.id', 'table_id');
    }
}
