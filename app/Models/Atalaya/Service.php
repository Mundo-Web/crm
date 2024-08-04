<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $connection = 'mysql_main';

    protected $fillable = [
        'name',
        'correlative',
        'description',
        'status',
    ];
}
