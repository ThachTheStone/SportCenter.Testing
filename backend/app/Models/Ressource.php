<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ressource extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'auteur_id',
        'titre',
        'slug',
        'contenu',
        'image',
        'categorie',
        'publie',
        'publie_at',
    ];

    protected $casts = [
        'publie'    => 'boolean',
        'publie_at' => 'datetime',
    ];

    public function auteur()
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function scopePublies($query)
    {
        return $query->where('publie', true)->orderByDesc('publie_at');
    }
}
