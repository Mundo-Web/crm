<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Business extends Model
{
    use HasFactory;

    protected $connection = 'mysql_main';

    protected $fillable = [
        'id',
        'uuid',
        'name',
        'economic_sector_id',
        'economic_sector',
        'business_activity_id',
        'business_activity',
        'verified',
        'person_id',
        'owner_id',
        'contact_id',
        'created_by',
        'status'
    ];

    public function person()
    {
        return $this->belongsTo(Person::class, 'person_id');
    }
    public function owner()
    {
        return $this->belongsTo(Person::class, 'owner_id');
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function contact()
    {
        return $this->belongsTo(Person::class, 'contact_id');
    }
    public function myServices()
    {
        return $this->hasManyThrough(
            Service::class,
            ServicesByBusiness::class,
            'business_id', // Foreign key on ServiceByBusiness table...
            'id', // Foreign key on Service table...
            'id', // Local key on User table...
            'service_id' // Local key on ServiceByBusiness table...
        )
            ->join('users_by_services_by_businesses', 'users_by_services_by_businesses.service_by_business_id', '=', 'services_by_businesses.id')
            ->where('users_by_services_by_businesses.user_id', Auth::user()->id)
            ->select('services.*', 'users_by_services_by_businesses.invitation_accepted', 'users_by_services_by_businesses.invitation_token');
    }
}
