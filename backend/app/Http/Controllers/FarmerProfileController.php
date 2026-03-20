<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Farmer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class FarmerProfileController extends Controller
{
    /**
     * Mostrar perfil del agricultor
     */
    public function show()
    {
        $user = Auth::user();
        
        // Verificar que es agricultor
        if (!$user->is_farmer) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $profile = Farmer::where('user_id', $user->id)->first();
        
        return response()->json([
            'profile' => $profile ?? (object)[]
        ]);
    }

    /**
     * Actualizar perfil del agricultor
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->is_farmer) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'farm_name' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'bio' => 'nullable|string',
            'is_verified' => Rule::in([0, 1]),
        ]);

        $profile = Farmer::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'profile' => $profile->load('user')
        ]);
    }
}
