<?php

namespace App\Http\Controllers;

use App\Models\View;
use App\Http\Requests\StoreViewRequest;
use App\Http\Requests\UpdateViewRequest;
use App\Models\Status;
use App\Models\StatusesByView;
use App\Models\StatusView;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ViewController extends BasicController
{
    public $model = View::class;
    public $softDeletion = false;
    public $reactView = 'Views';

    public function setReactViewProperties(Request $request)
    {
        $tablesJpa = Table::where('configurable', true)->get();
        $viewsJpa = View::with('statuses')
            ->where('business_id', Auth::user()->business_id)
            // ->where('status', true)
            ->get();
        $statusesJpa = Status::with('table')
            ->where('business_id', Auth::user()->business_id)
            ->get();

        return [
            'tables' => $tablesJpa,
            'views' => $viewsJpa,
            'statuses' => $statusesJpa
        ];
    }
    
    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $statuses = $request->statuses;
        foreach ($statuses as $status) {
            StatusesByView::updateOrCreate([
                'status_id' => $status,
                'view_id' => $jpa->id
            ], [
                'status_id' => $status,
                'view_id' => $jpa->id
            ]);
        }
    }
}
