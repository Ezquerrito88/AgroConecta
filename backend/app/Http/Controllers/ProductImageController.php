<?php

namespace App\Http\Controllers;

use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    //Elinir imagen de producto
    public function destroy(Request $request, $id)
    {
        $productImage = ProductImage::find($id);

        if (!$productImage) {
            return response()->json(['message' => 'Imagen no encontrada'], 404);
        }

        if ($request->farmer_id != $productImage->product->farmer_id) {
            return response()->json(['message' => 'No tienes permisos para eliminar esta imagen'], 403);
        }

        if (Storage::disk('public')->exists($productImage->image_path)) {
            Storage::disk('public')->delete($productImage->image_path);
        }

        $productImage->delete();

        return response()->json(['message' => 'Imagen eliminada correctamente']);
    }
}
