<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Setting extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'description',
        'value',
        'type',
        'updated_by',
        'business_id',
    ];
    protected $hidden = [
        'business_id',
    ];

    static function get($name, $business_id = null)
    {
        $jpa = Setting::select(['value'])
            ->where('name', $name)
            ->where('business_id', $business_id ? $business_id : Auth::user()->business_id)
            ->first();
        if (!$jpa) return null;
        return $jpa->value;
    }

    static function set($name, $value, $business_id = null)
    {
        $settingJpa = Setting::updateOrCreate([
            'name' => $name,
            'business_id' => $business_id ? $business_id : Auth::user()->business_id
        ], [
            'value' => $value
        ]);
        return $settingJpa;
    }
}
