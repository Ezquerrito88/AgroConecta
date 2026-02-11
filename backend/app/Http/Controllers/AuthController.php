<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Farmer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    //Registro manual
    public function register(Request $request)
{
    $fields = $request->validate([
        'name' => 'required|string',
        'email' => 'required|string|unique:users,email',
        'password' => 'required|string|confirmed',
        'role' => 'required|in:buyer,farmer',
    ]);

    $user = User::create([
        'name' => $fields['name'],
        'email' => $fields['email'],
        'password' => Hash::make($fields['password']),
        'role' => $fields['role'],
    ]);

    if ($fields['role'] === 'farmer') {
        Farmer::create([
            'user_id' => $user->id,
            'is_verified' => 0,
            'bio' => 'Agricultor nuevo.',
        ]);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
        'message' => 'Usuario registrado correctamente'
    ], 201);
}

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login correcto',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    //Login con Google
    public function redirectToGoogle(Request $request)
    {
        $rol = $request->query('role', 'buyer');
        session(['google_role_intent' => $rol]);
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            // Intentamos obtener el usuario SIN estado (stateless)
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Buscamos usuario por email
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                // Si no existe, lo creamos como Comprador (buyer) por defecto
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'role' => 'buyer', // Rol por defecto
                    'password' => null, // Sin contraseña
                ]);
            } else {
                // Si existe, actualizamos su ID de Google y Nombre
                $user->update([
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                ]);
            }

            // Borramos tokens viejos y creamos uno nuevo
            $user->tokens()->delete();
            $token = $user->createToken('Google Token')->plainTextToken;

            // Preparamos datos para Angular
            $userData = json_encode([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]);

            // Redirigimos a Angular (Ajusta el puerto si es necesario)
            return redirect("http://localhost:4200/login-success?token={$token}&user={$userData}");

        } catch (\Exception $e) {
            // 👇 ESTO ES LO QUE NOS DIRÁ EL ERROR REAL
            dd("Error capturado:", $e->getMessage(), $e); 
        }
    }
}