<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware('web')->group(function () {
    Route::get('/api/auth/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/api/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
});
