<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ressources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auteur_id')->constrained('users');
            $table->string('titre');
            $table->string('slug')->unique();
            $table->text('contenu');
            $table->string('image')->nullable();
            $table->enum('categorie', ['sport', 'nutrition', 'recuperation', 'motivation']);
            $table->boolean('publie')->default(false);
            $table->timestamp('publie_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ressources');
    }
};
