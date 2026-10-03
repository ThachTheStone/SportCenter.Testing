<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cotisation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'montant_annuel',
        'date_inscription',
        'date_expiration',
        'statut',
    ];

    protected $casts = [
        'date_inscription' => 'date',
        'date_expiration'  => 'date',
        'montant_annuel'   => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function echeances()
    {
        return $this->hasMany(Echeance::class)->orderBy('numero');
    }

    // Génère automatiquement les 3 échéances après création
    protected static function booted(): void
    {
        static::created(function (Cotisation $cotisation) {
            $montant  = round($cotisation->montant_annuel / 3, 2);
            $dateBase = $cotisation->date_inscription;

            for ($i = 1; $i <= 3; $i++) {
                Echeance::create([
                    'cotisation_id' => $cotisation->id,
                    'numero'        => $i,
                    'montant'       => $montant,
                    'date_echeance' => $dateBase->copy()->addMonths($i - 1),
                    'statut'        => 'en_attente',
                ]);
            }
        });
    }

    public function montantPaye(): float
    {
        return (float) $this->echeances->where('statut', 'paye')->sum('montant');
    }

    public function montantRestant(): float
    {
        return $this->montant_annuel - $this->montantPaye();
    }
}
