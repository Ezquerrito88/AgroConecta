<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'image_path',
        'order'
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) return null;

        $account   = config('filesystems.disks.azure.name');
        $container = config('filesystems.disks.azure.container');

        if (!$account || !$container) {
            return asset('storage/' . $this->image_path);
        }

        return "https://{$account}.blob.core.windows.net/{$container}/{$this->image_path}";
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
