<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Farmer;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // 1. Enviamos a Google
    public function redirectToGoogle(Request $request)
    {
        // El frontend nos envía ?role=agricultor o ?role=comprador
        $rol = $request->query('role', 'buyer');
        
        // Lo guardamos en memoria para recordarlo cuando vuelva de Google
        session(['google_role_intent' => $rol]);

        return Socialite::driver('google')->redirect();
    }

    // 2. Volvemos de Google
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // --- FASE 1: TRADUCCIÓN (Frontend Español -> Backend Inglés) ---
            // Recuperamos la intención: ¿Qué botón pulsó?
           $intent = session('google_role_intent', 'buyer');

            // Si pulsó 'agricultor', guardamos 'farmer'. Si no, 'buyer'.
            $dbRole = ($intent === 'agricultor') ? 'farmer' : 'buyer';

            // --- FASE 2: CREAR O ACTUALIZAR USUARIO (Tabla users) ---
            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'role' => $dbRole, // Guardamos 'farmer' o 'buyer'
                    // password, phone y address se quedan null
                ]
            );

            // --- FASE 3: SI ES AGRICULTOR, CREAR PERFIL (Tabla farmer_profiles) ---
            if ($dbRole === 'farmer') {
                // Buscamos si ya tiene ficha. Si no, la creamos vacía.
                Farmer::firstOrCreate(
                    ['user_id' => $user->id], 
                    [
                        // Datos iniciales vacíos o por defecto
                        'is_verified' => 0,
                        'bio' => 'Bienvenido a mi perfil de agricultor.',
                        // farm_name se queda null hasta que lo edite
                    ]
                );
            }

            // --- FASE 4: TOKEN ---
            $token = $user->createToken('Google Token')->plainTextToken;

            return response()->json([
                'message' => 'Login exitoso',
                'user' => $user,
                'role' => $dbRole, // Para que veas que se guardó en inglés
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error en login: ' . $e->getMessage()], 500);
        }
    }
}