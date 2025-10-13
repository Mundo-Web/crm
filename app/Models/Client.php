<?php

namespace App\Models;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Client extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'description',
        'contact_name',
        'contact_phone',
        'contact_email',
        'contact_address',
        'status',
        'created_at',
        'updated_at',
        'ruc',
        'name',
        'contact_position',
        'message',
        'web_url',
        'triggered_by',
        'source',
        'date',
        'time',
        'ip',
        'origin',
        'client_width',
        'client_height',
        'client_latitude',
        'client_longitude',
        'client_system',
        'status_id',
        'manage_status_id',
        'created_by',
        'updated_by',
        'tradename',
        'assigned_to',
        'assignation_date',
        'sector',
        'country_prefix',
        'workers',
        'business_id',
        'complete_registration',
        'integration_id',
        'integration_user_id',
        'source_channel',
        'form_answers',
        'complete_form',
    ];

    protected $casts = [
        'form_answers' => 'array',
        'complete_registration' => 'boolean',
        'complete_form' => 'boolean',
    ];
    
    protected $hidden = [
        // 'business_id'
    ];

    static function getFields()
    {
        return [
            ['field' => 'contact_name', 'name' => 'Nombre del contacto'],
            ['field' => 'contact_phone', 'name' => 'Teléfono del contacto'],
            ['field' => 'contact_email', 'name' => 'Correo del contacto'],
            ['field' => 'contact_address', 'name' => 'Dirección del contacto'],
            ['field' => 'ruc', 'name' => 'RUC'],
            ['field' => 'name', 'name' => 'Nombre'],
            ['field' => 'contact_position', 'name' => 'Cargo'],
            ['field' => 'message', 'name' => 'Mensaje'],
            ['field' => 'web_url', 'name' => 'URL'],
            ['field' => 'tradename', 'name' => 'Nombre comercial'],
            ['field' => 'sector', 'name' => 'Sector comercial'],
            ['field' => 'workers', 'name' => 'N° Trabajadores'],
        ];
    }

    public function creator()
    {
        return $this->hasOne(User::class, 'id', 'created_by');
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'client_id', 'id');
    }

    public function assigned()
    {
        return $this->hasOne(User::class, 'id', 'assigned_to');
    }

    public function status()
    {
        return $this->hasOne(Status::class, 'id', 'status_id');
    }

    public function integration()
    {
        return $this->hasOne(Integration::class, 'id', 'integration_id');
    }

    public function manageStatus()
    {
        return $this->hasOne(Status::class, 'id', 'manage_status_id');
    }

    public function notes()
    {
        return $this->hasMany(ClientNote::class, 'client_id', 'id');
    }

    public function tasks()
    {
        return $this->hasManyThrough(Task::class, ClientNote::class, 'client_id', 'note_id', 'id', 'id');
    }

    public function pendingTasks()
    {
        return $this->hasManyThrough(Task::class, ClientNote::class, 'client_id', 'note_id', 'id', 'id')->whereNot('status', 'Realizado');
    }

    static function lastMonth()
    {
        $previousMonth = Carbon::now()->subMonth()->format('m');
        $previousYear = Carbon::now()->subMonth()->format('Y');
        return Client::byMonth($previousYear, $previousMonth);
    }

    static function thisMonth()
    {
        $currentMonth = date('m');
        $currentYear = date('Y');
        return Client::byMonth($currentYear, $currentMonth);
    }

    static function byMonth($year, $month)
    {
        return Client::where('clients.business_id', Auth::user()->business_id)
            ->whereMonth('clients.created_at', $month)
            ->whereYear('clients.created_at', $year);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'client_has_products', 'client_id', 'product_id')
            ->withPivot('id');
    }
}
