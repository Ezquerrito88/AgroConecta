<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    //Listar todos los productos
    public function index(Request $request)
    {
        $query =Product::with(['category','images', 'farmer']);

        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        return response()->json($products);
    }

    //Crear productos
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'        => 'required|exists:categories,id',
            'name'               => 'required|string|max:255',
            'description'        => 'required|string|max:255',
            'price'              => 'required|numeric|min:0',
            'unit'               => 'required|in:kg,g,l,ml,ud,docena,manojo,caja,bandeja,saco,pack',
            'stock_quantity'     => 'required|integer|min:0',
            'stock_quantity'     => 'required|numeric',
            'season_end'         => 'nullable|date',
            'images'             => 'nullable|array',
            'moderation_status'  => 'required|string|max:255',
            'images.*'           => 'image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $product = Product::create([
            'farmer_id'          => $request->user()->id,
            'category_id'        => $validated['category_id'],
            'name'               => $validated['name'],
            'description'        => $validated['description'],
            'price'              => $validated['price'],
            'unit'               => $validated['unit'],
            'stock_quantity'     => $validated['stock_quantity'],
            'season_end'         => $validated['season_end'] ?? null,
            'moderation_status' => 'accepted'
        ]);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
               $path = $file->store('public', 'public');

               ProductImage::create([
                   'product_id'   => $product->id,
                   'image_path'   => $path
               ]);
            }
        }

        return response()->json($product->load('images'), 201);
    }

   //Mostrar producto
    public function show($id)
    {
        $product = Product::with(['category','images', 'farmer'])->find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        return response()->json($product);
    }

    //Actualizar producto
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        if ($request->farmer_id != $product->farmer_id) {
            return response()->json(['message' => 'No tienes permisos para editar este producto'], 403);
        }

        $validated = $request->validate([
            'category_id'        => 'required|exists:categories,id',
            'name'               => 'required|string|max:255',
            'description'        => 'required|string|max:255',
            'price'              => 'required|numeric|min:0',
            'unit'               => 'required|in:kg,g,l,ml,ud,docena,manojo,caja,bandeja,saco,pack',
            'stock_quantity'     => 'required|integer|min:0',
            'season_end'         => 'nullable|date',
            'images'             => 'nullable|array',
            'images.*'           => 'image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

       $dataToUpdate = collect($validated)->except('images')->toArray();
       $product->update($dataToUpdate);

       if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                // 1. Guardar archivo en disco
                $path = $image->store('products', 'public');

                // 2. Crear registro en BD
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path
                ]);
            }
        }

        return response()->json([
            'message' => 'Producto actualizado correctamente',
            'product' => $product->load('images') 
        ]);
    }

    //Eliminar producto
    public function destroy(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        if ($request->farmer_id != $product->farmer_id) {
            return response()->json(['message' => 'No tienes permisos para eliminar este producto'], 403);
        }

        foreach ($product->images as $image) {
            if (Storage::disk('public')->exists($image->image_path)) {
                Storage::disk('public')->delete($image->image_path);
            }
        }

        $product->delete();

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }
}