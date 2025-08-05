<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicesByBusiness extends Model
{
    use HasFactory;

    protected $connection = 'mysql_main';

    protected $fillable = [
        'service_id',
        'business_id',
        'created_by',
        'first_time',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }
    public function users()
    {
        return $this->belongsToMany(User::class, 'users_by_services_by_businesses', 'service_by_business_id', 'user_id')
            ->withPivot('invitation_accepted', 'id');
    }
}
