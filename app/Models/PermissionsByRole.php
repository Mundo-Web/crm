<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermissionsByRole extends Model
{
    use HasFactory;
    protected $table = 'permissions_by_rol';
}
