<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Type;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends BasicController
{
    public $model = Product::class;
    public $reactView = 'Products.jsx';

    public function setReactViewProperties(Request $request)
    {
        $products = Product::where('business_id', Auth::user()->business_id)->get();
        $types = Type::ofProducts()
            ->where('status', true)
            ->get();
        return [
            'products' => $products,
            'types' => $types
        ];
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        return $jpa;
    }
}
