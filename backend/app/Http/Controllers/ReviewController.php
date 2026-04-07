<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    // Devuelve los productos valorables (pedidos delivered sin review)
    public function pendientes()
    {
        $userId = Auth::id();

        $orders = Order::with(['items.product.images'])
            ->where('buyer_id', $userId)
            ->where('status', 'delivered')
            ->get();

        $revisados = Review::where('user_id', $userId)->pluck('product_id')->toArray();

        $pendientes = [];

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $productId = $item->product_id;
                if (!in_array($productId, $revisados) && $item->product) {
                    // Evita duplicados
                    if (!isset($pendientes[$productId])) {
                        $pendientes[$productId] = [
                            'order_id'   => $order->id,
                            'product_id' => $productId,
                            'product'    => $item->product,
                        ];
                    }
                }
            }
        }

        return response()->json(array_values($pendientes));
    }

    // Devuelve las reviews ya hechas por el usuario
    public function misReviews()
    {
        $reviews = Review::with('product.images')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    // Crea una nueva review
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        $userId = Auth::id();

        // Verifica que el usuario tiene un pedido delivered con ese producto
        $tieneAcceso = Order::where('buyer_id', $userId)
            ->where('status', 'delivered')
            ->whereHas('items', fn($q) => $q->where('product_id', $request->product_id))
            ->exists();

        if (!$tieneAcceso) {
            return response()->json(['message' => 'No puedes valorar este producto'], 403);
        }

        // Evita valoraciones duplicadas
        $yaValorado = Review::where('user_id', $userId)
            ->where('product_id', $request->product_id)
            ->exists();

        if ($yaValorado) {
            return response()->json(['message' => 'Ya has valorado este producto'], 409);
        }

        $review = Review::create([
            'product_id' => $request->product_id,
            'user_id'    => $userId,
            'rating'     => $request->rating,
            'comment'    => $request->comment,
        ]);

        return response()->json($review->load('product.images'), 201);
    }
}
