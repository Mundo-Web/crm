<?php

use App\Http\Controllers\ApikeyController;
use App\Http\Controllers\BasicController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UtilController;
use App\Http\Controllers\ViewController;
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

require __DIR__ . '/router.php';

Route::get(
    'login',
    fn () => Auth::check()
        ? redirect('/home')
        : Inertia::render('Login', [
            'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
            'NOCAPTCHA_SITEKEY' => env('NOCAPTCHA_SITEKEY'),
            'token' => csrf_token()
        ])
)->name('login');

Route::get('/', function (Request $request) {
    return redirect('/login');
});

Route::middleware('auth')->group(function () {
    Route::get('/home', [BasicController::class, 'reactView'])->name('Home.jsx');
    Route::get('/clients', [ClientController::class, 'reactView'])->name('Clients.jsx');
    Route::get('/leads', [LeadController::class, 'reactView'])->name('Leads.jsx');
    Route::get('/leads/{lead}', [LeadController::class, 'reactView'])->name('Leads.jsx');
    Route::get('/clients/{view}', [ClientController::class, 'reactView'])->name('Clients.jsx');
    Route::get('/views', [ViewController::class, 'reactView'])->name('Views.jsx');
    Route::get('/projects', [ProjectController::class, 'reactView'])->name('Projects.jsx');
    Route::get('/users', [UserController::class, 'reactView'])->name('Users.jsx');
    Route::get('/roles', [RoleController::class, 'reactView'])->name('Roles.jsx');
    Route::get('/statuses', [StatusController::class, 'reactView'])->name('Statuses.jsx');
    Route::get('/apikeys', [ApikeyController::class, 'reactView'])->name('Apikeys.jsx');
    Route::get('/types', [TypeController::class, 'reactView'])->name('Types.jsx');
    Route::get('/settings', [SettingController::class, 'reactView'])->name('Settings.jsx');
});
