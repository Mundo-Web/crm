<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class View extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'table_id',
        'business_id',
        'status'
    ];

    protected $hidden = [
        'business_id'
    ];

    public function statuses () {
        return $this->belongsToMany(Status::class, 'statuses_by_views', 'view_id', 'status_id');
    }

    public function table() {
        return $this->belongsTo(Table::class);
    }
}
