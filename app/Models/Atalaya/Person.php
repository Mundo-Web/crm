<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Person extends Model
{
    use HasFactory;

    protected $connection = 'mysql_main';

    protected $fillable = [
        'id',
        'document_type',
        'document_number',
        'name',
        'lastname',
        'birthdate',
        'gender',
        'email',
        'phone',
        'ubigeo',
        'address',
        'created_by',
    ];
}
