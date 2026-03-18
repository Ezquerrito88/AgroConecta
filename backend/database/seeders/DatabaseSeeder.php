<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categorías
        $categories = [
            ['name' => 'Frutas',     'slug' => 'frutas',     'icon' => '🍎'],
            ['name' => 'Verduras',   'slug' => 'verduras',   'icon' => '🥦'],
            ['name' => 'Hortalizas', 'slug' => 'hortalizas', 'icon' => '🥕'],
            ['name' => 'Lácteos',    'slug' => 'lacteos',    'icon' => '🧀'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // 2. Usuario agricultor
        User::create([
            'name'     => 'Manolo Agricultor',
            'email'    => 'manolo@campo.com',
            'password' => Hash::make('password'),
            'role'     => 'farmer'
        ]);

        // 3. Admin
        User::create([
            'name'     => 'Admin AgroConecta',
            'email'    => 'admin@admin.com',
            'password' => Hash::make('admin123'),
            'role'     => 'admin',
        ]);

        // 4. Productos
        $this->call(ProductSeeder::class);

        $this->command->info('✅ Categorías, usuarios y productos creados correctamente.');
    }
}
