<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

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
            'farmer_id'       => 'required|exists:users,id',
            'items'           => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'required|numeric',
            'shipping_address'=> 'nullable|string',
        ]);

        $total = collect($request->items)->sum(fn($i) => $i['price'] * $i['quantity']);

        $order = Order::create([
            'buyer_id'         => $request->user()->id,
            'farmer_id'        => $request->farmer_id,
            'total'            => $total,
            'shipping_address' => $request->shipping_address,
        ]);

        foreach ($request->items as $item) {
            $order->items()->create([
                'product_id' => $item['product_id'],
                'quantity'   => $item['quantity'],
                'price'      => $item['price'],
                'subtotal'   => $item['price'] * $item['quantity'],
            ]);
        }

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
