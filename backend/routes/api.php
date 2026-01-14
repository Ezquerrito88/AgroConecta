<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController; // <--- Importante invitar al controlador


// --- RUTAS DE USUARIO NORMAL ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Esta ruta de prueba viene por defecto, puedes dejarla o quitarla
Route::get('/user', function (Illuminate\Http\Request $request) {
    return $request->user();
})->middleware('auth:sanctum');