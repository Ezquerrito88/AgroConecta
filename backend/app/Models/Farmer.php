<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Farmer extends Model
{
    use HasFactory;

    //Conectar con la bd
    protected $table = 'farmer_profiles'; 

    protected $fillable = [
        'user_id',
        'farm_name',
        'city',
        'bio',
        'is_verified'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'farmer_id');
    }
}