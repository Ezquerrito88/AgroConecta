<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use App\Models\Farmer;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Obtener el usuario agricultor
        $user = User::where('email', 'manolo@campo.com')->first();

        // 2. Crear su farmer_profile
        $farmer = Farmer::firstOrCreate(
            ['user_id' => $user->id],
            [
                'farm_name'   => 'Huerta de Manolo',
                'bio'         => 'Agricultor local con productos frescos de La Rioja.',
                'city'        => 'Logroño',
                'is_verified' => true,
            ]
        );

        // 3. Productos variados por categoría
        $productos = [
            ['name' => 'Manzanas Fuji',     'category' => 'frutas',     'price' => 2.50, 'unit' => 'kg',     'description' => 'Dulces y crujientes, recién cogidas.'],
            ['name' => 'Naranjas Valencia',  'category' => 'frutas',     'price' => 1.80, 'unit' => 'kg',     'description' => 'Perfectas para zumo o postre.'],
            ['name' => 'Peras Conferencia', 'category' => 'frutas',     'price' => 2.20, 'unit' => 'kg',     'description' => 'Jugosas y de temporada.'],
            ['name' => 'Lechuga Romana',    'category' => 'verduras',   'price' => 1.20, 'unit' => 'unidad', 'description' => 'Fresca y crujiente del día.'],
            ['name' => 'Espinacas Frescas', 'category' => 'verduras',   'price' => 1.80, 'unit' => 'bolsa',  'description' => 'Tiernas y recién cortadas.'],
            ['name' => 'Acelgas de Huerta', 'category' => 'verduras',   'price' => 1.30, 'unit' => 'manojo', 'description' => 'Hojas grandes y muy nutritivas.'],
            ['name' => 'Tomates Cherry',    'category' => 'hortalizas', 'price' => 3.20, 'unit' => 'kg',     'description' => 'Dulces y perfectos para ensalada.'],
            ['name' => 'Pimiento Rojo',     'category' => 'hortalizas', 'price' => 2.50, 'unit' => 'kg',     'description' => 'Carnosos y de temporada.'],
            ['name' => 'Zanahorias Eco',    'category' => 'hortalizas', 'price' => 1.20, 'unit' => 'manojo', 'description' => 'Directas de la tierra riojana.'],
            ['name' => 'Calabacín Verde',   'category' => 'hortalizas', 'price' => 1.40, 'unit' => 'kg',     'description' => 'Ideal para plancha o guisos.'],
            ['name' => 'Queso Fresco',      'category' => 'lacteos',    'price' => 4.00, 'unit' => 'unidad', 'description' => 'Elaborado de forma artesanal.'],
            ['name' => 'Yogur Natural',     'category' => 'lacteos',    'price' => 0.90, 'unit' => 'unidad', 'description' => 'Cremoso y sin azúcares añadidos.'],
        ];

        foreach ($productos as $p) {
            $category = Category::where('slug', $p['category'])->first();

            Product::create([
                'farmer_id'         => $farmer->id,
                'category_id'       => $category->id,
                'name'              => $p['name'],
                'description'       => $p['description'],
                'price'             => $p['price'],
                'unit'              => $p['unit'],
                'stock_quantity'    => rand(10, 100),
                'moderation_status' => 'approved',
            ]);
        }

        $this->command->info('✅ Productos creados correctamente.');
    }
}
