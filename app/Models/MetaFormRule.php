<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MetaFormRule extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'form_id',
        'form_name',
        'rule_name',
        'conditions',
        'tree',
        'chat_status_id',
        'manage_status_id',
        'status_id',
        'assigned_to',
        'tag',
        'status'
    ];

    protected $casts = [
        'conditions' => 'array',
        'tree'       => 'array',
        'status'     => 'boolean'
    ];

    public function chatStatus()
    {
        return $this->belongsTo(Status::class, 'chat_status_id');
    }

    public function manageStatus()
    {
        return $this->belongsTo(Status::class, 'manage_status_id');
    }

    public function statusRef()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function assigned()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
