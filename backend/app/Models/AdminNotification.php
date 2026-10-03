<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    protected $fillable = [
        'type',
        'titre',
        'message',
        'lien',
        'lien_label',
        'lu',
    ];

    protected $casts = [
        'lu' => 'boolean',
    ];
}
