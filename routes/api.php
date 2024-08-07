<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientNoteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandingFormController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RemainingHistoryController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserByProjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UtilController;
use App\Http\Controllers\ViewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [AuthController::class, 'login']);
Route::get('/start/{uuid}', [UtilController::class, 'start']);

Route::middleware('auth')->group(function () {
    Route::delete('/logout', [AuthController::class, 'destroy'])
        ->name('logout');
    Route::get('/authorize/{business}', [AuthController::class, 'activeService']);

    Route::get('/dashboard/{range}', [DashboardController::class, 'revenue']);

    // Users routes
    Route::post('/users', [UserController::class, 'save']);
    Route::post('/users/paginate', [UserController::class, 'paginate']);
    Route::patch('/users/status', [UserController::class, 'status']);
    Route::delete('/users/{id}', [UserController::class, 'delete']);
    Route::post('/users/assign-role', [UserController::class, 'assignRole']);

    // Users routes
    Route::get('/roles/user/{id}', [RoleController::class, 'byUser']);
    Route::post('/roles', [RoleController::class, 'save']);
    Route::post('/roles/paginate', [RoleController::class, 'paginate']);
    Route::patch('/roles/status', [RoleController::class, 'status']);
    Route::delete('/roles/{id}', [RoleController::class, 'delete']);

    // Users routes
    Route::post('/permissions', [PermissionController::class, 'save']);
    Route::post('/permissions/paginate', [PermissionController::class, 'paginate']);
    Route::get('/permissions/role/{id}', [PermissionController::class, 'byRole']);
    Route::patch('/permissions/role', [PermissionController::class, 'massiveByRole']);
    Route::patch('/permissions/status', [PermissionController::class, 'status']);
    Route::delete('/permissions/{id}', [PermissionController::class, 'delete']);

    // Clients routes
    Route::post('/clients', [ClientController::class, 'save']);
    Route::put('/clients/assign', [ClientController::class, 'assign']);
    Route::delete('/clients/assign', [ClientController::class, 'assign']);
    Route::post('/clients/paginate', [ClientController::class, 'paginate']);
    Route::patch('/clients/status', [ClientController::class, 'status']);
    Route::patch('/clients/client-status', [ClientController::class, 'clientStatus']);
    Route::delete('/clients/{id}', [ClientController::class, 'delete']);

    // ClientNotes routes
    Route::post('/client-notes', [ClientNoteController::class, 'save']);
    Route::post('/client-notes/paginate', [ClientNoteController::class, 'paginate']);
    Route::get('/client-notes/client/{id}', [ClientNoteController::class, 'byClient']);
    Route::patch('/client-notes/status', [ClientNoteController::class, 'status']);
    Route::delete('/client-notes/{id}', [ClientNoteController::class, 'delete']);

    // Types routes
    Route::post('/types', [TypeController::class, 'save']);
    Route::post('/types/paginate', [TypeController::class, 'paginate']);
    Route::patch('/types/status', [TypeController::class, 'status']);
    Route::delete('/types/{id}', [TypeController::class, 'delete']);

    // Statuses routes
    Route::post('/statuses', [StatusController::class, 'save']);
    Route::post('/statuses/paginate', [StatusController::class, 'paginate']);
    Route::patch('/statuses/status', [StatusController::class, 'status']);
    Route::delete('/statuses/{id}', [StatusController::class, 'delete']);

    // Projects routes
    Route::post('/projects', [ProjectController::class, 'save']);
    Route::post('/projects/paginate', [ProjectController::class, 'paginate']);
    Route::patch('/projects/status', [ProjectController::class, 'status']);
    Route::patch('/projects/project-status', [ProjectController::class, 'projectStatus']);
    Route::delete('/projects/{id}', [ProjectController::class, 'delete']);

    // Payments routes
    Route::post('/payments', [PaymentController::class, 'save']);
    Route::post('/payments/paginate', [PaymentController::class, 'paginate']);
    Route::get('/payments/project/{id}', [PaymentController::class, 'byProject']);
    Route::patch('/payments/status', [PaymentController::class, 'status']);
    Route::delete('/payments/{id}', [PaymentController::class, 'delete']);

    // Statuses routes
    Route::post('/landing-forms', [LandingFormController::class, 'save']);
    Route::post('/landing-forms/paginate', [LandingFormController::class, 'paginate']);
    Route::patch('/landing-forms/status', [LandingFormController::class, 'status']);
    Route::delete('/landing-forms/{id}', [LandingFormController::class, 'delete']);

    // Statuses routes
    Route::post('/tables', [TableController::class, 'save']);
    Route::post('/tables/paginate', [TableController::class, 'paginate']);
    Route::patch('/tables/status', [TableController::class, 'status']);
    Route::delete('/tables/{id}', [TableController::class, 'delete']);

    Route::get('/profile/{uuid}', [ProfileController::class, 'full']);
    Route::get('/profile/thumbnail/{uuid}', [ProfileController::class, 'thumbnail']);
    Route::post('/profile', [ProfileController::class, 'saveProfile']);
    Route::patch('/profile', [ProfileController::class, 'save']);

    Route::patch('/account/email', [AccountController::class, 'email']);
    Route::patch('/account/password', [AccountController::class, 'password']);

    // Statuses routes
    Route::post('/settings', [SettingController::class, 'save']);
    Route::post('/settings/paginate', [SettingController::class, 'paginate']);
    Route::patch('/settings/status', [SettingController::class, 'status']);
    Route::delete('/settings/{id}', [SettingController::class, 'delete']);

    Route::get('/remainings-history/{month}', [RemainingHistoryController::class, 'get']);

    Route::get('/users-by-projects/{relative_id}', [UserByProjectController::class, 'getUser']);
    Route::get('/users-by-projects/project/{project}', [UserByProjectController::class, 'byProject']);
    Route::patch('/users-by-projects/project', [UserByProjectController::class, 'massiveByProject']);

    Route::post('/views', [ViewController::class, 'save']);
    Route::delete('/views/{id}', [ViewController::class, 'delete']);

    Route::get('/leads', [LeadController::class, 'all']);
    Route::post('/leads', [LeadController::class, 'save']);
    Route::post('/leads/paginate', [LeadController::class, 'paginate']);
    Route::post('/leads/status', [LeadController::class, 'leadStatus']);
    Route::post('/leads/manage-status', [LeadController::class, 'manageStatus']);
    Route::put('/leads/attend/{lead}', [LeadController::class, 'attend']);
    Route::delete('/leads/attend/{lead}', [LeadController::class, 'attend']);
    Route::delete('/leads/{id}', [LeadController::class, 'delete']);

    Route::patch('/tasks/status', [TaskController::class, 'status']);
});
