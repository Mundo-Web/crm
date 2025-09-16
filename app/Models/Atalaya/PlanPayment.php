<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanPayment extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'plan_id',
        'service_by_business_id',
        'begins_at',
        'ends_at',
    ];

    public function plan(){
        return $this->belongsTo(Plan::class);
    }

    public function service() {
        return $this->hasOneThrough(Service::class, ServicesByBusiness::class);
    }

    public function business() {
        return $this->hasOneThrough(Business::class, ServicesByBusiness::class);
    }
}
