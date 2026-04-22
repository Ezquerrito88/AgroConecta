<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Category;
use App\Models\Farmer;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $farmers = Farmer::all();
        $categories = Category::all();
        $unidades = ['kg', 'ud', 'manojo', 'caja', 'docena', 'l', 'saco', 'pack'];

        if ($farmers->isEmpty() || $categories->isEmpty()) {
            $this->command->warn('Faltan agricultores o categorías. Ejecuta primero DatabaseSeeder.');
            return;
        }

        for ($i = 1; $i <= 100; $i++) {
            $farmer = $farmers->random();
            $cat = $categories->random();
            
            $productName = $cat->name . " Especial de " . $farmer->farm_name;

            $product = Product::create([
                'farmer_id'         => $farmer->id,
                'category_id'       => $cat->id,
                'name'              => $productName,
                'slug'              => Str::slug($productName) . '-' . $i,
                'description'       => "Este producto de la categoría {$cat->name} ha sido cultivado siguiendo métodos tradicionales en {$farmer->city}. Garantizamos frescura máxima desde la cosecha hasta su mesa.",
                'short_description' => "Calidad superior directamente desde {$farmer->city}.",
                'price'             => rand(15, 300) / 10,
                'unit'              => $unidades[array_rand($unidades)],
                'stock_quantity'    => rand(10, 200),
                'moderation_status' => 'approved',
                'created_at'        => Carbon::now()->subMonths(rand(1, 12))->subDays(rand(0, 30)),
            ]);

            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => "https://loremflickr.com/640/480/agriculture,food?lock=" . $i,
            ]);
        }

        $this->command->info('✅ ProductSeeder: 100 productos creados y asignados a tus agricultores.');
    }
}