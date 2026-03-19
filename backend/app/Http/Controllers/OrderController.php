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
        $validated = $request->validate([
            'items'           => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'farmer_id'       => 'nullable|exists:users,id',
            'shipping_address'=> 'nullable|string',
            'discount_code'   => 'nullable|string|max:40',
            'discount_pct'    => 'nullable|numeric|min:0|max:100',
            'payment_method'  => 'nullable|in:card,paypal,bizum,cash_on_delivery',
            'payment_intent_id' => 'nullable|string|max:255',
            'payment_transaction_id' => 'nullable|string|max:255',
        ]);

        $items = collect($validated['items']);
        $productIds = $items->pluck('product_id')->unique();

        // Single query with eager loading
        $products = Product::with('farmer:id,user_id')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        if ($products->count() !== $productIds->count()) {
            return response()->json(['message' => 'Uno o más productos no existen.'], 422);
        }

        // Check all products belong to same farmer
        $farmerUserIds = $products->pluck('farmer.user_id')->filter()->unique();

        if ($farmerUserIds->count() !== 1) {
            return response()->json(['message' => 'Todos los productos deben ser del mismo agricultor.'], 422);
        }

        $farmerUserId = (int) $farmerUserIds->first();

        if (isset($validated['farmer_id']) && (int) $validated['farmer_id'] !== $farmerUserId) {
            return response()->json(['message' => 'El agricultor no coincide con los productos.'], 422);
        }

        // Validate stock and calculate totals
        $lineItems = [];
        $total = 0;

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);

            if ($product->stock_quantity < $item['quantity']) {
                return response()->json(['message' => "Stock insuficiente para {$product->name}."], 422);
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

        // Apply discount
        $discountPct = min(100, max(0, (float) ($validated['discount_pct'] ?? 0)));
        $discountAmount = round($total * ($discountPct / 100), 2);
        $finalTotal = $total - $discountAmount;

        // Create order and items in transaction
        $order = DB::transaction(function () use ($validated, $lineItems, $finalTotal, $farmerUserId, $products, $discountPct, $discountAmount, $request) {
            $shippingAddress = $validated['shipping_address'] ?? '';

            if ($discountPct > 0 && !empty($validated['discount_code'])) {
                $discountNote = sprintf('Descuento: %s (%.0f%%, -%.2f EUR)', $validated['discount_code'], $discountPct, $discountAmount);
                $shippingAddress = trim(($shippingAddress ? $shippingAddress . ' | ' : '') . $discountNote);
            }

            $paymentMethod = $validated['payment_method'] ?? 'cash_on_delivery';
            $paymentStatus = in_array($paymentMethod, ['cash_on_delivery', 'bizum']) ? 'processing' : 'pending';

            $order = Order::create([
                'buyer_id' => $request->user()->id,
                'farmer_id' => $farmerUserId,
                'total' => $finalTotal,
                'shipping_address' => $shippingAddress,
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentMethod,
                'payment_intent_id' => $validated['payment_intent_id'] ?? null,
                'payment_transaction_id' => $validated['payment_transaction_id'] ?? null,
            ]);

            // Bulk insert items and update stock
            $order->items()->createMany($lineItems);
            
            foreach ($lineItems as $item) {
                Product::where('id', $item['product_id'])->decrement('stock_quantity', $item['quantity']);
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
