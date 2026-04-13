<?php

namespace App\Http\Controllers;

use App\Models\BusinessSector;
use Illuminate\Http\Request;

class BusinessSectorController extends BasicController
{
    public $model = BusinessSector::class;
    public $reactView = 'BusinessSectors';

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::where('business_id', auth()->user()->business_id);
    }
}
