<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'buyer_id',
        'farmer_id',
        'status',
        'total',
        'shipping_address',
        'notes',
        'payment_status',
        'payment_method',
        'payment_intent_id',
        'payment_transaction_id',
        'payment_completed_at'
    ];

    protected $casts = [
        'payment_completed_at' => 'datetime',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getPrefixedIdAttribute()
    {
        return 'ORD-' . str_pad($this->id, 5, '0', STR_PAD_LEFT);
    }
}
