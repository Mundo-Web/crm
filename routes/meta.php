<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\WebhookController;

/*
|--------------------------------------------------------------------------
| Meta Integration Routes
|--------------------------------------------------------------------------
|
| Aquí se registran las rutas para la integración con Facebook Meta,
| específicamente para gestionar los webhooks de Messenger e Instagram.
| Estas rutas manejan la verificación y recepción de eventos de las
| plataformas de Meta.
|
*/

Route::get('/{origin}/{business_uuid}', [MetaController::class, 'verify']);
Route::post('/{origin}/{business_uuid}', [MetaController::class, 'webhook']);

Route::post('/evoapi/{business_uuid}', [WebhookController::class, 'webhook']);