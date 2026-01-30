<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'farmer_id',
        'category_id',
        'name',
        'description',
        'price',
        'unit',
        'stock_quantity',
        'season_end',
        'moderation_status'
    ];

    protected $casts = [
        'season_end' => 'date',
        'price' => 'decimal:2',
    ];


    protected $appends = ['is_favorite'];

    public function getIsFavoriteAttribute()
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::guard('sanctum')->user();

        if ($user) {
            return $user->favorites()->where('product_id', $this->id)->exists();
        }
        
        return false;
    }

    // --- RELACIONES ---

    // Relacion 1: Pertenece a una Categoría
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Relacion 2: Pertenece a un agricultor (User)
    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    // Relacion 3: Tiene muchas imágenes
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }
}