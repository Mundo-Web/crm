<?php

namespace App\Providers;

use App\Models\Client;
use App\Models\Message;
use App\Observers\ClientAssignationObserver;
use App\Observers\ClientStatusObserver;
use App\Observers\MessageObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Client::observe([
            ClientAssignationObserver::class,
            ClientStatusObserver::class
        ]);
        Message::observe([
            MessageObserver::class
        ]);
    }
}
