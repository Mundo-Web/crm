<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;

class PaymentController extends BasicController
{
    public $model = Payment::class;
    public $softDeletion = false;

    public function byProject(Request $request, $project): HttpResponse|ResponseFactory
    {
        $response =  new dxResponse();
        try {
            $payments = Payment::select()
                ->where('project_id', $project)
                ->get();

            $response->status = 200;
            $response->message = 'Operación correcta';
            $response->data = $payments;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response(
                $response->toArray(),
                $response->status
            );
        }
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $body['user_id'] = Auth::user()->service_user->id;
        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        Project::regularizeRemaining($jpa->project_id);
    }
}
