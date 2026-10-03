<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Planning extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'coach_id',
        'mois',
        'annee',
        'statut',
        'notes',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function seances()
    {
        return $this->hasMany(SeancePlanifiee::class)->orderBy('date')->orderBy('heure_debut');
    }
}
