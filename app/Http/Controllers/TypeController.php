<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\dxDataGrid;
use App\Models\Type;
use App\Models\TypeView;
use Exception;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class TypeController extends BasicController
{
    public $model = Type::class;
    public $reactView = 'Types';

    public function setPaginationInstance(string $model)
    {
        return $model::with('table');
    }
}
