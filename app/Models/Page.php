<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'subdomain_id',
        'name',
        'description',
        'path',
        'img_desktop',
        'img_tablet',
        'img_mobile',
        'visible',
        'status'
    ];
}
