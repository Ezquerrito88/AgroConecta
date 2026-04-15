<x-mail::message>
# ¡Gracias por tu pedido, {{ $order->buyer->name }}!

Hemos recibido tu pedido correctamente. Aquí tienes el resumen:

**Pedido #{{ $order->id }}** — {{ $order->created_at->format('d/m/Y') }}

<x-mail::table>
| Producto | Cantidad | Precio unitario | Subtotal |
|:---------|:--------:|:---------------:|---------:|
@foreach ($order->items as $item)
| {{ $item->product->name }} | {{ $item->quantity }} | {{ number_format($item->price, 2) }} € | {{ number_format($item->subtotal, 2) }} € |
@endforeach
</x-mail::table>

**Total del pedido: {{ number_format($order->total, 2) }} €**

📦 **Dirección de envío:** {{ $order->shipping_address ?? 'No especificada' }}

@if ($order->notes)
📝 **Notas:** {{ $order->notes }}
@endif

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>