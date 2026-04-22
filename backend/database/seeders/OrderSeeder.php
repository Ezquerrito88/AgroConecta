<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $compradores = User::where('role', 'buyer')->get();
        
        $productos = Product::all();

        if ($compradores->isEmpty() || $productos->isEmpty()) {
            $this->command->warn('No hay compradores o productos suficientes para crear pedidos.');
            return;
        }

        $fechaPuntero = Carbon::now()->subYear()->startOfYear(); 
        $fechaFin = Carbon::now();

        while ($fechaPuntero <= $fechaFin) {
            $mes = $fechaPuntero->month;
            $volumen = in_array($mes, [6, 7, 8, 12]) ? rand(30, 45) : rand(12, 20);

            for ($i = 0; $i < $volumen; $i++) {
                $fechaPedido = $fechaPuntero->copy()->addDays(rand(0, 27))->addHours(rand(8, 20));
                
                $productoBase = $productos->random();

                $order = Order::create([
                    'buyer_id'         => $compradores->random()->id,
                    'farmer_id'        => $productoBase->farmer_id,
                    'total'            => 0,
                    'status'           => 'delivered',
                    'shipping_address' => 'Avenida Principal ' . rand(1, 150) . ', Logroño',
                    'created_at'       => $fechaPedido,
                    'updated_at'       => $fechaPedido,
                ]);

                $total = 0;
                $prodsValidos = $productos->where('farmer_id', $order->farmer_id);
                
                $numItems = min(rand(1, 4), $prodsValidos->count());
                $itemsSeleccionados = $prodsValidos->random($numItems);

                if ($itemsSeleccionados instanceof Product) {
                    $itemsSeleccionados = collect([$itemsSeleccionados]);
                }

                foreach ($itemsSeleccionados as $p) {
                    $cant = rand(1, 5);
                    OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $p->id,
                        'quantity'   => $cant,
                        'price'      => $p->price,
                    ]);
                    $total += ($p->price * $cant);
                }
                
                $order->update(['total' => $total]);
            }
            $fechaPuntero->addMonth();
        }

        $this->command->info('✅ Pedidos generados usando los agricultores y compradores existentes.');
    }
}