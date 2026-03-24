<?php

namespace App\Http\Controllers;

use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function destroy(Request $request, $id)
    {
        $productImage = ProductImage::with('product')->find($id);

        if (!$productImage) {
            return response()->json(['message' => 'Imagen no encontrada'], 404);
        }

        if ($request->user()->id !== $productImage->product->farmer_id) {
            return response()->json(['message' => 'No tienes permisos para eliminar esta imagen'], 403);
        }

        if (Storage::disk('azure')->exists($productImage->image_path)) {
            Storage::disk('azure')->delete($productImage->image_path);
        }

        $productImage->delete();

        return response()->json(['message' => 'Imagen eliminada correctamente']);
    }
}
