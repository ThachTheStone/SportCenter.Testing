<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('echeances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cotisation_id')->constrained('cotisations')->onDelete('cascade');
            $table->unsignedTinyInteger('numero');
            $table->decimal('montant', 10, 2);
            $table->date('date_echeance');
            $table->enum('statut', ['en_attente', 'paye', 'retard', 'annule'])->default('en_attente');
            $table->boolean('rappel_envoye')->default(false);
            $table->timestamp('rappel_envoye_at')->nullable();
            $table->timestamps();

            $table->unique(['cotisation_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('echeances');
    }
};
