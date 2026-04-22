<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\User;
use App\Models\Farmer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categorías
        $categories = [
            ['name' => 'Frutas', 'icon' => '🍎'], ['name' => 'Verduras', 'icon' => '🥦'],
            ['name' => 'Hortalizas', 'icon' => '🥕'], ['name' => 'Lácteos', 'icon' => '🧀'],
            ['name' => 'Legumbres', 'icon' => '🫘'], ['name' => 'Huevos', 'icon' => '🥚'],
            ['name' => 'Miel y Dulces', 'icon' => '🍯'], ['name' => 'Aceites', 'icon' => '🫒'],
            ['name' => 'Frutos Secos', 'icon' => '🥜'], ['name' => 'Carnes', 'icon' => '🥩'],
            ['name' => 'Panadería', 'icon' => '🥖'], ['name' => 'Vinos', 'icon' => '🍷'],
        ];

        foreach ($categories as $cat) {
            Category::create([
                'name' => $cat['name'],
                'slug' => Str::slug($cat['name']),
                'icon' => $cat['icon']
            ]);
        }

        // 2. 10 Agricultores con Ciudades Distintas
        $datosHuertas = [
            ['finca' => 'Huerta de Manolo', 'ciudad' => 'Logroño'],
            ['finca' => 'Finca El Olivo', 'ciudad' => 'Calahorra'],
            ['finca' => 'EcoCultivos Rioja', 'ciudad' => 'Arnedo'],
            ['finca' => 'Ares de Campo', 'ciudad' => 'Haro'],
            ['finca' => 'La Huerta de Ana', 'ciudad' => 'Alfaro'],
            ['finca' => 'Raíces Vivas', 'ciudad' => 'Nájera'],
            ['finca' => 'Sabor de Tierra', 'ciudad' => 'Lardero'],
            ['finca' => 'El Rincón Verde', 'ciudad' => 'Villamediana de Iregua'],
            ['finca' => 'Cultivos del Valle', 'ciudad' => 'Santo Domingo de la Calzada'],
            ['finca' => 'Granja El Sol', 'ciudad' => 'Autol'],
        ];
        
        foreach ($datosHuertas as $i => $datos) {
            $user = User::create([
                'name'     => "Productor " . ($i + 1),
                'email'    => "agricultor{$i}@campo.com",
                'password' => Hash::make('password'),
                'role'     => 'farmer'
            ]);

            Farmer::create([
                'user_id'     => $user->id,
                'farm_name'   => $datos['finca'],
                'bio'         => "Productor local en AgroConecta especializado en productos frescos cultivados en {$datos['ciudad']}.",
                'city'        => $datos['ciudad'],
                'is_verified' => true,
            ]);
        }

        // 3. Admin
        User::create([
            'name'     => 'Admin AgroConecta',
            'email'    => 'admin@admin.com',
            'password' => Hash::make('admin123'),
            'role'     => 'admin',
        ]);

        $this->call([
            ProductSeeder::class,
            OrderSeeder::class,
        ]);

        $this->command->info('✅ Seed completo: 10 agricultores en 10 ciudades diferentes.');
    }
}