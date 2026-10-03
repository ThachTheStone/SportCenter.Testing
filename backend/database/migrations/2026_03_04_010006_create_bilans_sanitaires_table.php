<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bilans_sanitaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('coach_id')->constrained('coaches')->onDelete('cascade');
            $table->date('date');
            $table->string('tension_arterielle')->nullable();
            $table->integer('frequence_cardiaque')->nullable();
            $table->text('allergies')->nullable();
            $table->text('pathologies')->nullable();
            $table->text('medicaments')->nullable();
            $table->boolean('alerte_tension')->default(false);
            $table->text('remarques')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bilans_sanitaires');
    }
};
