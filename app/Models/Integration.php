<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'meta_service',
        'meta_business_id',
        'meta_business_name',
        'meta_business_profile',
        'meta_access_token',
        'business_id',
        'status'
    ];

    protected $hidden = [
        'meta_access_token',
    ];
}
