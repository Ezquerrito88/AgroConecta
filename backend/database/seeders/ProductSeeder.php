<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Creamos una categoría por defecto si no existe
        $categoria = \App\Models\Category::firstOrCreate(
            ['id' => 1],
            ['name' => 'Verduras', 'description' => 'Productos frescos de la huerta']
        );

        // 2. Creamos un usuario agricultor por defecto si no existe
        $farmer = \App\Models\User::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Jose Javier',
                'email' => 'jose@agroconecta.com',
                'password' => bcrypt('password123'),
                'role' => 'farmer' // O el campo de rol que uses
            ]
        );

        $productos = [
            ['name' => 'Lechuga Fresca', 'description' => 'Textura perfecta, sabor ideal.', 'price' => 1.50, 'unit' => 'ud'],
            ['name' => 'Tomate de Huerta', 'description' => 'Rojos, jugosos y dulces.', 'price' => 3.20, 'unit' => 'kg'],
            ['name' => 'Zanahoria Eco', 'description' => 'Directas de la tierra de Logroño.', 'price' => 1.20, 'unit' => 'manojo'],
            ['name' => 'Patata Riojana', 'description' => 'Especial para freír o asar.', 'price' => 0.90, 'unit' => 'kg'],
            ['name' => 'Pimiento Rojo', 'description' => 'Carnosos y de temporada.', 'price' => 2.50, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
            ['name' => 'Cebolla Dulce', 'description' => 'Sabor suave, no pica.', 'price' => 1.10, 'unit' => 'kg'],
        ];

        foreach ($productos as $p) {
            \App\Models\Product::create([
                'farmer_id' => $farmer->id,   // Usamos la ID del que acabamos de crear
                'category_id' => $categoria->id, // Usamos la ID de la que acabamos de crear
                'name' => $p['name'],
                'description' => $p['description'],
                'price' => $p['price'],
                'unit' => $p['unit'],
                'stock_quantity' => 100,
                'moderation_status' => 'approved'
            ]);
        }
    }
}
