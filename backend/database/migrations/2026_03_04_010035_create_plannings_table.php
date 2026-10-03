<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plannings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('coach_id')->constrained('coaches')->onDelete('cascade');
            $table->unsignedTinyInteger('mois');
            $table->unsignedSmallInteger('annee');
            $table->enum('statut', ['brouillon', 'publie', 'archive'])->default('brouillon');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'mois', 'annee']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plannings');
    }
};
