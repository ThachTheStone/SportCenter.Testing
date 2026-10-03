<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coach extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'code_coach',
        'nom',
        'prenom',
        'specialite',
        'date_embauche',
        'bio',
        'telephone',
    ];

    protected $casts = [
        'date_embauche' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function clients()
    {
        return $this->hasMany(Client::class);
    }
    public function programmes()
    {
        return $this->hasMany(Programme::class);
    }
    public function plannings()
    {
        return $this->hasMany(Planning::class);
    }

    public function bilansPhysiques()
    {
        return $this->hasMany(BilanPhysique::class);
    }

    public function bilansSanitaires()
    {
        return $this->hasMany(BilanSanitaire::class);
    }

    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }

    public function seancesDuMois(int $mois = null, int $annee = null): int
    {
        $mois  = $mois  ?? now()->month;
        $annee = $annee ?? now()->year;

        return SeancePlanifiee::whereHas('planning', function ($q) use ($mois, $annee) {
            $q->where('coach_id', $this->id)
                ->where('mois', $mois)
                ->where('annee', $annee);
        })->whereHas('seanceRealisee')->count();
    }
}
