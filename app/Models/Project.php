<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'type_id',
        'client_id',
        'name',
        'description',
        'cost',
        'signed_at',
        'starts_at',
        'ends_at',
        'business_id',
        'status_id'
    ];

    public function client() {
        return $this->belongsTo(Client::class);
    }
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    public function type() {
        return $this->belongsTo(Type::class);
    }

    public function subdomain() {
        return $this->hasOne(Subdomain::class);
    }
}
