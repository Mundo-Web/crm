<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DefaultMessage extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'type',
        'name',
        'description',
        'business_id',
        'user_id',
    ];

    public function attachments() {
        return $this->hasManyThrough(Repository::class, DefaultMessageHasAttachment::class, 'default_message_id', 'id', 'id', 'attachment_id');
    }
}
