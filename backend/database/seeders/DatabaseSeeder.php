<?php

namespace Database\Seeders;

// ⚠️ IMPORTANTE: No olvides estas líneas arriba
use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. AQUÍ CREAS LAS CATEGORÍAS FIJAS 🍎🥦
        // Se crean solas cada vez que reinicies la base de datos
        $categories = [
            ['name' => 'Frutas', 'slug' => 'frutas', 'icon' => '🍎'],
            ['name' => 'Verduras', 'slug' => 'verduras', 'icon' => '🥦'],
            ['name' => 'Hortalizas', 'slug' => 'hortalizas', 'icon' => '🥕'],
            ['name' => 'Lácteos', 'slug' => 'lacteos', 'icon' => '🧀'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // 2. CREA TAMBIÉN UN AGRICULTOR PARA PRUEBAS (Opcional pero recomendado)
        User::create([
            'name' => 'Manolo Agricultor',
            'email' => 'manolo@campo.com',
            'password' => Hash::make('password'),
            'role' => 'farmer'
        ]);

        User::create([
            'name' => 'Admin AgroConecta',
            'email' => 'admin@admin.com',
            'password' => Hash::make('admin123'), // No olvides el Hash
            'role' => 'admin',
        ]);


        
        // Mensaje para avisar en la terminal
        $this->command->info('✅ Categorías y Usuario Manolo creados correctamente.');
    }
}