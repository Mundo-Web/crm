<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RemainingHistoryController;
use Illuminate\Support\Facades\Route;

Route::get('/remainings-history', [RemainingHistoryController::class, 'set']);
Route::post('/clients', [ClientController::class, 'save']);
Route::post('/leads', [LeadController::class, 'external']);

Route::post('/messages/{session_id}', [MessageController::class, 'byPhone']);
Route::post('/messages', [MessageController::class, 'save']);
Route::post('/messages/help', [MessageController::class, 'help']);
