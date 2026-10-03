<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeancePlanifiee extends Model
{
    use HasFactory;

    protected $table = 'seances_planifiees';

    protected $fillable = [
        'planning_id',
        'date',
        'heure_debut',
        'heure_fin',
        'lieu',
        'exercices_prevus',
        'notes',
    ];

    protected $casts = [
        'date'             => 'date',
        'exercices_prevus' => 'array',
    ];

    public function planning()
    {
        return $this->belongsTo(Planning::class);
    }

    public function seanceRealisee()
    {
        return $this->hasOne(SeanceRealisee::class);
    }

    public function estRealisee(): bool
    {
        return $this->seanceRealisee()->exists();
    }
}
