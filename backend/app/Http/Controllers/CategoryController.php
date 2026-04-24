<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Cache::remember('categories_all', 600, function () {
            return Category::withCount('products')->orderBy('name', 'asc')->get();
        });

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'No tienes permisos para crear categorias'], 403);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'icon'        => 'nullable|image|max:2048',
            'description' => 'nullable|string|max:255',
        ]);

        $data         = $request->all();
        $data['slug'] = Str::slug($request->name);

        if ($request->hasFile('icon')) {
            $data['icon'] = $request->file('icon')->store('categories', 'public');
        }

        $category = Category::create($data);

        $this->invalidarCacheCategorias();

        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = Cache::remember("category_{$id}", 600, function () use ($id) {
            return Category::find($id);
        });

        if (!$category) {
            return response()->json(['message' => 'Categoria no encontrada'], 404);
        }

        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Categoría no encontrada'], 404);
        }

        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Acceso no autorizado'], 403);
        }

        $request->validate([
            'name'        => 'sometimes|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'icon'        => 'nullable|image|max:2048'
        ]);

        if ($request->has('name')) {
            $category->name = $request->name;
            $category->slug = Str::slug($request->name);
        }

        if ($request->has('description')) {
            $category->description = $request->description;
        }

        if ($request->hasFile('icon')) {
            if ($category->icon && Storage::disk('public')->exists($category->icon)) {
                Storage::disk('public')->delete($category->icon);
            }
            $category->icon = $request->file('icon')->store('categories', 'public');
        }

        $category->save();

        $this->invalidarCacheCategorias();
        Cache::forget("category_{$id}");

        return response()->json(['message' => 'Categoría actualizada', 'category' => $category]);
    }

    public function destroy(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Categoría no encontrada'], 404);
        }

        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Acceso no autorizado'], 403);
        }

        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'No puedes borrar esta categoría porque tiene productos asociados. Bórralos o muévelos antes.'
            ], 400);
        }

        if ($category->icon && Storage::disk('public')->exists($category->icon)) {
            Storage::disk('public')->delete($category->icon);
        }

        $category->delete();

        $this->invalidarCacheCategorias();
        Cache::forget("category_{$id}");

        return response()->json(['message' => 'Categoría eliminada']);
    }

    public function getPopulares()
    {
        $categories = Cache::remember('categories_populares', 600, function () {
            return Category::withCount('products')
                ->having('products_count', '>', 0)
                ->orderBy('products_count', 'desc')
                ->take(4)
                ->get(['id', 'name']);
        });

        return response()->json($categories);
    }

    public function getFiltrosStats(Request $request)
    {
        $categoria = $request->get('categoria', 'todas');

        // Clave única por categoría para no mezclar rangos de precio
        $cacheKey = "filtros_stats_{$categoria}";

        $stats = Cache::remember($cacheKey, 300, function () use ($request, $categoria) {
            $query = \App\Models\Product::query()
                ->where('moderation_status', 'approved');

            if ($categoria && $categoria !== 'todas') {
                $query->whereHas('category', function ($q) use ($categoria) {
                    $q->where('name', $categoria);
                });
            }

            $min = $query->min('price') ?? 0;
            $max = $query->max('price') ?? 0;

            if ($min == $max) {
                $max = $min + 1;
            }

            return [
                'min_price' => floor($min),
                'max_price' => ceil($max),
            ];
        });

        return response()->json($stats);
    }

    private function invalidarCacheCategorias(): void
    {
        Cache::forget('categories_all');
        Cache::forget('categories_populares');

        // Limpiar stats de precios por categoría
        $categorias = Category::pluck('name');
        foreach ($categorias as $nombre) {
            Cache::forget("filtros_stats_{$nombre}");
        }
        Cache::forget('filtros_stats_todas');
    }
}