<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Domain\Sales\Repositories\VentaRepositoryInterface::class,
            \App\Infrastructure\Persistence\EloquentVentaRepository::class
        );
        $this->app->bind(
            \App\Domain\Inventory\Repositories\ProductoRepositoryInterface::class,
            \App\Infrastructure\Persistence\EloquentProductoRepository::class
        );
        $this->app->bind(
            \App\Domain\Inventory\Repositories\KardexRepositoryInterface::class,
            \App\Infrastructure\Persistence\EloquentKardexRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        \Illuminate\Support\Facades\Event::listen(
            \App\Domain\Sales\Events\VentaConfirmed::class,
            \App\Domain\Accounting\Listeners\GenerateSaleAccountingEntry::class,
        );
    }
}
