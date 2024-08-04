<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientNote extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'client_id',
        'note_type_id',
        'user_id',
        'name',
        'description'
    ];

    public function type(){
        return $this->belongsTo(NoteType::class, 'note_type_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function tasks() {
        return $this->hasMany(Task::class, 'note_id', 'id');
    }
}
