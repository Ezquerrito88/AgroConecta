<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Farmer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Registro Manual
     */
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
            $this->createFarmerProfile($user->id);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Usuario registrado correctamente'
        ], 201);
    }

    /**
     * Login Manual
     */
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

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    /**
     * Redirección a Google
     */
    public function redirectToGoogle(Request $request)
    {
        $role = $request->query('role', 'buyer');
        
        // Pasamos el rol en el parámetro 'state'
        return Socialite::driver('google')
            ->with(['state' => 'role=' . $role])
            ->redirect();
    }

    /**
     * Callback de Google
     */
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Recuperar el rol desde el state
            $state = $request->input('state');
            parse_str($state, $result);
            $intendedRole = $result['role'] ?? 'buyer';

            // Buscar por email o por ID de Google
            $user = User::where('email', $googleUser->getEmail())
                        ->orWhere('google_id', $googleUser->getId())
                        ->first();

            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'role' => $intendedRole,
                    'password' => Hash::make(Str::random(24)), 
                ]);

                if ($intendedRole === 'farmer') {
                    $this->createFarmerProfile($user->id);
                }
            } else {
                // Actualizar ID de Google por si acaso
                $user->update(['google_id' => $googleUser->getId()]);
            }

            // Sanctum Token
            $user->tokens()->delete();
            $token = $user->createToken('Google Token')->plainTextToken;

            // Datos Base64 para Angular
            $userData = base64_encode(json_encode([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]));

            // Redirección dinámica según el .env
            $frontendUrl = env('FRONTEND_URL', 'https://agroconecta.store');
            
            return redirect("{$frontendUrl}/login-success?token={$token}&data={$userData}");

        } catch (\Exception $e) {
            dd($e->getMessage());
            \Log::error("Error Auth Google: " . $e->getMessage());
            return redirect(env('FRONTEND_URL') . '/login?error=auth_failed');
        }
    }

    private function createFarmerProfile($userId)
    {
        Farmer::updateOrCreate(
            ['user_id' => $userId],
            ['is_verified' => 0, 'bio' => 'Agricultor nuevo.']
        );
    }
}