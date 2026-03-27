<?php

namespace App\Http\Controllers\Api\Farmer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function index(): JsonResponse
    {
        $farmerId = Auth::id();
        if (!$farmerId) {
            return response()->json(['error' => 'No autorizado'], 401);
        }

        try {
            // ── 1. RESUMEN GLOBAL (todo el tiempo) ──────────────────────────────
            $totalRevenue = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('products.farmer_id', $farmerId)
                ->where('orders.status', '!=', 'cancelled')
                ->sum(DB::raw('order_items.quantity * order_items.price'));

            $totalOrders = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->distinct('orders.id')
                ->count('orders.id');

            $totalProducts = Product::where('farmer_id', $farmerId)->count();

            $avgRating = DB::table('reviews')
                ->join('products', 'reviews.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->avg('reviews.rating');

            $totalReviews = DB::table('reviews')
                ->join('products', 'reviews.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->count();

            // ── 2. INGRESOS MENSUALES — últimos 6 meses ──────────────────────────
            $monthlyRevenue = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);

                $revenue = DB::table('order_items')
                    ->join('products', 'order_items.product_id', '=', 'products.id')
                    ->join('orders', 'order_items.order_id', '=', 'orders.id')
                    ->where('products.farmer_id', $farmerId)
                    ->where('orders.status', '!=', 'cancelled')
                    ->whereMonth('orders.created_at', $date->month)
                    ->whereYear('orders.created_at', $date->year)
                    ->sum(DB::raw('order_items.quantity * order_items.price'));

                $orders = DB::table('orders')
                    ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                    ->join('products', 'order_items.product_id', '=', 'products.id')
                    ->where('products.farmer_id', $farmerId)
                    ->whereMonth('orders.created_at', $date->month)
                    ->whereYear('orders.created_at', $date->year)
                    ->distinct('orders.id')
                    ->count('orders.id');

                $monthlyRevenue[] = [
                    'month'   => $date->locale('es')->isoFormat('MMM'),
                    'year'    => (int) $date->year,
                    'revenue' => (float) $revenue,
                    'orders'  => (int) $orders,
                ];
            }

            // ── 3. PEDIDOS POR ESTADO ────────────────────────────────────────────
            $statusRows = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('products.farmer_id', $farmerId)
                ->selectRaw('orders.status, COUNT(DISTINCT orders.id) as count')
                ->groupBy('orders.status')
                ->get();

            $ordersByStatus = $statusRows->map(fn($row) => [
                'status' => $row->status,
                'count'  => (int) $row->count,
            ])->values();

            // ── 4. TOP 5 PRODUCTOS (histórico) ──────────────────────────────────
            $topProducts = Product::where('farmer_id', $farmerId)
                ->with(['firstImage'])
                ->withCount(['orderItems as total_sold' => function ($q) {
                    $q->select(DB::raw('COALESCE(SUM(quantity), 0)'));
                }])
                ->withAvg('reviews', 'rating')
                ->orderByDesc('total_sold')
                ->take(5)
                ->get()
                ->map(function ($p) use ($farmerId) {
                    $revenue = DB::table('order_items')
                        ->join('orders', 'order_items.order_id', '=', 'orders.id')
                        ->where('order_items.product_id', $p->id)
                        ->where('orders.status', '!=', 'cancelled')
                        ->sum(DB::raw('order_items.quantity * order_items.price'));

                    return [
                        'id'      => $p->id,
                        'name'    => $p->name,
                        'image'   => $p->firstImage?->image_url ?? null,
                        'sold'    => (int) ($p->total_sold ?? 0),
                        'revenue' => (float) $revenue,
                        'rating'  => round((float) ($p->reviews_avg_rating ?? 0), 1),
                        'unit'    => $p->unit ?? 'kg',
                    ];
                });

            return response()->json([
                'summary' => [
                    'total_revenue'  => (float) $totalRevenue,
                    'total_orders'   => (int) $totalOrders,
                    'total_products' => (int) $totalProducts,
                    'avg_rating'     => round((float) ($avgRating ?? 0), 1),
                    'total_reviews'  => (int) $totalReviews,
                ],
                'monthly_revenue' => $monthlyRevenue,
                'orders_by_status' => $ordersByStatus,
                'top_products'     => $topProducts,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error interno del servidor',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
