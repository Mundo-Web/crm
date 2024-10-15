<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Type;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Ramsey\Uuid\Uuid;
use SoDe\Extend\Text;

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

    public function beforeSave(Request $request)
    {
        $type_id = null;
        if (!Text::nullOrEmpty($request->type_id)) {
            if (Uuid::isValid($request->type_id)) {
                $type = Type::where('id', $request->type_id)
                    ->where('business_id', Auth::user()->business_id)
                    ->exists();
                if (!$type) throw new Exception('Este tipo no está configurado.');
                $type_id = $request->type_id;
            } else {
                $type = Type::create4products([
                    'name' => $request->type_id,
                    'business_id' => Auth::user()->business_id
                ]);
                $type_id = $type->id;
            }
        }

        return [
            ...$request->all(),
            'type_id' => $type_id
        ];
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $product = Product::with('type')->find($jpa->id);
        return $product;
    }
}
