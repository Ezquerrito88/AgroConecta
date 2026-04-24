<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Intervention\Image\Laravel\Facades\Image;

class ProductController extends Controller
{
    private function getImageUrl(?string $path): ?string
    {
        if (!$path) return asset('img/default-product.png');
        if (filter_var($path, FILTER_VALIDATE_URL)) return $path;

        $disk = config('filesystems.default', 'public');

        if ($disk === 'azure') {
            $account   = config('filesystems.disks.azure.name');
            $container = config('filesystems.disks.azure.container');
            return "https://{$account}.blob.core.windows.net/{$container}/{$path}";
        }

        return asset('storage/' . $path);
    }

    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 12);

        $query = Product::with(['category', 'images', 'farmer.user'])
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

        if (in_array($request->orden, ['precio_asc', 'precio_desc'])) {
            $query->orderBy('price', $request->orden === 'precio_asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $products = $query->paginate($perPage)->through(function ($product) {
            $product->image_url = $this->getImageUrl($product->images->first()?->image_path);
            return $product;
        });

        return response()->json($products);
    }

    public function getLatest(Request $request)
    {
        $perPage   = $request->query('per_page', 6);
        $page      = $request->query('page', 1);
        $categoria = $request->query('categoria');
        $orden     = $request->query('orden', 'novedad');
        $precioMin = $request->query('precio_min');
        $precioMax = $request->query('precio_max');

        $hayFiltros = $categoria || $precioMin || $precioMax || $orden !== 'novedad';

        $cacheKey = "products_latest_p{$page}_pp{$perPage}";

        if (!$hayFiltros) {
            $result = Cache::remember($cacheKey, 300, function () use ($perPage, $page) {
                $products = Product::with(['images', 'farmer.user', 'category'])
                    ->where('moderation_status', 'approved')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage, ['*'], 'page', $page);

                $products->through(function ($product) {
                    $product->image_url = $this->getImageUrl($product->images->first()?->image_path);
                    return $product;
                });

                $data = $products->getCollection()->take(12 - (($page - 1) * $perPage));

                return [
                    'data'         => $data->values(),
                    'total'        => min($products->total(), 12),
                    'per_page'     => (int) $perPage,
                    'current_page' => (int) $page,
                    'last_page'    => min($products->lastPage(), 2),
                ];
            });

            return response()->json($result);
        }

        // Con filtros activos → sin caché (resultados dinámicos)
        $query = Product::with(['images', 'farmer.user', 'category'])
            ->where('moderation_status', 'approved');

        if ($categoria && $categoria !== 'todas') {
            $query->whereHas('category', function ($q) use ($categoria) {
                $q->whereRaw('LOWER(name) = ?', [strtolower($categoria)]);
            });
        }

        if (!is_null($precioMin)) $query->where('price', '>=', (float) $precioMin);
        if (!is_null($precioMax)) $query->where('price', '<=', (float) $precioMax);

        match ($orden) {
            'precio_asc'  => $query->orderBy('price', 'asc'),
            'precio_desc' => $query->orderBy('price', 'desc'),
            default       => $query->orderBy('created_at', 'desc'),
        };

        $products = $query->paginate($perPage, ['*'], 'page', $page);

        $products->through(function ($product) {
            $product->image_url = $this->getImageUrl($product->images->first()?->image_path);
            return $product;
        });

        return response()->json([
            'data'         => $products->getCollection()->values(),
            'total'        => $products->total(),
            'per_page'     => (int) $perPage,
            'current_page' => (int) $page,
            'last_page'    => $products->lastPage(),
        ]);
    }

    public function show($id)
    {
        $product = Cache::remember("product_{$id}", 300, function () use ($id) {
            return Product::with(['category', 'images', 'farmer.user', 'reviews.user'])->find($id);
        });

        if (!$product) return response()->json(['message' => 'Producto no encontrado'], 404);

        $product->images->transform(function ($image) {
            $image->url = $this->getImageUrl($image->image_path);
            return $image;
        });

        $product->main_image_url = $this->getImageUrl($product->images->first()?->image_path);

        return response()->json($product);
    }

    public function misProductos(Request $request)
    {
        $farmer = $request->user()->farmer;
        if (!$farmer) return response()->json(['message' => 'No eres agricultor'], 403);

        $perPage = $request->query('per_page', 12);
        $sort    = $request->query('sort', 'recent');

        $todos = Product::where('farmer_id', $farmer->id)->get();
        $kpis  = [
            'total'       => $todos->count(),
            'agotados'    => $todos->where('stock_quantity', 0)->count(),
            'pocoStock'   => $todos->where('stock_quantity', '>', 0)->filter(fn($p) => $p->stock_quantity <= 10)->count(),
            'disponibles' => $todos->where('stock_quantity', '>', 0)->count(),
        ];

        $query = Product::with(['category', 'images'])->where('farmer_id', $farmer->id);

        match ($sort) {
            'price_high' => $query->orderBy('price', 'desc'),
            'price_low'  => $query->orderBy('price', 'asc'),
            default      => $query->latest(),
        };

        $productos = $query->paginate($perPage)->through(function ($product) {
            return [
                'id'                => $product->id,
                'name'              => $product->name,
                'description'       => $product->description,
                'price'             => $product->price,
                'unit'              => $product->unit,
                'stock'             => $product->stock_quantity,
                'max_stock'         => max($product->stock_quantity, 100),
                'sold'              => 0,
                'rating'            => 4.9,
                'category'          => $product->category?->name,
                'image'             => $this->getImageUrl($product->images->first()?->image_path),
                'moderation_status' => $product->moderation_status,
                'created_at'        => $product->created_at,
            ];
        });

        return response()->json(['kpis' => $kpis, 'productos' => $productos]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'       => 'required|exists:categories,id',
            'name'              => 'required|string|max:255',
            'description'       => 'required|string',
            'short_description' => 'nullable|string|max:160',
            'price'             => 'required|numeric|min:0',
            'unit'              => 'required|in:kg,g,l,ml,ud,docena,manojo,caja,bandeja,saco,pack',
            'stock_quantity'    => 'required|integer|min:0',
            'season_end'        => 'nullable|date',
            'images'            => 'required|array|min:1|max:6',
            'images.*'          => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $farmerId = $request->user()->farmer->id;

            $product = Product::create([
                'farmer_id'         => $farmerId,
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
                    $filename       = uniqid() . '.webp';
                    $path           = "products/farmer_{$farmerId}/{$filename}";
                    $optimizedImage = Image::read($file)->scale(width: 800)->encodeByMediaType('image/webp', quality: 80);

                    Storage::disk($disk)->put($path, $optimizedImage);
                    ProductImage::create(['product_id' => $product->id, 'image_path' => $path]);
                }
            }

            $this->invalidarCacheProductos();

            return response()->json($product->load('images'), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $product  = Product::findOrFail($id);
        $farmerId = $request->user()->farmer?->id;

        if ($farmerId !== $product->farmer_id) {
            return response()->json(['message' => 'No tienes permisos para editar este producto'], 403);
        }

        $validated = $request->validate([
            'category_id'       => 'sometimes|exists:categories,id',
            'name'              => 'sometimes|string|max:255',
            'description'       => 'sometimes|string',
            'short_description' => 'nullable|string|max:160',
            'price'             => 'sometimes|numeric|min:0',
            'unit'              => 'sometimes|in:kg,g,l,ml,ud,docena,manojo,caja,bandeja,saco,pack',
            'stock_quantity'    => 'sometimes|integer|min:0',
            'season_end'        => 'sometimes|nullable|date',
            'images'            => 'sometimes|array|max:6',
            'images.*'          => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'image_order'       => 'sometimes|array',
            'image_order.*'     => 'integer',
        ]);

        $product->update(collect($validated)->except(['images', 'image_order'])->toArray());

        if ($request->has('image_order')) {
            foreach ($request->image_order as $position => $imageId) {
                $product->images()->where('id', $imageId)->update(['order' => (int) $position]);
            }
        }

        if ($request->hasFile('images')) {
            $disk      = config('filesystems.default', 'public');
            $nextOrder = ($product->images()->max('order') ?? -1) + 1;

            foreach ($request->file('images') as $file) {
                $filename       = uniqid() . '.webp';
                $path           = "products/farmer_{$farmerId}/{$filename}";
                $optimizedImage = Image::read($file)->scale(width: 800)->encodeByMediaType('image/webp', quality: 80);

                Storage::disk($disk)->put($path, $optimizedImage);
                $product->images()->create(['image_path' => $path, 'order' => $nextOrder++]);
            }
        }

        $this->invalidarCacheProductos();
        Cache::forget("product_{$id}");

        return response()->json([
            'message' => 'Producto actualizado correctamente',
            'product' => $product->load('images'),
        ]);
    }

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

        $this->invalidarCacheProductos();
        Cache::forget("product_{$id}");

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }

    public function destroyImage(Request $request, $productId, $imageId)
    {
        $image = ProductImage::where('id', $imageId)
            ->where('product_id', $productId)
            ->firstOrFail();

        if ($request->user()->farmer?->id !== $image->product->farmer_id) {
            return response()->json(['message' => 'Sin permisos'], 403);
        }

        $disk = config('filesystems.default', 'public');
        if (Storage::disk($disk)->exists($image->image_path)) {
            Storage::disk($disk)->delete($image->image_path);
        }

        $image->delete();
        return response()->json(['message' => 'Imagen eliminada correctamente']);
    }

    private function invalidarCacheProductos(): void
    {
        Cache::forget('products_latest_p1_pp6');
        Cache::forget('products_latest_p2_pp6');
    }
}