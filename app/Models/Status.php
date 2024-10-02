<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory, HasUuids;

    protected $connection = 'mysql';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'table_id',
        'name',
        'description',
        'color',
        'order',
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
