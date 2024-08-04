<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UsersByServicesByBusiness extends Model
{
    use HasFactory;

    protected $connection = 'mysql_main';
    
    protected $fillable = [
        'user_id',
        'service_by_business_id',
        'created_by',
        'invitation_accepted',
        'invitation_token',
        'active'
    ];

    // Relación con User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relación con ServiceByBusiness
    public function serviceByBusiness()
    {
        return $this->belongsTo(ServicesByBusiness::class, 'service_by_business_id');
    }

    // Relación con Business a través de ServiceByBusiness
    public function business()
    {
        return $this->hasOneThrough(Business::class, ServicesByBusiness::class, 'id', 'id', 'service_by_business_id', 'business_id');
    }

    // Relación con Service a través de ServiceByBusiness
    public function service()
    {
        return $this->hasOneThrough(Service::class, ServicesByBusiness::class, 'id', 'id', 'service_by_business_id', 'service_id');
    }
}
