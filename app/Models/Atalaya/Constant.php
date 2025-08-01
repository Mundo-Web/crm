<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Constant extends Model
{
    use HasFactory;

    protected $connection = 'mysql_main';

    protected $fillable = [
        'correlative',
        'name',
        'value',
        'type',
    ];

    public static function get($correlative)
    {
        return Constant::where('correlative', $correlative)->first();
    }

    public static function value($correlative)
    {
        return Constant::get($correlative)->value;
    }
}
