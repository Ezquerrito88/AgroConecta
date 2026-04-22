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
        // Creamos 20 compradores ficticios
        $compradores = User::factory(20)->create(['role' => 'buyer']);
        $productos = Product::all();

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
                
                for ($j = 0; $j < rand(1, 4); $j++) {
                    $p = $prodsValidos->random();
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
    }
}