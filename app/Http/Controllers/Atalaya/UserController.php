<?php

namespace App\Http\Controllers\Atalaya;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Http\Controllers\MailingController;
use App\Models\Atalaya\User as AtalayaUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class UserController extends BasicController
{
    public $model = AtalayaUser::class;
    public $filterBusiness = false;

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = dxResponse::simpleTryCatch(function ($response) use ($request) {
            $searchValue = $request->searchValue;
            $usersJpa = User::byBusiness();

            $query = AtalayaUser::query()
                ->whereNotIn('id', $usersJpa->map(fn($userJpa) => $userJpa->id))
                ->where(function ($query2) use ($searchValue) {
                    $query2->where('email', 'like', '%' . $searchValue . '%')
                        ->orWhere(function ($query3) use ($searchValue) {
                            $words = explode(' ', $searchValue);
                            foreach ($words as $word) {
                                $query3->where('fullname', 'like', '%' . $word . '%');
                            }
                        });
                });
            $result = $query->limit(10)->get();
            $exactEmailMatch = $result->first(function ($user) use ($searchValue) {
                return strtolower($user->email) === strtolower($searchValue);
            });
            $emailAlreadyExists = $usersJpa->first(function ($user) use ($searchValue) {
                return strtolower($user->email) === strtolower($searchValue);
            });
            if (!$exactEmailMatch && !$emailAlreadyExists && MailingController::isEmail($searchValue)) {
                $response->summary = ['isValid' => MailingController::isValid($searchValue)];
            }
            return $result;
        });
        return response($response->toArray(), $response->status);
    }

    public function invite(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $email = $request->email;
            $url = env('APP_PROTOCOL') . '://' . env('APP_DOMAIN') . '/api/users-by-services-by-business';
            $res = new Fetch($url, [
                'method' => 'POST',
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-Xsrf-Token' => $request->header('X-Xsrf-Token')
                ],
                'body' => [
                    'email' => $email
                ]
            ]);
            dump($res->text());
            dump($url);
        });

        return response($response->toArray(), $response->status);
    }
}
