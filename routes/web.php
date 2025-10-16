<?php

use App\Http\Controllers\ApikeyController;
use App\Http\Controllers\ArchivedController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\ChatruchoController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DefaultMessageController;
use App\Http\Controllers\KPILeadsController;
use App\Http\Controllers\KPIProjectsController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\ProcessController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectArchivedController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDoneController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\SubdomainController;
use App\Http\Controllers\TaskboardController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ViewController;
use App\Http\Controllers\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get(
    'login',
    fn() => Auth::check()
        ? redirect('/home')
        // : Inertia::render('Login', [
        //     'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
        //     'NOCAPTCHA_SITEKEY' => env('NOCAPTCHA_SITEKEY'),
        //     'token' => csrf_token()
        // ])
        : redirect('//' . env('APP_DOMAIN') . '/join')
)->name('login');

Route::get('/', function (Request $request) {
    return redirect('/login');
});

Route::middleware('auth')->group(function () {
    Route::get('/join', [AuthController::class, 'joinView'])->name('Join.jsx');
    Route::get('/plans', [PlanController::class, 'reactView'])->name('Plans.jsx');
});
Route::middleware(['auth', 'firstTime', 'hasPlan'])->group(function () {
    Route::get('/home', [KPILeadsController::class, 'reactView'])->name('KPILeads.jsx');
    Route::get('/home/projects', [KPIProjectsController::class, 'reactView'])->name('KPIProjects.jsx');
    Route::get('/clients', [ClientController::class, 'reactView'])->name('Clients.jsx');
    // Route::get('/calendar', [CalendarController::class, 'reactView'])->name('Calendar.jsx');
    Route::get('/tasks', [TaskController::class, 'reactView'])->name('Tasks.jsx');
    Route::get('/leads', [LeadController::class, 'reactView'])->name('Leads.jsx');
    Route::get('/leads/{lead}', [LeadController::class, 'reactView'])->name('Leads.jsx');
    Route::get('/clients/{client}', [ClientController::class, 'reactView'])->name('Clients.jsx');
    Route::get('/archived', [ArchivedController::class, 'reactView'])->name('Archived.jsx');
    Route::get('/archived/{archived}', [ClientController::class, 'reactView'])->name('Archived.jsx');
    Route::get('/messages', [MessageController::class, 'reactView'])->name('Messages.jsx');
    Route::get('/products', [ProductController::class, 'reactView'])->name('Products.jsx');
    Route::get('/processes', [ProcessController::class, 'reactView'])->name('Processes.jsx');
    Route::get('/campaigns', [CampaignController::class, 'reactView'])->name('Campaigns.jsx');
    Route::get('/views', [ViewController::class, 'reactView'])->name('Views.jsx');
    Route::get('/projects', [ProjectController::class, 'reactView'])->name('Projects.jsx');
    Route::get('/projects/done', [ProjectDoneController::class, 'reactView'])->name('ProjectsDone.jsx');
    Route::get('/projects/archived', [ProjectArchivedController::class, 'reactView'])->name('ProjectsArchived.jsx');
    Route::get('/projects/taskboard', [TaskboardController::class, 'reactView'])->name('Taskboard.jsx');
    Route::get('/pages/{correlative}', [SubdomainController::class, 'reactView'])->name('Pages.jsx');
    Route::get('/users', [UserController::class, 'reactView'])->name('Users.jsx');
    Route::get('/roles', [RoleController::class, 'reactView'])->name('Roles.jsx');
    Route::get('/default-messages', [DefaultMessageController::class, 'reactView'])->name('DefaultMessages.jsx');
    Route::get('/repository', [RepositoryController::class, 'reactView'])->name('Repository.jsx');
    Route::get('/statuses', [StatusController::class, 'reactView'])->name('Statuses.jsx');
    Route::get('/apikeys', [ApikeyController::class, 'reactView'])->name('Apikeys.jsx');
    Route::get('/webhooks', [WebhookController::class, 'reactView'])->name('Webhooks.jsx');
    Route::get('/types', [TypeController::class, 'reactView'])->name('Types.jsx');
    Route::get('/settings', [SettingController::class, 'reactView'])->name('Settings.jsx');

    Route::get('/chatrucho', [ChatruchoController::class, 'reactView'])->name('Chatrucho.jsx');
});

if (env('APP_ENV') === 'local') {
    Route::get('/cloud/{uuid}', [RepositoryController::class, 'media']);
}
