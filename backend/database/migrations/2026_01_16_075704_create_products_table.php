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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories');
            $table->string('name');
            $table->text('description');
            $table->decimal('price', 8, 2);
            $table->enum('unit', [
                'kg',       // Granel (Manzanas, Patatas)
                'g',        // Especias (Azafrán)
                'l',        // Líquidos (Aceite, Leche)
                'ml',       // Botes pequeños (Miel pequeña, aceites gourmet)
                'ud',       // Unidades sueltas (1 Sandía, 1 Calabaza)
                'docena',   // Huevos
                'manojo',   // Espárragos, Ajetes, Rábanos
                'caja',     // Naranjas, Alcachofas (Volumen)
                'bandeja',  // Champiñones, Arándanos
                'saco',     // Patatas grandes (25kg), Legumbres
                'pack'      // Pack de 3 botes de mermelada
            ]);
            $table->integer('stock_quantity');
            $table->date('season_end')->nullable();
            $table->enum('moderation_status', ['pending', 'approved', 'rejected'])->default('approved');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
