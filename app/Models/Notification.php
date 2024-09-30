<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'icon',
        'name',
        'message',
        'description',
        'module',
        'link_to',
        'created_by',
        'notify_to',
        'business_id',
        'seen',
        'status'
    ];

    protected $hidden = [
        'created_by',
        'notify_to',
        'business_id'
    ];

    public function creator()
    {
        return $this->hasOne(User::class, 'id', 'created_by');
    }
}
