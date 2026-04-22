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
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminStatsController;

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
    Route::get('/latest', [ProductController::class, 'getLatest']);
    Route::get('/',       [ProductController::class, 'index']);
    Route::get('/{id}',   [ProductController::class, 'show']);
});

// Categorías públicas
Route::get('/categories',           [CategoryController::class, 'index']);
Route::get('/categories/populares', [CategoryController::class, 'getPopulares']);
Route::get('/products-stats',       [CategoryController::class, 'getFiltrosStats']);
Route::get('/categories/{id}',      [CategoryController::class, 'show']);

// Webhooks
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripe']);
Route::post('/webhooks/paypal', [WebhookController::class, 'handlePaypal']);

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS
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
    Route::middleware('farmer')->prefix('farmer')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'farmerStats']);
        Route::get('/profile',   [FarmerProfileController::class, 'show']);
        Route::put('/profile',   [FarmerProfileController::class, 'update']);
        Route::get('/products',  [ProductController::class, 'misProductos']);

        Route::get('/orders',              [OrderController::class, 'farmerOrders']);
        Route::get('/orders/{id}',         [OrderController::class, 'show']);
        Route::put('/orders/{id}/status',  [OrderController::class, 'updateStatus']);
    });

    Route::middleware('farmer')->group(function () {
        Route::post('/products',        [ProductController::class, 'store']);
        Route::put('/products/{id}',    [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::delete('/products/{productId}/images/{imageId}', [ProductController::class, 'destroyImage']);
    });

    /*
    |----------------------------------------------------------------------
    | COMPRADOR
    |----------------------------------------------------------------------
    */
    Route::post('/orders',      [OrderController::class, 'store']);
    Route::get('/buyer/orders', [OrderController::class, 'buyerOrders']);

    Route::get('/favorites',       [FavoriteController::class, 'index']);
    Route::post('/favorites/{id}', [FavoriteController::class, 'toggle']);

    Route::put('/user/profile', [UserProfileController::class, 'update']);

    Route::get('/reviews/pendientes',  [ReviewController::class, 'pendientes']);
    Route::get('/reviews/mis-reviews', [ReviewController::class, 'misReviews']);
    Route::get('/reviews/{id}',        [ReviewController::class, 'show']);
    Route::post('/reviews',            [ReviewController::class, 'store']);

    /*
    |----------------------------------------------------------------------
    | PAGOS
    |----------------------------------------------------------------------
    */
    Route::prefix('payments')->group(function () {
        Route::post('/stripe/intent',                         [PaymentController::class, 'createStripeIntent']);
        Route::post('/paypal/orders',                         [PaymentController::class, 'createPaypalOrder']);
        Route::post('/paypal/orders/{paypalOrderId}/capture', [PaymentController::class, 'capturePaypalOrder']);
    });

    /*
    |----------------------------------------------------------------------
    | MENSAJERÍA
    |----------------------------------------------------------------------
    */
    Route::prefix('conversations')->group(function () {
        Route::get('/',               [ConversationController::class, 'index']);
        Route::post('/',              [ConversationController::class, 'store']);
        Route::get('/{id}/messages',  [ConversationController::class, 'messages']);
        Route::post('/{id}/messages', [ConversationController::class, 'sendMessage']);
    });

    /*
    |----------------------------------------------------------------------
    | ADMIN
    |----------------------------------------------------------------------
    */
    Route::middleware('admin')->prefix('admin')->group(function () {

        // Estadísticas
        Route::get('/stats', [AdminStatsController::class, 'index']);

        // Usuarios
        Route::get('/users',               [AdminUserController::class, 'index']);
        Route::get('/users/{id}',          [AdminUserController::class, 'show']);
        Route::patch('/users/{id}/role',   [AdminUserController::class, 'updateRole']);
        Route::patch('/users/{id}/toggle', [AdminUserController::class, 'toggleActive']);
        Route::delete('/users/{id}',       [AdminUserController::class, 'destroy']);
        Route::put('/users/{id}',          [AdminUserController::class, 'updateUser']);

        // Productos
        Route::get('/products',                          [AdminProductController::class, 'index']);
        Route::get('/products/{id}',                     [AdminProductController::class, 'show']);
        Route::put('/products/{id}',                     [AdminProductController::class, 'update']);
        Route::patch('/products/{id}/approve',           [AdminProductController::class, 'approve']);
        Route::patch('/products/{id}/reject',            [AdminProductController::class, 'reject']);
        Route::delete('/products/{id}',                  [AdminProductController::class, 'destroy']);
        Route::post('/products/{id}/images',             [AdminProductController::class, 'uploadImages']);
        Route::delete('/products/{id}/images/{imageId}', [AdminProductController::class, 'destroyImage']);

        // Categorías
        Route::get('/categories',         [AdminCategoryController::class, 'index']);
        Route::post('/categories',        [AdminCategoryController::class, 'store']);
        Route::put('/categories/{id}',    [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{id}', [AdminCategoryController::class, 'destroy']);
    });
});