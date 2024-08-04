<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
}
