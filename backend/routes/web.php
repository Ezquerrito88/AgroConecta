<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Artisan;

Route::get('/ejecutar-link', function () {
    try {
        Artisan::call('storage:link');
        return "✅ Enlace simbólico creado con éxito en Azure.";
    } catch (\Exception $e) {
        return "❌ Error: " . $e->getMessage();
    }
});

Route::middleware('web')->group(function () {
    Route::get('/api/auth/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/api/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
});
