<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'ad_set_id',
        'meta_id',
        'name',
        'status',
        'business_id',
        'spend',
        'preview_image_url',
        'form_name',
        'body_text'
    ];

    public function adSet()
    {
        return $this->belongsTo(AdSet::class);
    }
}
