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
        $response = Response::simpleTryCatch(function () use ($client) {
            $products = Product::select([
                'products.*',
                'chp.id AS pivot_id',
                'chp.price AS pivot_price'
            ])
                ->join('client_has_products AS chp', 'chp.product_id', 'products.id')
                ->where('chp.client_id', $client)
                ->get();

            return $products;
        });
        return response($response->toArray(), $response->status);
    }

    public function afterSave(Request $request, object $jpa, ?bool $isNew)
    {
        $productJpa = Product::select([
            'products.*',
            'chp.id AS pivot_id',
            'chp.price AS pivot_price'
        ])
            ->join('client_has_products AS chp', 'chp.product_id', 'products.id')
            ->where('chp.id', $jpa->id)
            ->first();
        return $productJpa;
    }
}
