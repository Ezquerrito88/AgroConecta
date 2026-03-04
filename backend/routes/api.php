<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\OrderController;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/

// Health check para Docker
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'service' => 'agroconecta-api']);
});

// Autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catálogo y Búsqueda
Route::get('/products/latest', [ProductController::class, 'getLatest']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Categorías
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) { return $request->user(); });

    // Productos
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Imágenes
    Route::delete('/product-images/{id}', [ProductImageController::class, 'destroy']);

    // Categorías
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Favoritos
    Route::post('/favorites/{id}', [FavoriteController::class, 'toggle']);
    Route::get('/favorites', [FavoriteController::class, 'index']);

    // Pedidos - Agricultor
    Route::get('/farmer/orders', [OrderController::class, 'farmerOrders']);
    Route::get('/farmer/orders/{id}', [OrderController::class, 'show']);
    Route::put('/farmer/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // Pedidos - Comprador
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/buyer/orders', [OrderController::class, 'buyerOrders']);
});
