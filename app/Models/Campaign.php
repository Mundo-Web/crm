<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'meta_id',
        'source',
        'title',
        'link',
        'notes',
        'status',
        'business_id',
        'protected',
        'spend',
        'impressions',
        'clicks'
    ];

    protected $casts = [
        'status' => 'boolean',
        'protected' => 'boolean',
    ];

    public function adSets()
    {
        return $this->hasMany(AdSet::class);
    }

    public function clients()
    {
        return $this->hasMany(Client::class, 'campaign_id', 'id');
    }
}
