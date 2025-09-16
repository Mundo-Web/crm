<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $connection = 'mysql_main';

    protected $fillable = [
        'service_id',
        'name',
        'description',
        'monthly_price',
        'annual_price',
    ];
}
