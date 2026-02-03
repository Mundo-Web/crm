<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'image',
        'type_id',
        'name',
        'price',
        'color',
        'description',
        'visible',
        'status',
        'business_id',
    ];

    public function type()
    {
        return $this->hasOne(Type::class, 'id', 'type_id');
    }
}
