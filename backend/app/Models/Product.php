<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    //Esto hace que 'season_end' sea una fecha
    protected $casts = [
        'season_end' => 'date',
        'price' => 'decimal:2',
    ];

    //Relacion 1: Pertenece a una Categoría
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    //Relacion 2: Pertenece a un agricultor
    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    //Relacion 3: Tiene muchas imágenes
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }
}