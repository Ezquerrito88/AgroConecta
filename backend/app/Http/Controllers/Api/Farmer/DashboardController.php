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
            // 1. KPI: Pedidos del mes
            $pedidos = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->whereMonth('orders.created_at', $mesActual->month)
                ->whereYear('orders.created_at', $mesActual->year)
                ->distinct('orders.id')
                ->count('orders.id');

            // 2. KPI: Ingresos del mes
            $ventas = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('products.farmer_id', $farmerId)
                ->where('orders.status', '!=', 'cancelled')
                ->whereMonth('orders.created_at', $mesActual->month)
                ->whereYear('orders.created_at', $mesActual->year)
                ->sum(DB::raw('order_items.quantity * order_items.price'));

            // 3. KPI: Productos agotados
            $agotados = Product::where('farmer_id', $farmerId)
                ->where('stock_quantity', '<=', 0)
                ->count();

            // 4. KPI: Calificación media
            $calificacion = DB::table('reviews')
                ->join('products', 'reviews.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->avg('reviews.rating');

            // 5. Últimos 5 pedidos
            $recentOrders = Order::whereHas('items.product', function ($q) use ($farmerId) {
                    $q->where('farmer_id', $farmerId);
                })
                ->with(['buyer:id,name,email', 'items.product' => function ($q) use ($farmerId) {
                    $q->where('farmer_id', $farmerId);
                }])
                ->latest()
                ->take(5)
                ->get();

            // 6. Top 3 productos más vendidos
            $topProducts = Product::where('farmer_id', $farmerId)
                ->with(['firstImage'])
                ->withCount(['orderItems as total_sold' => function ($query) {
                    $query->select(DB::raw('sum(quantity)'));
                }])
                ->withAvg('reviews', 'rating')
                ->orderByDesc('total_sold')
                ->take(3)
                ->get()
                ->map(fn($p) => [
                    'id'     => $p->id,
                    'name'   => $p->name,
                    'price'  => (float) $p->price,
                    'image'  => $p->firstImage?->image_url ?? null,
                    'rating' => round((float) ($p->reviews_avg_rating ?? 0), 1),
                    'sold'   => (int) ($p->total_sold ?? 0),
                    'unit'   => $p->unit ?? 'kg',
                ]);

            // 7. Ingresos + pedidos por mes (últimos 12 meses) → gráficas
            $monthlyRevenue = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('orders',   'order_items.order_id',   '=', 'orders.id')
                ->where('products.farmer_id', $farmerId)
                ->where('orders.status', '!=', 'cancelled')
                ->where('orders.created_at', '>=', Carbon::now()->subMonths(11)->startOfMonth())
                ->selectRaw('
                    YEAR(orders.created_at)  AS year,
                    MONTH(orders.created_at) AS month,
                    SUM(order_items.quantity * order_items.price) AS total,
                    COUNT(DISTINCT orders.id) AS orders_count
                ')
                ->groupByRaw('YEAR(orders.created_at), MONTH(orders.created_at)')
                ->orderByRaw('YEAR(orders.created_at), MONTH(orders.created_at)')
                ->get();

            // 8. Pedidos por estado → gráfica dona
            $ordersByStatus = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->join('products',    'order_items.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->selectRaw('orders.status, COUNT(DISTINCT orders.id) as count')
                ->groupBy('orders.status')
                ->get();

            // 9. Stock bajo (entre 1 y 5 unidades)
            $lowStock = Product::where('farmer_id', $farmerId)
                ->where('stock_quantity', '>', 0)
                ->where('stock_quantity', '<=', 5)
                ->orderBy('stock_quantity')
                ->get()
                ->map(fn($p) => [
                    'id'    => $p->id,
                    'name'  => $p->name,
                    'stock' => (int) $p->stock_quantity,
                    'unit'  => $p->unit ?? 'kg',
                    'image' => $p->firstImage?->image_url ?? null,
                ]);

            return response()->json([
                'kpis' => [
                    'pedidos'      => $pedidos,
                    'ventas'       => (float) $ventas,
                    'agotados'     => $agotados,
                    'calificacion' => round((float) ($calificacion ?? 0), 1),
                ],
                'monthly_revenue'  => $monthlyRevenue,
                'orders_by_status' => $ordersByStatus,
                'low_stock'        => $lowStock,
                'recent_orders'    => $recentOrders,
                'top_products'     => $topProducts,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error interno del servidor',
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }
}