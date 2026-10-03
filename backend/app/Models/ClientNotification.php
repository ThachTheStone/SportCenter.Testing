<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientNotification extends Model
{
    protected $fillable = [
        'client_id',
        'type',
        'titre',
        'message',
        'lu'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
