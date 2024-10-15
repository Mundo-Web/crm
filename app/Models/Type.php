<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Type extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'table_id',
        'description',
        'business_id'
    ];

    protected $hidden = [
        'business_id'
    ];

    public function table()
    {
        return $this->belongsTo(Table::class, 'table_id', 'id');
    }

    static function ofProducts() {
        return Type::where('business_id', Auth::user()->business_id)->
        where('table_id', '1783c832-8dfb-4d30-810c-bc88345507bf');
    }
}
