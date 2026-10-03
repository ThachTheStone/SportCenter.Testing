<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seances_realisees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seance_planifiee_id')->constrained('seances_planifiees')->onDelete('cascade');
            $table->boolean('present')->default(true);
            $table->json('exercices_realises')->nullable();
            $table->text('remarques_coach')->nullable();
            $table->unsignedTinyInteger('effort_percu')->nullable();
            $table->text('objectifs_atteints')->nullable();
            $table->timestamps();

            $table->unique('seance_planifiee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seances_realisees');
    }
};
