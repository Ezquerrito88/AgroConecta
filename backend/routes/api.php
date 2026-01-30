<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\FavoriteController;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/

// Autenticación (RF01 y RF07) [cite: 44]
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catálogo y Búsqueda (RF08) [cite: 16, 44]
// IMPORTANTE: 'featured' va antes que '{id}' para evitar el error 404
Route::get('/products/featured', [ProductController::class, 'getFeatured']); 
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Categorías
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (Middleware Sanctum) [cite: 41]
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Gestión de Sesión
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Gestión de productos para el Agricultor (RF02) [cite: 11, 44]
    // Aquí es donde se controla el stock y disponibilidad [cite: 11]
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Gestión de imágenes (RF02) [cite: 44]
    Route::delete('/product-images/{id}', [ProductImageController::class, 'destroy']);

    // Gestión de categorías para el Administrador (RF16) [cite: 45]
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    Route::post('/favorites/{id}', [FavoriteController::class, 'toggle']);
    Route::get('/favorites', [FavoriteController::class, 'index']);
    
});