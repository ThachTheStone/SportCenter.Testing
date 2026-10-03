<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programmes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('coaches')->onDelete('cascade');
            $table->string('nom');
            $table->string('objectif');
            $table->integer('duree_semaines');
            $table->text('description')->nullable();
            $table->json('exercices')->nullable();
            $table->enum('niveau', ['debutant', 'intermediaire', 'avance'])->default('intermediaire');
            $table->boolean('est_template')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programmes');
    }
};
