<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Programme extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'coach_id',
        'nom',
        'objectif',
        'duree_semaines',
        'description',
        'exercices',
        'niveau',
        'est_template',
    ];

    protected $casts = [
        'exercices'    => 'array',
        'est_template' => 'boolean',
    ];

    public function coach()
    {
        return $this->belongsTo(Coach::class);
    }

    public function clients()
    {
        return $this->belongsToMany(Client::class, 'programme_client')
            ->withPivot('date_debut', 'date_fin', 'statut')
            ->withTimestamps();
    }
}
