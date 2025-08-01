<?php

namespace App\Http\Controllers\Atalaya;

use App\Http\Classes\dxResponse;
use App\Http\Classes\EmailConfig;
use App\Http\Controllers\BasicController;
use App\Http\Controllers\MailingController;
use App\Models\Atalaya\Constant as AtalayaConstant;
use App\Models\Atalaya\ServicesByBusiness;
use App\Models\Atalaya\User as AtalayaUser;
use App\Models\Atalaya\UsersByServicesByBusiness;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Crypto;
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
            $userJpa = AtalayaUser::where('email', $request->email)
                ->where('status', true)
                ->first();

            if (!$userJpa) {
                return $this->inviteExternal($request->email);
            }
            $serviceByBusinessJpa = ServicesByBusiness::with('service', 'business')
                ->where('id', $request->match)
                ->first();
            if (!$serviceByBusinessJpa) throw new Exception('El servicio no existe o no tienes permisos para vincular');

            $ubsbb = UsersByServicesByBusiness::updateOrCreate([
                'user_id' => $userJpa->id,
                'service_by_business_id' => $serviceByBusinessJpa->id
            ], [
                'user_id' => $userJpa->id,
                'service_by_business_id' => $serviceByBusinessJpa->id,
                'created_by' => Auth::user()->id,
                'invitation_token' => Crypto::randomUUID(),
                'invitation_accepted' => Auth::user()->id == $userJpa->id
            ]);

            if ($ubsbb->invitation_accepted) return;

            $urlConfirm = env('APP_PROTOCOL') . '://' . env('APP_DOMAIN') . '/invitation/' . $ubsbb->invitation_token;
            $content = AtalayaConstant::value('accept-invitation');
            $content = str_replace('{SENDER}', Auth::user()->name, $content);
            $content = str_replace('{SERVICE}', $serviceByBusinessJpa->service->name, $content);
            $content = str_replace('{BUSINESS}', $serviceByBusinessJpa->business->name, $content);
            $content = str_replace('{URL_CONFIRM}', $urlConfirm, $content);

            $mailer = EmailConfig::config();
            $mailer->Subject = 'Confirmacion - Atalaya';
            $mailer->Body = $content;
            $mailer->addAddress($userJpa->email);
            $mailer->isHTML(true);
            $mailer->send();

            return User::byBusiness($userJpa->id);
        });

        return response($response->toArray(), $response->status);
    }
    public function inviteExternal(string $email) {}

    public function delete(Request $request, string $id)
    {
        $response = Response::simpleTryCatch(function () use ($request, $id) {
            $match = ServicesByBusiness::select('services_by_businesses.id')
                ->join('services', 'services.id', 'services_by_businesses.service_id')
                ->where('services.correlative', env('APP_CORRELATIVE'))
                ->where('business_id', Auth::user()->business_id)
                ->first()->id;
            $ubsbb = UsersByServicesByBusiness::query()
                ->where('user_id', $id)
                ->where('service_by_business_id', $match)
                ->first();
            if (!$ubsbb) throw new Exception('El usuario no existe o no tienes permisos para eliminar');
            $ubsbb->delete();
        });
        return response($response->toArray(), $response->status);
    }
}
