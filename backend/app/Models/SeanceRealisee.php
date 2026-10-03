<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeanceRealisee extends Model
{
    use HasFactory;

    protected $table = 'seances_realisees';

    protected $fillable = [
        'seance_planifiee_id',
        'present',
        'exercices_realises',
        'remarques_coach',
        'effort_percu',
        'objectifs_atteints',
    ];

    protected $casts = [
        'present'            => 'boolean',
        'exercices_realises' => 'array',
    ];

    public function seancePlanifiee()
    {
        return $this->belongsTo(SeancePlanifiee::class);
    }
}
