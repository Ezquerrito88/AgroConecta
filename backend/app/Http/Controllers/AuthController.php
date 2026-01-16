<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Farmer;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    //Registro manual
    public function register(Request $request)
    {
        //A. Validar datos
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|unique:users,email',
            'password' => 'required|string|confirmed',
            'role' => ['required', Rule::in(['buyer', 'farmer', 'admin'])],
        ]);

        //B. Crear Usuario
        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
        ]);

        //C. Si es Agricultor, crear perfil vacío
        if ($fields['role'] === 'farmer') {
            Farmer::create([
                'user_id' => $user->id,
                'is_verified' => 0,
                'bio' => 'Nuevo agricultor registrado manualmente.',
            ]);
        }

        //D. Crear Token
        $token = $user->createToken('myapptoken')->plainTextToken;

        //E. Respuesta
        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Usuario registrado correctamente'
        ], 201);
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
            $googleUser = Socialite::driver('google')->user();

            //1. Buscamos si el usuario YA existe
            $existingUser = User::where('email', $googleUser->getEmail())->first();

            //Si existe no actualizamos el rol
            if ($existingUser) {
                $user = $existingUser;
                $user->update([
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                ]);

            } else {
                //Si no existe creamos el usuario
                $intent = session('google_role_intent', 'buyer');
                
                //Convertimos el boton a rol
                $newRole = ($intent === 'agricultor' || $intent === 'farmer') ? 'farmer' : 'buyer';

                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'role' => $newRole,
                    'password' => null, //Es null porque entra con Google
                ]);

                //Si es nuevo y es agricultor le creamos la ficha
                if ($newRole === 'farmer') {
                    Farmer::create([
                        'user_id' => $user->id,
                        'is_verified' => 0,
                        'bio' => 'Nuevo agricultor (Google).',
                    ]);
                }
            }

            //Borramos tokens viejos por seguridad
            $user->tokens()->delete();
            
            $token = $user->createToken('Google Token')->plainTextToken;

            return response()->json([
                'message' => 'Login exitoso',
                'user' => $user,
                'role' => $user->role,
                'token' => $token
            ]);

        } catch (\Exception $e) { //Si hay algún error, devolvemos el mensaje
            return response()->json(['error' => 'Error en login: ' . $e->getMessage()], 500);
        }
    }
}