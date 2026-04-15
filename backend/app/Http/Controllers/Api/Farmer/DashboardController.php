<?php

namespace App\Http\Controllers\Api\Farmer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function farmerStats(Request $request)
    {
        $farmerId  = $request->user()->farmer->id ?? $request->user()->id;
        $now       = Carbon::now();
        $thisYear  = $now->year;
        $prevYear  = $now->year - 1;
        $appUrl    = config('app.url');

        // ══════════════════════════════════════════════
        //  KPIs
        // ══════════════════════════════════════════════

        $pedidos = DB::table('orders')
            ->where('farmer_id', $farmerId)
            ->whereIn('status', ['pending', 'processing'])
            ->whereYear('created_at',  $thisYear)
            ->whereMonth('created_at', $now->month)
            ->count();

        $ventas = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders',   'order_items.order_id',   '=', 'orders.id')
            ->where('products.farmer_id', $farmerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereYear('orders.created_at', $thisYear)
            ->whereMonth('orders.created_at', $now->month)
            ->sum(DB::raw('order_items.quantity * order_items.price'));

        $agotados = DB::table('products')
            ->where('farmer_id', $farmerId)
            ->where('moderation_status', 'approved')
            ->where('stock_quantity', 0)
            ->count();

        $calificacion = DB::table('reviews')
            ->join('products', 'reviews.product_id', '=', 'products.id')
            ->where('products.farmer_id', $farmerId)
            ->avg('reviews.rating') ?? 0;

        // ══════════════════════════════════════════════
        //  INGRESOS MENSUALES (año actual)
        // ══════════════════════════════════════════════

        $monthlyRevenue = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders',   'order_items.order_id',   '=', 'orders.id')
            ->where('products.farmer_id', $farmerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereYear('orders.created_at', $thisYear)
            ->selectRaw('
                YEAR(orders.created_at)                       AS year,
                MONTH(orders.created_at)                      AS month,
                SUM(order_items.quantity * order_items.price) AS total,
                COUNT(DISTINCT orders.id)                     AS orders_count
            ')
            ->groupByRaw('YEAR(orders.created_at), MONTH(orders.created_at)')
            ->orderByRaw('YEAR(orders.created_at), MONTH(orders.created_at)')
            ->get();

        // ══════════════════════════════════════════════
        //  INGRESOS AÑO ANTERIOR
        // ══════════════════════════════════════════════

        $prevYearRevenue = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders',   'order_items.order_id',   '=', 'orders.id')
            ->where('products.farmer_id', $farmerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereYear('orders.created_at', $prevYear)
            ->selectRaw('
                MONTH(orders.created_at)                      AS month,
                SUM(order_items.quantity * order_items.price) AS total
            ')
            ->groupByRaw('MONTH(orders.created_at)')
            ->orderByRaw('MONTH(orders.created_at)')
            ->get()
            ->keyBy('month');

        // ══════════════════════════════════════════════
        //  PEDIDOS POR ESTADO
        // ══════════════════════════════════════════════

        $ordersByStatus = DB::table('orders')
            ->where('farmer_id', $farmerId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->orderBy('count', 'desc')
            ->get();

        // ══════════════════════════════════════════════
        //  STOCK BAJO (≤ 10 unidades, aprobados)
        // ══════════════════════════════════════════════

        $lowStock = DB::table('products')
            ->leftJoin(
                DB::raw('(SELECT product_id, image_path FROM product_images WHERE id IN (
            SELECT MIN(id) FROM product_images GROUP BY product_id
        )) pi'),
                'pi.product_id',
                '=',
                'products.id'   // ← faltaba esto
            )
            ->where('products.farmer_id', $farmerId)
            ->where('products.moderation_status', 'approved')
            ->where('products.stock_quantity', '>', 0)
            ->where('products.stock_quantity', '<=', 10)
            ->select(
                'products.id',
                'products.name',
                'products.stock_quantity as stock',
                'products.unit',
                DB::raw("IF(pi.image_path IS NOT NULL,
            CONCAT('{$appUrl}/storage/', pi.image_path),
            NULL
        ) as image")
            )
            ->orderBy('products.stock_quantity')
            ->limit(8)
            ->get();

        // ══════════════════════════════════════════════
        //  PEDIDOS RECIENTES
        // ══════════════════════════════════════════════

        $recentOrders = \App\Models\Order::with([
            'buyer:id,name,email',
            'items.product:id,name,price,unit,stock_quantity',
        ])
            ->where('farmer_id', $farmerId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // ══════════════════════════════════════════════
        //  TOP PRODUCTOS (por unidades vendidas)
        // ══════════════════════════════════════════════

        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders',   'order_items.order_id',   '=', 'orders.id')
            ->leftJoin('reviews', 'reviews.product_id', '=', 'products.id')
            ->leftJoin(
                DB::raw('(SELECT product_id, image_path FROM product_images ORDER BY id ASC) pi'),
                'pi.product_id',
                '=',
                'products.id'
            )
            ->where('products.farmer_id', $farmerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->selectRaw("
                products.id,
                products.name,
                products.price,
                products.unit,
                IF(pi.image_path IS NOT NULL,
                    CONCAT('{$appUrl}/storage/', pi.image_path),
                    NULL
                )                                AS image,
                COALESCE(AVG(reviews.rating), 0) AS rating,
                SUM(order_items.quantity)         AS sold
            ")
            ->groupBy(
                'products.id',
                'products.name',
                'products.price',
                'products.unit',
                'pi.image_path'
            )
            ->orderByDesc('sold')
            ->limit(5)
            ->get();

        // ══════════════════════════════════════════════
        //  MAPA DE CALOR (día × hora)
        // ══════════════════════════════════════════════

        $heatmap = DB::table('orders')
            ->where('farmer_id', $farmerId)
            ->whereNotIn('status', ['cancelled'])
            ->whereYear('created_at', $thisYear)
            ->selectRaw('
                DAYOFWEEK(created_at) AS day_of_week,
                HOUR(created_at)      AS hour,
                COUNT(*)              AS count
            ')
            ->groupByRaw('DAYOFWEEK(created_at), HOUR(created_at)')
            ->orderByRaw('DAYOFWEEK(created_at), HOUR(created_at)')
            ->get();

        // ══════════════════════════════════════════════
        //  DISPERSIÓN precio vs vendidos
        // ══════════════════════════════════════════════

        $scatterProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders',   'order_items.order_id',   '=', 'orders.id')
            ->where('products.farmer_id', $farmerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->selectRaw('
                products.name,
                products.price,
                SUM(order_items.quantity) as sold
            ')
            ->groupBy('products.id', 'products.name', 'products.price')
            ->orderByDesc('sold')
            ->get();

        // ══════════════════════════════════════════════
        //  BARRAS APILADAS por categoría y mes
        // ══════════════════════════════════════════════

        $stackedByCategory = DB::table('order_items')
            ->join('products',   'order_items.product_id', '=', 'products.id')
            ->join('orders',     'order_items.order_id',   '=', 'orders.id')
            ->join('categories', 'products.category_id',  '=', 'categories.id')
            ->where('products.farmer_id', $farmerId)
            ->whereNotIn('orders.status', ['cancelled'])
            ->whereYear('orders.created_at', $thisYear)
            ->selectRaw('
                categories.name                               AS category,
                MONTH(orders.created_at)                      AS month,
                YEAR(orders.created_at)                       AS year,
                SUM(order_items.quantity * order_items.price) AS total
            ')
            ->groupByRaw('
                categories.id,
                categories.name,
                YEAR(orders.created_at),
                MONTH(orders.created_at)
            ')
            ->orderByRaw('
                YEAR(orders.created_at),
                MONTH(orders.created_at),
                categories.name
            ')
            ->get();

        // ══════════════════════════════════════════════
        //  RESPUESTA
        // ══════════════════════════════════════════════

        return response()->json([
            'kpis' => [
                'pedidos'      => $pedidos,
                'ventas'       => round((float) $ventas, 2),
                'agotados'     => $agotados,
                'calificacion' => round((float) $calificacion, 1),
            ],
            'monthly_revenue'     => $monthlyRevenue,
            'prev_year_revenue'   => $prevYearRevenue,
            'orders_by_status'    => $ordersByStatus,
            'low_stock'           => $lowStock,
            'recent_orders'       => $recentOrders,
            'top_products'        => $topProducts,
            'heatmap'             => $heatmap,
            'scatter_products'    => $scatterProducts,
            'stacked_by_category' => $stackedByCategory,
        ]);
    }
}
