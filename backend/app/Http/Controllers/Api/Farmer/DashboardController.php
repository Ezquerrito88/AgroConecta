<?php

namespace App\Http\Controllers\Api\Farmer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $farmerId = Auth::id();
        if (!$farmerId) {
            return response()->json(['error' => 'No autorizado'], 401);
        }

        $mesActual = Carbon::now();

        try {
            // 1. KPI: Pedidos (Usando farmer_id)
            $pedidos = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->whereMonth('orders.created_at', $mesActual->month)
                ->whereYear('orders.created_at',  $mesActual->year)
                ->distinct('orders.id')
                ->count('orders.id');

            // 2. KPI: Ingresos
            $ventas = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('products.farmer_id', $farmerId)
                ->where('orders.status', '!=', 'cancelled')
                ->whereMonth('orders.created_at', $mesActual->month)
                ->whereYear('orders.created_at',  $mesActual->year)
                ->sum(DB::raw('order_items.quantity * order_items.price'));

            // 3. KPI: Productos agotados (CORREGIDO: stock_quantity)
            $agotados = Product::where('farmer_id', $farmerId)
                ->where('stock_quantity', '<=', 0) // <--- Cambio aquí
                ->count();

            // 4. KPI: Calificación media
            $calificacion = DB::table('reviews')
                ->join('products', 'reviews.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->avg('reviews.rating');

            // 5. Últimos 5 pedidos
            $recentOrders = Order::whereHas('items.product', function($q) use ($farmerId) {
                    $q->where('farmer_id', $farmerId);
                })
                ->with(['buyer:id,name,email', 'items.product' => function($q) use ($farmerId) {
                    $q->where('farmer_id', $farmerId);
                }])
                ->latest()
                ->take(5)
                ->get();

            // 6. Top 5 productos
            $topProducts = Product::where('farmer_id', $farmerId)
                ->withCount(['orderItems as total_sold' => function($query) {
                    $query->select(DB::raw('sum(quantity)'));
                }])
                ->withAvg('reviews', 'rating')
                ->orderByDesc('total_sold')
                ->take(5)
                ->get()
                ->map(fn($p) => [
                    'id'     => $p->id,
                    'name'   => $p->name,
                    'price'  => (float) $p->price,
                    'image'  => $p->image ?? "https://placehold.co/56x56/f0fdf4/16a34a?text=" . ($p->name ? substr($p->name, 0, 1) : 'P'),
                    'rating' => round((float) ($p->reviews_avg_rating ?? 0), 1),
                    'sold'   => (int) ($p->total_sold ?? 0),
                ]);

            return response()->json([
                'kpis' => [
                    'pedidos'      => $pedidos,
                    'ventas'       => (float) $ventas,
                    'agotados'     => $agotados,
                    'calificacion' => round((float) ($calificacion ?? 0), 1),
                ],
                'recent_orders' => $recentOrders,
                'top_products'  => $topProducts,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}