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
            $table->enum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded'])
                  ->default('pending')
                  ->after('status');
            $table->enum('payment_method', ['card', 'paypal', 'bizum', 'cash_on_delivery'])
                  ->nullable()
                  ->after('payment_status');
            $table->string('payment_intent_id')->nullable()->after('payment_method');
            $table->string('payment_transaction_id')->nullable()->after('payment_intent_id');
            $table->timestamp('payment_completed_at')->nullable()->after('payment_transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_status',
                'payment_method',
                'payment_intent_id',
                'payment_transaction_id',
                'payment_completed_at'
            ]);
        });
    }
};
