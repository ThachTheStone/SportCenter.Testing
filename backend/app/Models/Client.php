<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'coach_id',
        'nom',
        'prenom',
        'date_naissance',
        'telephone',
        'adresse',
        'statut',
        'date_inscription',
    ];

    protected $casts = [
        'date_naissance'   => 'date',
        'date_inscription' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function bilansPhysiques()
    {
        return $this->hasMany(BilanPhysique::class)->orderByDesc('date');
    }

    public function bilansSanitaires()
    {
        return $this->hasMany(BilanSanitaire::class)->orderByDesc('date');
    }

    public function programmes()
    {
        return $this->belongsToMany(Programme::class, 'programme_client')
            ->withPivot('date_debut', 'date_fin', 'statut')
            ->withTimestamps();
    }

    public function plannings()
    {
        return $this->hasMany(Planning::class)->orderByDesc('annee')->orderByDesc('mois');
    }

    public function cotisations()
    {
        return $this->hasMany(Cotisation::class);
    }

    public function cotisationActive()
    {
        return $this->hasOne(Cotisation::class)->where('statut', 'active')->latestOfMany();
    }

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }
}
