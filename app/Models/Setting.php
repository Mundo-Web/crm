<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\JSON;

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
        if (str_contains($name, '[')) {
            [$name, $key] = explode('[', $name);
            $key = str_replace(']', '', $key);
            $settingJpa = Setting::select()
                ->where('name', $name)
                ->where('business_id', $business_id ? $business_id : Auth::user()->business_id)
                ->first();
            if (!$settingJpa) $settingJpa = new Setting([
                'name' => $name,
                'business_id' => $business_id ? $business_id : Auth::user()->business_id
            ]);
            if (!$settingJpa->value) {
                $settingJpa->value = '{}';
            }

            $object = JSON::parse($settingJpa->value);
            $object[$key] = $value;
            $settingJpa->type = 'json';
            $settingJpa->value = JSON::stringify($object);
            $settingJpa->save();
        } else {
            $settingJpa = Setting::updateOrCreate([
                'name' => $name,
                'business_id' => $business_id ? $business_id : Auth::user()->business_id
            ], [
                'value' => $value
            ]);
        }
        return $settingJpa;
    }
}
