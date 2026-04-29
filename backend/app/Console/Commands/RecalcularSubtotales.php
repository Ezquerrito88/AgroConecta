<?php

namespace App\Console\Commands;

use App\Models\OrderItem;
use Illuminate\Console\Command;

class RecalcularSubtotales extends Command
{
    protected $signature   = 'pedidos:recalcular-subtotales';
    protected $description = 'Recalcula subtotal = price * quantity en items con subtotal 0 o null';

    public function handle(): void
    {
        $items = OrderItem::where(function ($q) {
            $q->whereNull('subtotal')
              ->orWhere('subtotal', 0);
        })->get();

        $this->info("Items a corregir: {$items->count()}");

        $items->each(function (OrderItem $item) {
            $item->update([
                'subtotal' => round((float) $item->price * $item->quantity, 2)
            ]);
        });

        $this->info('Subtotales recalculados correctamente.');
    }
}