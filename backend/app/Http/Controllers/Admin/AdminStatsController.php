<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    public function index()
    {
        // Usuarios
        $totalUsers   = User::count();
        $totalFarmers = User::where('role', 'farmer')->count();
        $totalBuyers  = User::where('role', 'buyer')->count();
        $newUsersMonth = User::whereMonth('created_at', now()->month)
                             ->whereYear('created_at', now()->year)
                             ->count();

        // Productos
        $totalProducts    = Product::count();
        $pendingProducts  = Product::where('moderation_status', 'pending')->count();
        $approvedProducts = Product::where('moderation_status', 'approved')->count();
        $rejectedProducts = Product::where('moderation_status', 'rejected')->count();

        // Pedidos
        $totalOrders    = Order::count();
        $ordersMonth    = Order::whereMonth('created_at', now()->month)
                               ->whereYear('created_at', now()->year)
                               ->count();
        $revenueTotal   = Order::where('status', '!=', 'cancelled')->sum('total');
        $revenueMonth   = Order::where('status', '!=', 'cancelled')
                               ->whereMonth('created_at', now()->month)
                               ->whereYear('created_at', now()->year)
                               ->sum('total');

        // Categorías
        $totalCategories = Category::count();

        // Usuarios recientes
        $recentUsers = User::latest()->take(5)->get(['id', 'name', 'email', 'role', 'created_at']);

        // Productos pendientes de moderación
        $pendingList = Product::with(['farmer.user', 'category'])
                              ->where('moderation_status', 'pending')
                              ->latest()
                              ->take(5)
                              ->get();

        // Pedidos por estado
        $ordersByStatus = Order::select('status', DB::raw('count(*) as total'))
                               ->groupBy('status')
                               ->get();

        return response()->json([
            'users' => [
                'total'       => $totalUsers,
                'farmers'     => $totalFarmers,
                'buyers'      => $totalBuyers,
                'new_month'   => $newUsersMonth,
            ],
            'products' => [
                'total'    => $totalProducts,
                'pending'  => $pendingProducts,
                'approved' => $approvedProducts,
                'rejected' => $rejectedProducts,
                'latest'   => Product::with(['farmer.user', 'images'])
                    ->latest()
                    ->take(5)
                    ->get(),
            ],
            'orders' => [
                'total'         => $totalOrders,
                'month'         => $ordersMonth,
                'revenue_total' => round($revenueTotal, 2),
                'revenue_month' => round($revenueMonth, 2),
                'by_status'     => $ordersByStatus,
            ],
            'categories' => [
                'total' => $totalCategories,
            ],
            'recent_users'   => $recentUsers,
            'pending_products' => $pendingList,
        ]);
    }
}