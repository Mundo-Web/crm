<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;

class PageController extends BasicController
{
    public $model = Page::class;
    public $imageFields = ['img_desktop', 'img_tablet', 'img_mobile'];
}
