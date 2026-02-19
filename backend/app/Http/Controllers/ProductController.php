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
        $perPage = $request->query('per_page', 12);

        $query = Product::with(['category', 'images', 'farmer'])
            ->where('moderation_status', 'approved');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('name', $request->category));
        }

        if ($request->filled('location')) {
            $query->whereHas('farmer', fn($q) => $q->where('city', $request->location));
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        $query->orderBy(
            'created_at',
            $request->orden === 'precio_asc'  ? 'asc'  : ($request->orden === 'precio_desc' ? 'desc' : 'desc')
        );

        if (in_array($request->orden, ['precio_asc', 'precio_desc'])) {
            $query->reorder()->orderBy(
                'price',
                $request->orden === 'precio_asc' ? 'asc' : 'desc'
            );
        }

        return response()->json($query->paginate($perPage));
    }



    // Crear una función específica para destacados
    public function getLatest(Request $request)
    {
        $perPage  = $request->query('per_page', 6);
        $page     = $request->query('page', 1);
        $categoria = $request->query('categoria');
        $orden     = $request->query('orden', 'novedad');
        $precioMin = $request->query('precio_min');
        $precioMax = $request->query('precio_max');

        $query = Product::with(['images', 'farmer', 'category'])
            ->where('moderation_status', 'approved');

        // Filtro categoría
        if ($categoria && $categoria !== 'todas') {
            $query->whereHas('category', function ($q) use ($categoria) {
                $q->whereRaw('LOWER(name) = ?', [strtolower($categoria)]);
            });
        }

        // Filtro precio
        if (!is_null($precioMin)) $query->where('price', '>=', (float) $precioMin);
        if (!is_null($precioMax)) $query->where('price', '<=', (float) $precioMax);

        // Ordenación
        match ($orden) {
            'precio_asc'  => $query->orderBy('price', 'asc'),
            'precio_desc' => $query->orderBy('price', 'desc'),
            default       => $query->orderBy('created_at', 'desc'),
        };

        $products = $query->paginate($perPage, ['*'], 'page', $page);

        // Sin filtros activos mantenemos el límite de 12
        $hayFiltros = $categoria || $precioMin || $precioMax || $orden !== 'novedad';

        if (!$hayFiltros) {
            $data = $products->getCollection()->take(12 - (($page - 1) * $perPage));
            return response()->json([
                'data'         => $data->values(),
                'total'        => min($products->total(), 12),
                'per_page'     => (int) $perPage,
                'current_page' => (int) $page,
                'last_page'    => min($products->lastPage(), 2),
            ]);
        }

        // Con filtros devolvemos todo sin límite artificial
        return response()->json([
            'data'         => $products->getCollection()->values(),
            'total'        => $products->total(),
            'per_page'     => (int) $perPage,
            'current_page' => (int) $page,
            'last_page'    => $products->lastPage(),
        ]);
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
            'season_end'         => 'nullable|date',
            'images'             => 'nullable|array',
            'images.*'           => 'image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $product = Product::create([
            'farmer_id'          => $request->user()->farmer->id,
            'category_id'        => $validated['category_id'],
            'name'               => $validated['name'],
            'description'        => $validated['description'],
            'price'              => $validated['price'],
            'unit'               => $validated['unit'],
            'stock_quantity'     => $validated['stock_quantity'],
            'season_end'         => $validated['season_end'] ?? null,
            'moderation_status' => 'approved'
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
        $product = Product::with(['category', 'images', 'farmer.farmer', 'reviews.user'])->find($id);

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

        if ($request->user()->id !== $product->farmer_id) {
            return response()->json(['message' => 'No tienes permisos para editar este producto'], 403);
        }

        $validated = $request->validate([
            'category_id'        => 'sometimes|exists:categories,id',
            'name'               => 'sometimes|string|max:255',
            'description'        => 'sometimes|string|max:255',
            'price'              => 'sometimes|numeric|min:0',
            'unit'               => 'sometimes|in:kg,g,l,ml,ud,docena,manojo,caja,bandeja,saco,pack',
            'stock_quantity'     => 'sometimes|integer|min:0',
            'season_end'         => 'sometimes|date',
            'images'             => 'sometimes|array',
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

        if ($request->user()->id != $product->farmer_id) {
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
