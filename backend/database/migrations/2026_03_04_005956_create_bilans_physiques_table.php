<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bilans_physiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('coach_id')->constrained('coaches')->onDelete('cascade');
            $table->date('date');
            $table->decimal('taille_cm', 5, 2);
            $table->decimal('poids_kg', 5, 2);
            $table->decimal('imc', 4, 2);
            $table->decimal('tour_taille_cm', 5, 2)->nullable();
            $table->decimal('tour_hanches_cm', 5, 2)->nullable();
            $table->decimal('tour_poitrine_cm', 5, 2)->nullable();
            $table->decimal('masse_grasse_pct', 4, 2)->nullable();
            $table->enum('imc_statut', ['insuffisant', 'normal', 'surpoids', 'obesite'])->nullable();
            $table->text('remarques')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bilans_physiques');
    }
};
