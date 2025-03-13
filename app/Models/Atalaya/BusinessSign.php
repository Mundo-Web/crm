<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessSign extends Model
{
    use HasFactory, HasUuids;

    protected $connection = 'mysql_main';

    protected $primaryKey = 'id';
    protected $keyType = 'string';

    protected $fillable = [
        'sign',
        'user_id',
        'business_id',
    ];
}
