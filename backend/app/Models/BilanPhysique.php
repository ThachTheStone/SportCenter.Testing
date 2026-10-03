<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BilanPhysique extends Model
{
    use HasFactory;

    protected $table = 'bilans_physiques';

    protected $fillable = [
        'client_id',
        'coach_id',
        'date',
        'taille_cm',
        'poids_kg',
        'imc',
        'tour_taille_cm',
        'tour_hanches_cm',
        'tour_poitrine_cm',
        'masse_grasse_pct',
        'imc_statut',
        'remarques',
    ];

    protected $casts = ['date' => 'date'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    protected static function booted(): void
    {
        static::saving(function (BilanPhysique $bilan) {
            if ($bilan->taille_cm && $bilan->poids_kg) {
                $tailleM    = $bilan->taille_cm / 100;
                $bilan->imc = round($bilan->poids_kg / ($tailleM * $tailleM), 2);
                $bilan->imc_statut = match (true) {
                    $bilan->imc < 18.5 => 'insuffisant',
                    $bilan->imc < 25   => 'normal',
                    $bilan->imc < 30   => 'surpoids',
                    default            => 'obesite',
                };
            }
        });
    }

    public function estAnormal(): bool
    {
        return in_array($this->imc_statut, ['insuffisant', 'obesite']);
    }
}
