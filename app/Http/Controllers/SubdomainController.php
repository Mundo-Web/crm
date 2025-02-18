<?php

namespace App\Http\Controllers;

use App\Models\Subdomain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Crypto;
use Illuminate\Support\Str;


class SubdomainController extends BasicController
{
    public $model = Subdomain::class;
    public $reactView = 'Pages';
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        $correlative = $request->correlative;
        $subdomain = Subdomain::where('correlative', $correlative)->first();
        if (!$subdomain) abort(404);

        return [
            'subdomains' => Subdomain::where('business_id', Auth::user()->business_id)->get(),
            'subdomain' => $subdomain
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::select();
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();

        $jpa = Subdomain::where('project_id', $request->project_id)->first();
        if ($jpa) $body['id'] = $jpa->id;

        $slug = Str::slug($request->name);
        $slugExists = Subdomain::where('project_id', '<>', $request->project_id)->where('correlative', $slug)->exists();
        if ($slugExists) $body['correlative'] = $slug . '-' . Crypto::short();
        else $body['correlative'] = $slug;

        $body['business_id'] = Auth::user()->business_id;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        return $jpa;
    }
}
