<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Index for webhook lookups
            $table->index('payment_intent_id');
            $table->index('payment_transaction_id');
            
            // Compound index for common queries
            $table->index(['buyer_id', 'created_at']);
            $table->index(['farmer_id', 'created_at']);
            $table->index(['payment_status', 'created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            // Index for stock queries
            $table->index('stock_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['payment_intent_id']);
            $table->dropIndex(['payment_transaction_id']);
            $table->dropIndex(['buyer_id', 'created_at']);
            $table->dropIndex(['farmer_id', 'created_at']);
            $table->dropIndex(['payment_status', 'created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['stock_quantity']);
        });
    }
};
