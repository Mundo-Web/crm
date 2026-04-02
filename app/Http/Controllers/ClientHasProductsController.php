<?php

namespace App\Http\Controllers;

use App\Models\ClientHasProducts;
use App\Models\Product;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use SoDe\Extend\Response;

class ClientHasProductsController extends BasicController
{
    public $model = ClientHasProducts::class;
    public $softDeletion = false;

    public function byClient(Request $request, $client): HttpResponse|ResponseFactory
    {
        $response = Response::simpleTryCatch(function (Response $response) use ($client) {
            $clientModel = \App\Models\Client::find($client);
            if (!$clientModel) {
                $response->data = [];
                return;
            }
            $response->data = $clientModel->products->map(function ($product) {
                $product->pivot_id = $product->pivot->id;
                $product->pivot_price = $product->pivot->price;
                return $product;
            })->values()->toArray();
        });
        return response($response->toArray(), $response->status);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $chp = ClientHasProducts::find($jpa->id);
        if (!$chp) return null;

        $product = Product::find($chp->product_id);
        if ($product) {
            $product->pivot_id = $chp->id;
            $product->pivot_price = $chp->price;
        }
        return $product;
    }
}
