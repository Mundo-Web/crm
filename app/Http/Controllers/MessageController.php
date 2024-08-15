<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Message;
use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\Setting;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\File;
use SoDe\Extend\Text;

class MessageController extends BasicController
{
    public $model = Message::class;

    public function byPhone(Request $request, string $sessionId, string $waId)
    {
        $response = dxResponse::simpleTryCatch(function ($response) use ($sessionId, $waId) {
            [, $businessUUID] = \explode('-', $sessionId, 2);
            
            $businessJpa = Business::where('uuid', $businessUUID)->first();
            if (!$businessJpa) throw new Exception('No existe una empresa vinculada a esta sesion');
            
            $businessApiKey = Setting::get('gemini-api-key', $businessJpa->id);
            if (!$businessApiKey) throw new Exception('Esta empresa no tiene integracion con AI');

            $clientExists = Client::where('contact_phone', $waId)->where('business_id', $businessJpa->id)->exists();
            if ($clientExists) throw new Exception('El cliente ya ha sido registrado en Atalaya');

            $messages = Message::select()
                ->where('business_id', $businessJpa->id)
                ->where('wa_id', $waId)
                ->orderBy('created_at', 'DESC')
                ->limit(20)
                ->get();
            $prompt = File::get('../storage/app/utils/gemini-prompt.txt');
            $businessEmail = Setting::get('email-new-lead-notification-message-owneremail', $businessJpa->id);
            $businessServices = Setting::get('gemini-what-business-do', $businessJpa->id);
            $response->summary = [
                'api-key' => $businessApiKey,
                'prompt' => Text::replaceData($prompt, [
                    'nombreEmpresa' => $businessJpa->name,
                    'correoEmpresa' => $businessEmail ?? 'hola@mundoweb.pe',
                    'servicios' => $businessServices ?? 'algunos servicios',
                ])
            ];
            return $messages;
        });
        return response($response->toArray(), $response->status);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        [, $businessUUID] = explode('-', $body['session_id'], 2);
        $businessJpa = Business::where('uuid', $businessUUID)->first();
        if (!$businessJpa) throw new Exception('No existe una empresa vinculada a esta sesion');
        $body['business_id'] = $businessJpa->id;
        return $body;
    }
}
