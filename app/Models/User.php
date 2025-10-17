<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Models\Atalaya\User as AtalayaUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasPermissions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use HasRoles;
    use HasPermissions;

    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'lastname',
        'fullname',
        'email',
        'user_id',
        'business_id',
        'has_mailing_sign',
        'relative_id',
        'mailing_sign',
        'whatsapp_sign'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function isRoot()
    {
        return $this->hasRole('Root');
    }

    public function isAdmin()
    {
        return $this->hasRole('Admin');
    }

    public function getAllPermissions()
    {
        $rolesJpa = Role::with(['permissions'])
            ->join('model_has_roles', 'model_has_roles.role_id', 'roles.id')
            ->where('model_has_roles.business_id', Auth::user()->business_id)
            ->where('roles.business_id', Auth::user()->business_id)
            ->where('model_id', $this->id)
            ->get();
        $this->roles = $rolesJpa;
    }

    static function byBusiness(int $id = null)
    {
        $query = AtalayaUser::select([
            DB::raw('DISTINCT users.*'),
            'users_by_services_by_businesses.invitation_accepted',
            DB::raw('IF(businesses.created_by = users.id, true, false) AS is_owner')
        ])
            ->join('users_by_services_by_businesses', 'users_by_services_by_businesses.user_id', 'users.id')
            ->join('services_by_businesses', 'services_by_businesses.id', 'users_by_services_by_businesses.service_by_business_id')
            ->join('services', 'services.id', 'services_by_businesses.service_id')
            ->join('businesses', 'businesses.id', 'services_by_businesses.business_id')
            ->where('services.correlative', env('APP_CORRELATIVE'))
            ->where('services_by_businesses.business_id', Auth::user()->business_id);

        if ($id !== null) {
            $query->where('users.id', $id);
        }

        $usersJpa = $query->get();

        foreach ($usersJpa as $userJpa) {
            $serviceUser = User::updateOrCreate([
                'user_id' => $userJpa->id,
                'business_id' => Auth::user()->business_id
            ], [
                'user_id' => $userJpa->id,
                'business_id' => Auth::user()->business_id,
                'name' => $userJpa->name,
                'lastname' => $userJpa->lastname,
                'fullname' => $userJpa->name . ' ' . $userJpa->lastname,
                'email' => $userJpa->email,
            ]);
            $serviceUser->getAllPermissions();
            $userJpa->service_user = $serviceUser;
        }
        return $id !== null ? $usersJpa->first() : $usersJpa;
    }
}
