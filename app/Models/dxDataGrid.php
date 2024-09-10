<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use SoDe\Extend\JSON;
use SoDe\Extend\Text;

class dxDataGrid
{
    static function filter(Builder $builder, array $dxFilter, bool $flat = true, $prefix4undotted = null, $ignorePrefix = [])
    {
        if (\count($dxFilter) == 0) return;
        $hasArray = JSON::find($dxFilter, function ($x) {
            return \gettype($x) == 'array';
        });
        if ($hasArray) {
            if ($dxFilter[0] == '!') {
                $filtering = $dxFilter[1];
                $builder->whereNot(function ($query) use ($filtering, $flat, $prefix4undotted, $ignorePrefix) {
                    dxDataGrid::filter($query, $filtering, $flat, $prefix4undotted, $ignorePrefix);
                });
            } else {
                $isAnd = JSON::find($dxFilter, function ($x) {
                    return $x == 'and';
                });
                $dxFilter = \array_filter($dxFilter, function ($x) {
                    return \gettype($x) == 'array';
                });
                foreach ($dxFilter as $filtering) {
                    if ($isAnd) {
                        $builder->where(function ($query) use ($filtering, $flat, $prefix4undotted, $ignorePrefix) {
                            dxDataGrid::filter($query, $filtering, $flat, $prefix4undotted, $ignorePrefix);
                        });
                    } else {
                        $builder->orWhere(function ($query) use ($filtering, $flat, $prefix4undotted, $ignorePrefix) {
                            dxDataGrid::filter($query, $filtering, $flat, $prefix4undotted, $ignorePrefix);
                        });
                    }
                }
            }
        } else {
            $selector = $dxFilter[0];
            if (!str_contains($selector, '.') && $prefix4undotted && !Text::startsWith($selector, '!') && !in_array($selector, $ignorePrefix)) {
                $selector = "{$prefix4undotted}.{$selector}";
            } else {
                $selector = str_replace('!', '', $selector);
            }
            if ($flat) $selector = \str_replace('.', '__', $dxFilter[0]);
            switch ($dxFilter[1]) {
                case 'contains':
                    $builder->where($selector, 'like', "%{$dxFilter[2]}%");
                    break;
                case 'notcontains':
                    $builder->where($selector, 'not like', "%{$dxFilter[2]}%");
                    break;
                case '=':
                    if ($dxFilter[2] == null) {
                        $builder
                            ->whereNull($selector)
                            ->orWhere($selector, '');
                    } else {
                        $builder
                            ->where($selector, '=', $dxFilter[2]);
                    }
                    break;
                case '<>':
                    if ($dxFilter[2] == null) {
                        $builder
                            ->whereNotNull($selector)
                            ->where($selector, '<>', '');
                    } else {
                        $builder
                            ->where($selector, '<>', $dxFilter[2])
                            ->orWhereNull($selector);
                    }
                    break;
                case 'startswith':
                    $builder->where($selector, 'like', "{$dxFilter[2]}%");
                    break;
                case 'endswith':
                    $builder->where($selector, 'like', "%{$dxFilter[2]}");
                    break;
                case 'isblank':
                    $builder
                        ->whereNull($selector)
                        ->orWhere($selector, '=', '');
                    break;
                case 'isnotblank':
                    $builder
                        ->whereNotNull($selector)
                        ->Where($selector, '<>', '');
                    break;
                case 'isnull':
                    $builder->whereNull($selector);
                    break;
                case 'isnotnull':
                    $builder->whereNotNull($selector);
                    break;
                default:
                    $builder->where($selector, $dxFilter[1], $dxFilter[2]);
                    break;
            }
        }
    }
}
