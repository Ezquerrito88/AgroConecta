<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // ── CORS — debe ir primero para que los preflight OPTIONS
        //           no sean bloqueados por auth antes de responder
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        // ── CSRF — excluir todas las rutas API
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // ── Aliases de middleware personalizados
        $middleware->alias([
            'admin'  => \App\Http\Middleware\EnsureIsAdmin::class,
            'farmer' => \App\Http\Middleware\EnsureIsFarmer::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();