<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdSet extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'campaign_id',
        'meta_id',
        'name',
        'status',
        'business_id',
        'spend'
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function ads()
    {
        return $this->hasMany(Ad::class);
    }
}
