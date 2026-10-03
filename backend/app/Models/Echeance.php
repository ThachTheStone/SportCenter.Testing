<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Echeance extends Model
{
    use HasFactory;

    protected $fillable = [
        'cotisation_id',
        'numero',
        'montant',
        'date_echeance',
        'statut',
        'rappel_envoye',
        'rappel_envoye_at',
    ];

    protected $casts = [
        'date_echeance'    => 'date',
        'rappel_envoye'    => 'boolean',
        'rappel_envoye_at' => 'datetime',
        'montant'          => 'decimal:2',
    ];

    public function cotisation()
    {
        return $this->belongsTo(Cotisation::class);
    }
    public function paiement()
    {
        return $this->hasOne(Paiement::class);
    }

    public function estEnRetard(): bool
    {
        return $this->statut === 'en_attente' && $this->date_echeance->isPast();
    }

    public function retardEnJours(): int
    {
        if (!$this->estEnRetard()) return 0;
        return (int) $this->date_echeance->diffInDays(now());
    }

    public function scopeARappeler($query)
    {
        return $query->where('statut', 'en_attente')
            ->where('rappel_envoye', false)
            ->whereDate('date_echeance', now()->addDays(5)->toDateString());
    }

    public function scopeEnRetardDepuis($query, int $jours = 30)
    {
        return $query->where('statut', 'en_attente')
            ->where('date_echeance', '<', now()->subDays($jours));
    }
}
