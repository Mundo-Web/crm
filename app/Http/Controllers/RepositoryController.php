<?php

namespace App\Http\Controllers;

use App\Models\Repository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\File;

class RepositoryController extends BasicController
{
    public $model = Repository::class;
    public $reactView = 'Repository';
    public $imageFields = ['file'];
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        $files = Repository::where('business_id', Auth::user()->business_id)->get();
        return ['files' => $files];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::where('business_id', Auth::user()->business_id);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        if ($isNew) {
            $ext = $request->file('file')->getClientOriginalExtension();
            $mimetype = $request->file('file')->getMimeType();
            $jpa->description = $jpa->name;
            $jpa->file_size = $request->file('file')->getSize();
            $jpa->file_mimetype = $mimetype;
            $jpa->file_extension = $ext ?: File::getExtention($mimetype);
            $jpa->save();
        }

        return $jpa->toArray();
    }
}
