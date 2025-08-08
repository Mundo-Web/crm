<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ArchivedController;
use App\Http\Controllers\Atalaya\UserController as AtalayaUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientHasProductsController;
use App\Http\Controllers\ClientNoteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DefaultMessageController;
use App\Http\Controllers\GmailController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\KPILeadsController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\NewLeadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProcessController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectArchivedController;
use App\Http\Controllers\ProjectDoneController;
use App\Http\Controllers\RemainingHistoryController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\SubdomainController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserByProjectController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UtilController;
use App\Http\Controllers\ViewController;
use App\Http\Controllers\WhatsAppController;
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

Route::get('/pages/media/{uuid}', [PageController::class, 'media']);
Route::get('/integrations/media/{uuid}', [IntegrationController::class, 'media']);

Route::middleware('auth')->group(function () {
    Route::post('/init', [AuthController::class, 'init']);
    Route::delete('/logout', [AuthController::class, 'destroy'])
        ->name('logout');
    Route::get('/authorize/{business}', [AuthController::class, 'activeService']);

    Route::get('/whatsapp', [WhatsAppController::class, 'verify']);
    Route::post('/whatsapp/send', [WhatsAppController::class, 'send']);

    Route::post('/meta/send', [MetaController::class, 'send']);

    Route::get('/dashboard/{range}', [DashboardController::class, 'revenue']);
    Route::get('/dashboard/leads/kpi/{month}', [KPILeadsController::class, 'kpi']);

    // Users sign Routes
    Route::post('/users/sign', [UserController::class, 'addSign']);
    Route::delete('/users/sign', [UserController::class, 'deleteSign']);
    Route::put('/users/sign/default', [UserController::class, 'setDefaultSign']);

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
    Route::get('/clients/{client}', [ClientController::class, 'get']);
    Route::post('/clients', [ClientController::class, 'save']);
    Route::put('/clients/assign', [ClientController::class, 'assign']);
    Route::delete('/clients/assign', [ClientController::class, 'assign']);
    Route::post('/clients/paginate', [ClientController::class, 'paginate']);
    Route::patch('/clients/status', [ClientController::class, 'status']);
    Route::patch('/clients/client-status', [ClientController::class, 'clientStatus']);
    Route::delete('/clients/{id}', [ClientController::class, 'delete']);
    Route::post('/clients/massive-delete', [ClientController::class, 'massiveDelete']);

    Route::post('/messages/paginate', [MessageController::class, 'paginate']);
    Route::post('/messages/send', [WhatsAppController::class, 'send']);

    Route::post('/archived/paginate', [ArchivedController::class, 'paginate']);
    Route::patch('/archived/status', [ArchivedController::class, 'status']);
    Route::delete('/archived/{id}', [ArchivedController::class, 'delete']);

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

    // Types routes
    Route::post('/products', [ProductController::class, 'save']);
    Route::post('/products/paginate', [ProductController::class, 'paginate']);
    Route::patch('/products/status', [ProductController::class, 'status']);
    Route::delete('/products/{id}', [ProductController::class, 'delete']);

    Route::post('/products-by-client', [ClientHasProductsController::class, 'save']);
    Route::delete('/products-by-client/{id}', [ClientHasProductsController::class, 'delete']);
    Route::get('/products-by-client/client/{id}', [ClientHasProductsController::class, 'byClient']);

    // Processes routes
    Route::post('/processes', [ProcessController::class, 'save']);
    Route::post('/processes/paginate', [ProcessController::class, 'paginate']);
    Route::patch('/processes/status', [ProcessController::class, 'status']);
    Route::delete('/processes/{id}', [ProcessController::class, 'delete']);

    // Projects routes
    Route::post('/projects', [ProjectController::class, 'save']);
    Route::post('/projects/paginate', [ProjectController::class, 'paginate']);
    Route::patch('/projects/status', [ProjectController::class, 'status']);
    Route::patch('/projects/project-status', [ProjectController::class, 'projectStatus']);
    Route::delete('/projects/{id}', [ProjectController::class, 'delete']);
    Route::patch('/projects/boolean', [ProjectController::class, 'boolean']);

    // Projects Archived routes
    Route::post('/projects/done/paginate', [ProjectDoneController::class, 'paginate']);

    // Projects Archived routes
    Route::post('/projects/archived/paginate', [ProjectArchivedController::class, 'paginate']);
    Route::delete('/projects/archived/{id}', [ProjectArchivedController::class, 'delete']);

    Route::post('/subdomains', [SubdomainController::class, 'save']);
    Route::patch('/subdomains/status', [SubdomainController::class, 'status']);
    Route::delete('/subdomains/{id}', [SubdomainController::class, 'delete']);

    Route::post('/pages', [PageController::class, 'save']);
    Route::post('/pages/paginate', [PageController::class, 'paginate']);
    Route::patch('/pages/status', [PageController::class, 'status']);
    Route::patch('/pages/project-status', [PageController::class, 'projectStatus']);
    Route::delete('/pages/{id}', [PageController::class, 'delete']);

    // Payments routes
    Route::post('/payments', [PaymentController::class, 'save']);
    Route::post('/payments/paginate', [PaymentController::class, 'paginate']);
    Route::get('/payments/project/{id}', [PaymentController::class, 'byProject']);
    Route::patch('/payments/status', [PaymentController::class, 'status']);
    Route::delete('/payments/{id}', [PaymentController::class, 'delete']);

    // Statuses routes
    Route::post('/tables', [TableController::class, 'save']);
    Route::post('/tables/paginate', [TableController::class, 'paginate']);
    Route::patch('/tables/status', [TableController::class, 'status']);
    Route::delete('/tables/{id}', [TableController::class, 'delete']);

    Route::post('/default-messages', [DefaultMessageController::class, 'save']);
    Route::post('/default-messages/paginate', [DefaultMessageController::class, 'paginate']);
    Route::delete('/default-messages/{id}', [DefaultMessageController::class, 'delete']);

    Route::post('/repository', [RepositoryController::class, 'save']);
    Route::post('/repository/paginate', [RepositoryController::class, 'paginate']);
    Route::delete('/repository/{id}', [RepositoryController::class, 'delete']);

    // Route::post('/notifications', [NotificationController::class, 'save']);
    Route::post('/notifications/paginate', [NotificationController::class, 'paginate']);
    Route::patch('/notifications/boolean', [NotificationController::class, 'boolean']);
    // Route::patch('/notifications/status', [NotificationController::class, 'status']);
    // Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);

    // Route::get('/profile/{uuid}', [ProfileController::class, 'full']);
    // Route::get('/profile/thumbnail/{uuid}', [ProfileController::class, 'thumbnail']);
    // Route::post('/profile', [ProfileController::class, 'saveProfile']);
    // Route::patch('/profile', [ProfileController::class, 'save']);

    Route::post('/tasks/paginate', [TaskController::class, 'paginate']);

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

    Route::get('/leads/{lead}', [LeadController::class, 'get']);
    Route::get('/leads', [LeadController::class, 'all']);
    Route::post('/leads', [LeadController::class, 'save']);
    Route::post('/leads/paginate/{suffix?}', [LeadController::class, 'paginate'])->withoutMiddleware('throttle');
    // Route::post('/leads/paginate/{recentOnly?}', [NewLeadController::class, 'paginate']);
    Route::post('/leads/status', [LeadController::class, 'leadStatus']);
    Route::post('/leads/manage-status', [LeadController::class, 'manageStatus']);
    Route::put('/leads/attend/{lead}', [LeadController::class, 'attend']);
    Route::delete('/leads/attend/{lead}', [LeadController::class, 'attend']);
    Route::post('/leads/massive-assign', [LeadController::class, 'massiveAssign']);
    Route::delete('/leads/{id}', [LeadController::class, 'delete']);

    Route::patch('/tasks/status', [TaskController::class, 'status']);

    Route::post('/gmail', [GmailController::class, 'list']);
    Route::get('/gmail/check', [GmailController::class, 'check'])->name('gmail.check');
    Route::get('/gmail/callback', [GmailController::class, 'callback'])->name('gmail.callback');
    Route::get('/gmail/details/{id}', [GmailController::class, 'getDetails']);
    Route::get('/gmail/attachment/{messageId}/{attachmentId}/{filename}', [GmailController::class, 'getAttachment']);
    Route::post('/gmail/send', [GmailController::class, 'send']);

    Route::post('/integrations', [IntegrationController::class, 'save']);
    Route::delete('/integrations/{id}', [IntegrationController::class, 'delete']);
    Route::post('/integrations/profile', [IntegrationController::class, 'getProfile']);

    Route::prefix('/atalaya')->group(function () {
        Route::post('/users/paginate', [AtalayaUserController::class, 'paginate']);
        Route::post('/users/invite', [AtalayaUserController::class, 'invite']);
        Route::delete('/users/{id}', [AtalayaUserController::class, 'delete']);
        Route::delete('/users/external/{id}', [AtalayaUserController::class, 'deleteInvitation']);
    });
});
