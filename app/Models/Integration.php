<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Integration extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'meta_service',
        'meta_business_id',
        'meta_number_id',
        'meta_business_name',
        'meta_business_profile',
        'meta_access_token',
        'meta_app_token',
        'meta_ad_account_id',
        'meta_app_id',
        'meta_app_secret',
        'business_id',
        'status'
    ];

    protected $hidden = [];

    public function leads(): HasMany
    {
        return $this->hasMany(Client::class, 'integration_id');
    }
}
