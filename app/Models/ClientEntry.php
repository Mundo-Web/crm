<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientEntry extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'client_id',
        'campaign_id',
        'adset_name',
        'ad_name',
        'source',
        'origin',
        'lead_origin',
        'triggered_by',
        'source_channel',
        'entry_date',
    ];

    protected $casts = [
        'entry_date' => 'datetime',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Determina el tipo de canal para mostrar el ícono correcto en el frontend.
     * Retorna uno de: 'facebook_form', 'instagram_form', 'whatsapp_ad',
     *                  'whatsapp_organic', 'landing', 'google', 'other'
     */
    public function getChannelTypeAttribute(): string
    {
        $source  = strtolower($this->source ?? '');
        $origin  = strtolower($this->origin ?? '');
        $trigger = strtolower($this->triggered_by ?? '');
        $channel = strtolower($this->source_channel ?? '');

        if (str_contains($trigger, 'instagram') || str_contains($origin, 'instagram')) {
            return $this->campaign_id ? 'instagram_form' : 'instagram_organic';
        }
        if (str_contains($trigger, 'facebook') || str_contains($origin, 'facebook') || str_contains($origin, 'meta')) {
            return $this->campaign_id ? 'facebook_form' : 'facebook_organic';
        }
        if (str_contains($source, 'whatsapp') || str_contains($trigger, 'whatsapp')) {
            return $this->campaign_id ? 'whatsapp_ad' : 'whatsapp_organic';
        }
        if (str_contains($source, 'google') || str_contains($origin, 'google')) {
            return 'google';
        }
        if (str_contains($source, 'landing') || str_contains($origin, 'landing')) {
            return 'landing';
        }
        return 'other';
    }
}
