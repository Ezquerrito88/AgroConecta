<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Category;
use App\Models\Farmer;
use Carbon\Carbon;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $farmers = Farmer::all();
        $categories = Category::all();
        $unidades = ['kg', 'ud', 'manojo', 'caja', 'docena', 'l', 'saco', 'pack'];

        for ($i = 1; $i <= 200; $i++) {
            $farmer = $farmers->random();
            $cat = $categories->random();
            
            $product = Product::create([
                'farmer_id'         => $farmer->id,
                'category_id'       => $cat->id,
                'name'              => $cat->name . " de " . $farmer->farm_name,
                'description'       => "Producto fresco de temporada cultivado de forma artesanal en " . $farmer->city,
                'short_description' => "Calidad superior de " . $farmer->city,
                'price'             => rand(15, 300) / 10,
                'unit'              => $unidades[array_rand($unidades)],
                'stock_quantity'    => rand(10, 200),
                'moderation_status' => 'approved',
                'created_at'        => Carbon::now()->subYear()->addDays(rand(0, 365)),
            ]);

            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => "https://loremflickr.com/640/480/agriculture,vegetables?lock=" . $i,
            ]);
        }
    }
}