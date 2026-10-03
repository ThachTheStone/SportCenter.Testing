<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BilanSanitaire extends Model
{
    use HasFactory;

    protected $table = 'bilans_sanitaires';

    protected $fillable = [
        'client_id',
        'coach_id',
        'date',
        'tension_arterielle',
        'frequence_cardiaque',
        'allergies',
        'pathologies',
        'medicaments',
        'alerte_tension',
        'remarques',
    ];

    protected $casts = [
        'date'           => 'date',
        'alerte_tension' => 'boolean',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }
}
