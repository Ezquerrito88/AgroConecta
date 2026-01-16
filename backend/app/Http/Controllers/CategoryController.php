<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    //Listar todas las categorias
    public function index()
    {
        $categories = Category::withCount('products')->orderBy('name', 'asc')->get();
        return response()->json($categories);
    }

    //Crear categorias solo admin
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

        $data = $request->all();

        $data['slug'] = Str::slug($request->name);

        if ($request->hasFile('icon')) {
            $data['icon'] = $request->file('icon')->store('categories', 'public');
        }

        $category = Category::create($data);

        return response()->json($category, 201);
    }

   //Mostrar categoria
    public function show($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Categoria no encontrada'], 404);
        }

        return response()->json($category);
    }

    //Actualizar categoria solo admin
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

        return response()->json(['message' => 'Categoría actualizada', 'category' => $category]);
    }

    //Borrar categoria solo admin
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

        return response()->json(['message' => 'Categoría eliminada']);
    }
}

