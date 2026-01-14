<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Status extends Model
{
    use HasFactory, HasUuids;

    protected $connection = 'mysql';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'table_id',
        'name',
        'description',
        'color',
        'order',
        'business_id',
        'require',
        'action_required'
    ];

    protected $casts = [
        'require' => 'boolean',
    ];

    protected $hidden = [
        'business_id'
    ];

    protected $appends = [
        'children_count',
        'last_used_at'
    ];

    public function table()
    {
        return $this->belongsTo(Table::class, 'table_id', 'id');
    }

    static function forLeads()
    {
        return Status::where('statuses.table_id', 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
            ->where('statuses.status', true)
            ->where('statuses.business_id', Auth::user()->business_id);
    }

    static function forClients()
    {
        return Status::where('statuses.table_id', 'a8367789-666e-4929-aacb-7cbc2fbf74de')
            ->where('statuses.status', true)
            ->where('statuses.business_id', Auth::user()->business_id);
    }

    public function getChildrenCountAttribute()
    {
        $table = $this->table()->first();
        if (!$table) return 0;

        $modelClass = $table->model_name;
        $column = $table->column_pivot;

        return app($modelClass)
            ->where($column, $this->id)
            ->where('business_id', $this->business_id)
            ->count();
    }

    public function getLastUsedAtAttribute()
    {
        $table = $this->table()->first();
        if (!$table) return null;

        $modelClass = $table->model_name;
        $column = $table->column_pivot;

        return app($modelClass)
            ->where($column, $this->id)
            ->where('business_id', $this->business_id)
            ->max('updated_at');
    }
}
