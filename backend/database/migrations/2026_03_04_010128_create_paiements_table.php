<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('echeance_id')->constrained('echeances')->onDelete('cascade');
            $table->foreignId('enregistre_par')->constrained('users');
            $table->date('date_paiement');
            $table->decimal('montant', 10, 2);
            $table->enum('methode', ['carte', 'virement', 'cheque', 'especes']);
            $table->string('reference')->nullable();
            $table->string('banque')->nullable();
            $table->string('stripe_payment_id')->nullable();
            $table->enum('statut_stripe', ['pending', 'succeeded', 'failed'])->nullable();
            $table->string('recu_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
