<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // Pedidos que ha recibido el agricultor
    public function farmerOrders(Request $request)
    {
        $orders = Order::with(['buyer', 'items.product'])
            ->where('farmer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with(['buyer', 'items.product'])
            ->where('farmer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled'
        ]);

        $order = Order::where('farmer_id', $request->user()->id)->findOrFail($id);
        $order->update(['status' => $request->status]);

        return response()->json($order);
    }

    // El comprador crea un pedido
    public function store(Request $request)
    {
        $request->validate([
            'items'           => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'farmer_id'       => 'nullable|exists:users,id',
            'shipping_address'=> 'nullable|string',
            'discount_code'   => 'nullable|string|max:40',
            'discount_pct'    => 'nullable|numeric|min:0|max:100',
        ]);

        $items = collect($request->items);
        $productIds = $items->pluck('product_id')->unique()->values();

        $products = Product::with('farmer')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        if ($products->count() !== $productIds->count()) {
            return response()->json([
                'message' => 'Uno o más productos no existen.'
            ], 422);
        }

        $farmerUserIds = $items->map(function ($item) use ($products) {
            $product = $products->get($item['product_id']);
            return $product?->farmer?->user_id;
        })->filter()->unique()->values();

        if ($farmerUserIds->count() !== 1) {
            return response()->json([
                'message' => 'Todos los productos del pedido deben pertenecer al mismo agricultor.'
            ], 422);
        }

        $farmerUserId = (int) $farmerUserIds->first();

        if ($request->filled('farmer_id') && (int) $request->farmer_id !== $farmerUserId) {
            return response()->json([
                'message' => 'El agricultor indicado no coincide con los productos del pedido.'
            ], 422);
        }

        $lineItems = [];
        $total = 0;

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);

            if (!$product || !$product->farmer) {
                return response()->json([
                    'message' => 'Producto inválido en el pedido.'
                ], 422);
            }

            if ($product->stock_quantity < (int) $item['quantity']) {
                return response()->json([
                    'message' => "Stock insuficiente para {$product->name}."
                ], 422);
            }

            $price = (float) $product->price;
            $quantity = (int) $item['quantity'];
            $subtotal = $price * $quantity;

            $lineItems[] = [
                'product_id' => $product->id,
                'quantity' => $quantity,
                'price' => $price,
                'subtotal' => $subtotal,
            ];

            $total += $subtotal;
        }

        $discountPct = (float) ($request->discount_pct ?? 0);
        $discountPct = max(0, min(100, $discountPct));
        $discountAmount = round($total * ($discountPct / 100), 2);
        $finalTotal = max(0, round($total - $discountAmount, 2));

        $order = DB::transaction(function () use ($request, $lineItems, $finalTotal, $farmerUserId, $products, $discountPct, $discountAmount) {
            $shippingAddress = $request->shipping_address;

            if ($discountPct > 0 && $request->filled('discount_code')) {
                $discountNote = sprintf('Descuento aplicado: %s (%.0f%%, -%.2f EUR)', $request->discount_code, $discountPct, $discountAmount);
                $shippingAddress = trim(($shippingAddress ? $shippingAddress . ' | ' : '') . $discountNote);
            }

            $order = Order::create([
                'buyer_id' => $request->user()->id,
                'farmer_id' => $farmerUserId,
                'total' => $finalTotal,
                'shipping_address' => $shippingAddress,
            ]);

            foreach ($lineItems as $item) {
                $order->items()->create($item);
                $product = $products->get($item['product_id']);
                $product->decrement('stock_quantity', $item['quantity']);
            }

            return $order;
        });

        return response()->json($order->load('items.product'), 201);
    }

    public function buyerOrders(Request $request)
    {
        $orders = Order::with(['farmer', 'items.product'])
            ->where('buyer_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }
}
