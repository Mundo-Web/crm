<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserByProject extends Model
{
    use HasFactory;
    protected $table = 'users_by_projects';

    protected $fillable = [
        'user_id',
        'project_id'
    ];
}
