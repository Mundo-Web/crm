<?php

namespace App\Models\Atalaya;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvitationEmail extends Model
{
    use HasFactory, HasUuids;

    protected $connection = 'mysql_main';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'email',
        'service_by_business_id',
        'invitation_token',
        'created_by'
    ];
}
