<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Flow extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'name',
        'description',
        'trigger_type',
        'trigger_conditions',
        'tree',
        'status'
    ];

    protected $casts = [
        'trigger_conditions' => 'array',
        'tree'               => 'array',
        'status'             => 'boolean'
    ];
}
