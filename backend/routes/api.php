<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FarmerProfileController;
use App\Http\Controllers\Api\Farmer\DashboardController;
use App\Http\Controllers\Api\Farmer\StatisticsController;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/

Route::get('/health', fn() => response()->json([
    'status'  => 'ok',
    'service' => 'agroconecta-api',
    'version' => '1.0.0',
]));

// Auth pública
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Productos públicos
Route::prefix('products')->group(function () {
    Route::get('/latest',  [ProductController::class, 'getLatest']);
    Route::get('/',        [ProductController::class, 'index']);
    Route::get('/{id}',    [ProductController::class, 'show']);
});

// Categorías públicas
Route::get('/categories',      [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

// Webhooks (sin auth, validan firma internamente)
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripe']);
Route::post('/webhooks/paypal', [WebhookController::class, 'handlePaypal']);

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS — cualquier usuario autenticado
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/user',     fn(Request $r) => $r->user()->load('farmer'));

    /*
    |----------------------------------------------------------------------
    | AGRICULTOR
    |----------------------------------------------------------------------
    */
    Route::prefix('farmer')->group(function () {

        // Dashboard
        Route::get('/dashboard',   [DashboardController::class, 'index']);

        // Estadísticas
        Route::get('/statistics',  [StatisticsController::class, 'index']);

        // Perfil
        Route::get('/profile',  [FarmerProfileController::class, 'show']);
        Route::put('/profile',  [FarmerProfileController::class, 'update']);

        // Productos del agricultor autenticado
        Route::get('/products', [ProductController::class, 'misProductos']);

        // Pedidos recibidos
        Route::get('/orders',             [OrderController::class, 'farmerOrders']);
        Route::get('/orders/{id}',        [OrderController::class, 'show']);
        Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    });

    // CRUD productos (solo el agricultor dueño puede editar/borrar — validado en controller)
    Route::post('/products',        [ProductController::class, 'store']);
    Route::put('/products/{id}',    [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::delete('/products/{productId}/images/{imageId}', [ProductController::class, 'destroyImage']);

    /*
    |----------------------------------------------------------------------
    | COMPRADOR
    |----------------------------------------------------------------------
    */
    Route::post('/orders',       [OrderController::class, 'store']);
    Route::get('/buyer/orders',  [OrderController::class, 'buyerOrders']);

    // Favoritos
    Route::get('/favorites',        [FavoriteController::class, 'index']);
    Route::post('/favorites/{id}',  [FavoriteController::class, 'toggle']);

    /*
    |----------------------------------------------------------------------
    | PAGOS
    |----------------------------------------------------------------------
    */
    Route::prefix('payments')->group(function () {
        Route::post('/stripe/intent',                        [PaymentController::class, 'createStripeIntent']);
        Route::post('/paypal/orders',                        [PaymentController::class, 'createPaypalOrder']);
        Route::post('/paypal/orders/{paypalOrderId}/capture', [PaymentController::class, 'capturePaypalOrder']);
    });

    /*
    |----------------------------------------------------------------------
    | MENSAJERÍA
    |----------------------------------------------------------------------
    */
    Route::prefix('conversations')->group(function () {
        Route::get('/',                    [ConversationController::class, 'index']);
        Route::post('/',                   [ConversationController::class, 'store']);
        Route::get('/{id}/messages',       [ConversationController::class, 'messages']);
        Route::post('/{id}/messages',      [ConversationController::class, 'sendMessage']);
    });
});
