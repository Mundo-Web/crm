<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'wa_id',
        'role',
        'message',
        'prompt',
        'microtime',
        'business_id',
        'campaign_id',
        'seen',
    ];

    protected $hidden = [
        'business_id'
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }
}
