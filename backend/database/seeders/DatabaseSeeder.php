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

        // 2. 5 Agricultores con nombre@campo.com
        $datosHuertas = [
            ['nombre' => 'Manolo', 'finca' => 'Huerta de Manolo', 'ciudad' => 'Logroño'],
            ['nombre' => 'Paco', 'finca' => 'Finca El Olivo', 'ciudad' => 'Sevilla'],
            ['nombre' => 'Ramona', 'finca' => 'EcoCultivos Rioja', 'ciudad' => 'Arnedo'],
            ['nombre' => 'Vicente', 'finca' => 'Ares de Campo', 'ciudad' => 'Almeria'],
            ['nombre' => 'Santiago', 'finca' => 'La Huerta de Santi', 'ciudad' => 'Vigo'],
        ];
        
        foreach ($datosHuertas as $datos) {
            $email = Str::lower(Str::ascii($datos['nombre'])) . '@campo.com';

            $user = User::create([
                'name'     => $datos['nombre'],
                'email'    => $email,
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

        // 3. 10 Compradores con nombre@gmail.com
        $nombresCompradores = [
            'Elena', 'Roberto', 'Marta', 'Diego', 'Sofia', 
            'Ignacio', 'Laura', 'Andres', 'Beatriz', 'Oscar'
        ];

        foreach ($nombresCompradores as $nombre) {
            $email = Str::lower(Str::ascii($nombre)) . '@gmail.com';

            User::create([
                'name'     => $nombre,
                'email'    => $email,
                'password' => Hash::make('password'),
                'role'     => 'buyer'
            ]);
        }

        // 4. Admin
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

        $this->command->info('✅ Seed completo: Correos personalizados generados con éxito.');
    }
}