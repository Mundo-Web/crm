<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use function PHPSTORM_META\map;

class RemainingHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'month',
        'remaining_amount',
        'total_amount'
    ];
}
