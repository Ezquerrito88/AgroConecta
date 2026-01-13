<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    // --- LOGIN CON GOOGLE ---

    // 1. Cuando le damos al botón de Google
    public function redirectToGoogle(Request $request)
    {
        // Miramos si en la URL nos envían el rol (ej: ?role=agricultor)
        // Si no envían nada, por defecto será 'comprador'
        $rolElegido = $request->query('role', 'comprador');

        // Guardamos esa elección en la MEMORIA (Session)
        session(['google_role_intent' => $rolElegido]);

        return Socialite::driver('google')->redirect();
    }

    // 2. Cuando volvemos de Google
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Recuperamos la elección de la MEMORIA
            // Si por lo que sea se ha borrado, ponemos 'comprador' por seguridad
            $role = session('google_role_intent', 'comprador');

            // Buscamos al usuario o lo creamos con ese ROL
            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'role' => $role, // <--- AQUÍ APLICAMOS EL ROL ELEGIDO
                    // La contraseña se queda null o lo que tuvieras
                ]
            );

            // Creamos el token
            $token = $user->createToken('Google Token')->plainTextToken;

            return response()->json([
                'message' => 'Login exitoso',
                'user' => $user,
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error en el login: ' . $e->getMessage()], 500);
        }
    }

    // --- LOGIN NORMAL (Email y Contraseña) ---

    public function register(Request $request) {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'comprador'
        ]);

        return response()->json([
            'message' => 'Usuario registrado',
            'token' => $user->createToken('API Token')->plainTextToken
        ], 201);
    }

    public function login(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        $user = User::where('email', $request->email)->first();
        
        return response()->json([
            'message' => 'Login correcto',
            'user' => $user,
            'token' => $user->createToken('API Token')->plainTextToken
        ]);
    }
}