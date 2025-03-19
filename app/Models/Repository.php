<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Repository extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'repository';

    protected $fillable = [
        'name',
        'description',
        'file',
        'properties',
        'business_id',
    ];

    protected $casts = [
        'properties' => 'json',
    ];
}
