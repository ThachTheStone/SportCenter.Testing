<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'echeance_id',
        'enregistre_par',
        'date_paiement',
        'montant',
        'methode',
        'reference',
        'banque',
        'stripe_payment_id',
        'statut_stripe',
        'recu_path',
        'notes',
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant'       => 'decimal:2',
    ];

    public function echeance()
    {
        return $this->belongsTo(Echeance::class);
    }

    public function enregistrePar()
    {
        return $this->belongsTo(User::class, 'enregistre_par');
    }

    // Met à jour le statut de l'échéance automatiquement après paiement
    protected static function booted(): void
    {
        static::created(function (Paiement $paiement) {
            $paiement->echeance->update(['statut' => 'paye']);
        });
    }

    public function estEnLigne(): bool
    {
        return in_array($this->methode, ['carte', 'virement']);
    }
}
