<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'type_id',
        'client_id',
        'name',
        'description',
        'cost',
        'signed_at',
        'starts_at',
        'ends_at',
        'business_id',
        'status_id',
        'is_alert',
        'remaining_amount'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    public function type()
    {
        return $this->belongsTo(Type::class);
    }

    public function subdomain()
    {
        return $this->hasOne(Subdomain::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, UserByProject::class, 'project_id', 'user_id');
    }

    public static function regularizeRemaining(string $projectId)
    {
        $total_amount = Payment::where('project_id', $projectId)->sum('amount');
        $projectJpa = Project::find($projectId);
        $projectJpa->remaining_amount = $projectJpa->cost - $total_amount;
        $projectJpa->save();
    }
}
