<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * Helper inteligente para generar URLs de imágenes.
     * Soporta Local (public) y Azure Blob Storage.
     */
    private function getImageUrl(?string $path): ?string
    {
        if (!$path) return asset('img/default-product.png');

        // Si ya es una URL completa (ej. de una semilla o externa), la devolvemos tal cual
        if (filter_var($path, FILTER_VALIDATE_URL)) return $path;

        // Detectamos el disco actual desde el .env
        $disk = config('filesystems.default', 'public');

        if ($disk === 'azure') {
            $account = config('filesystems.disks.azure.name');
            $container = config('filesystems.disks.azure.container');
            return "https://{$account}.blob.core.windows.net/{$container}/{$path}";
        }

        // Por defecto, asume almacenamiento local
        return asset('storage/' . $path);
    }

    /**
     * Catálogo general de productos (Frontend)
     */
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 12);
        
        $products = Product::with(['category', 'images'])
            ->where('moderation_status', 'approved')
            ->paginate($perPage)
            ->through(function ($product) {
                $product->image_url = $this->getImageUrl($product->images->first()?->image_path);
                return $product;
            });

        return response()->json($products);
    }

    /**
     * Guardar un nuevo producto
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'       => 'required|exists:categories,id',
            'name'              => 'required|string|max:255',
            'description'       => 'required|string',
            'short_description' => 'nullable|string|max:50',
            'price'             => 'required|numeric|min:0',
            'unit'              => 'required|in:kg,g,l,ml,ud,docena,manojo,caja,bandeja,saco,pack',
            'stock_quantity'    => 'required|integer|min:0',
            'season_end'        => 'nullable|date',
            'images'            => 'nullable|array|max:6',
            'images.*'          => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $product = Product::create([
                'farmer_id'         => $request->user()->farmer->id,
                'category_id'       => $validated['category_id'],
                'name'              => $validated['name'],
                'description'       => $validated['description'],
                'short_description' => $validated['short_description'] ?? null,
                'price'             => $validated['price'],
                'unit'              => $validated['unit'],
                'stock_quantity'    => $validated['stock_quantity'],
                'season_end'        => $validated['season_end'] ?? null,
                'moderation_status' => 'approved',
            ]);

            if ($request->hasFile('images')) {
                $disk = config('filesystems.default', 'public');
                foreach ($request->file('images') as $file) {
                    $path = $file->store('products', $disk);
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_path' => $path,
                    ]);
                }
            }

            return response()->json($product->load('images'), 201);
        });
    }

    /**
     * Detalle de un producto (Lo que Angular llamaba y fallaba)
     */
    public function show($id)
    {
        $product = Product::with(['category', 'images', 'farmer.user', 'reviews.user'])->find($id);

        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        // Mapeamos las imágenes para incluir la URL real
        $product->images->transform(function ($image) {
            $image->url = $this->getImageUrl($image->image_path);
            return $image;
        });

        // Añadimos una propiedad extra para la imagen principal fácil de acceder
        $product->main_image_url = $this->getImageUrl($product->images->first()?->image_path);

        return response()->json($product);
    }

    /**
     * Listado para el panel del Agricultor (Mis Productos)
     */
    public function misProductos(Request $request)
    {
        $farmer = $request->user()->farmer;
        if (!$farmer) return response()->json(['message' => 'No eres agricultor'], 403);

        $perPage = $request->query('per_page', 12);
        $todos = Product::where('farmer_id', $farmer->id)->get();
        
        $kpis = [
            'total'       => $todos->count(),
            'agotados'    => $todos->where('stock_quantity', 0)->count(),
            'pocoStock'   => $todos->where('stock_quantity', '>', 0)->filter(fn($p) => $p->stock_quantity <= 10)->count(),
            'disponibles' => $todos->where('stock_quantity', '>', 0)->count(),
        ];

        $productos = Product::with(['category', 'images'])
            ->where('farmer_id', $farmer->id)
            ->paginate($perPage)
            ->through(function ($product) {
                return [
                    'id'          => $product->id,
                    'name'        => $product->name,
                    'description' => $product->description,
                    'price'       => $product->price,
                    'unit'        => $product->unit,
                    'stock'       => $product->stock_quantity,
                    'max_stock'   => max($product->stock_quantity, 100),
                    'sold'        => 0,
                    'rating'      => 4.9,
                    'category'    => $product->category?->name,
                    'image'       => $this->getImageUrl($product->images->first()?->image_path),
                    'created_at'  => $product->created_at,
                ];
            });

        return response()->json([
            'kpis'      => $kpis,
            'productos' => $productos,
        ]);
    }

    /**
     * Eliminar producto y sus archivos
     */
    public function destroy(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'No encontrado'], 404);

        $disk = config('filesystems.default', 'public');

        foreach ($product->images as $image) {
            if (Storage::disk($disk)->exists($image->image_path)) {
                Storage::disk($disk)->delete($image->image_path);
            }
        }

        $product->delete();
        return response()->json(['message' => 'Producto eliminado correctamente']);
    }
}