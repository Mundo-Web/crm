<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Atalaya\Business;
use App\Models\dxDataGrid;
use App\Models\View;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class BasicController extends Controller
{
  public $model = Model::class;
  public $softDeletion = true;
  public $reactView = 'Home';
  public $reactRootView = 'admin';
  public $prefix4filter = null;


  public function setPaginationInstance(string $model)
  {
    return $model::select();
  }

  public function setReactViewProperties(Request $request)
  {
    return [];
  }

  public function reactView(Request $request)
  {
    $views = View::with(['table'])->where('business_id', Auth::user()->business_id)->get();
    $businessesIWork = Business::select([
      DB::raw('DISTINCT businesses.*')
    ])
      ->with(['person'])
      ->join('services_by_businesses', 'services_by_businesses.business_id', 'businesses.id')
      ->join('users_by_services_by_businesses', 'users_by_services_by_businesses.service_by_business_id', 'services_by_businesses.id')
      ->join('services', 'services.id', 'services_by_businesses.service_id')
      ->where('services.correlative', env('APP_CORRELATIVE', 'crm'))
      ->where('users_by_services_by_businesses.user_id', Auth::user()->id)
      ->get();
    $properties = [
      'businesses' => $businessesIWork,
      'presets' => $views,
      'session' => Auth::user(),
      'WA_URL' => env('WA_URL'),
      'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
      'APP_URL' => env('APP_URL'),
      'APP_DOMAIN' => env('APP_DOMAIN', 'atalaya.localhost'),
      'APP_CORRELATIVE' => env('APP_CORRELATIVE', 'crm'),
    ];
    foreach ($this->setReactViewProperties($request) as $key => $value) {
      $properties[$key] = $value;
    }
    return Inertia::render($this->reactView, $properties)->rootView($this->reactRootView);
  }

  public function paginate(Request $request): HttpResponse|ResponseFactory
  {
    $response =  new dxResponse();
    try {
      $instance = $this->setPaginationInstance($this->model);

      if ($request->group != null) {
        [$grouping] = $request->group;
        // $selector = str_replace('.', '__', $grouping['selector']);
        $selector = $grouping['selector'];
        if (!str_contains($selector, '.') && $this->prefix4filter) {
          $selector = "{$this->prefix4filter}.{$selector}";
        }
        $instance = $this->model::select([
          "{$selector} AS key"
        ])
          ->groupBy($selector);
      }

      if ($this->prefix4filter) {
        $instance->where("{$this->prefix4filter}.business_id", Auth::user()->business_id);
      } else {
        $instance->where('business_id', Auth::user()->business_id);
      }

      if ($request->filter) {
        $instance->where(function ($query) use ($request) {
          dxDataGrid::filter($query, $request->filter ?? [], false, $this->prefix4filter);
        });
      }

      if ($request->sort != null) {
        foreach ($request->sort as $sorting) {
          // $selector = \str_replace('.', '__', $sorting['selector']);
          $selector = $sorting['selector'];
          if (!str_contains($selector, '.') && $this->prefix4filter) {
            $selector = "{$this->prefix4filter}.{$selector}";
          }
          $instance->orderBy(
            $selector,
            $sorting['desc'] ? 'DESC' : 'ASC'
          );
        }
      } else {
        if ($this->prefix4filter) {
          $instance->orderBy("{$this->prefix4filter}.id", 'DESC');
        } else {
          $instance->orderBy('id', 'DESC');
        }
      }

      $totalCount = 0;
      if ($request->requireTotalCount) {
        $totalCount = $instance->count('*');
      }

      $jpas = $request->isLoadingAll
        ? $instance->get()
        : $instance
        ->skip($request->skip ?? 0)
        ->take($request->take ?? 10)
        ->get();

      $response->status = 200;
      $response->message = 'Operación correcta';
      $response->data = $jpas;
      $response->totalCount = $totalCount;
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function beforeSave(Request $request)
  {
    return $request->all();
  }

  public function save(Request $request): HttpResponse|ResponseFactory
  {
    $response = new Response();
    try {

      $body = $this->beforeSave($request);
      $jpa = $this->model::find(isset($body['id']) ? $body['id'] : null);

      $body['business_id'] = Auth::user()->business_id;

      if (!$jpa) {
        $jpa = $this->model::create($body);
      } else {
        $jpa->update($body);
      }

      $data = $this->afterSave($request, $jpa);
      if ($data) {
        $response->data = $data;
      }

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function afterSave(Request $request, object $jpa)
  {
    return null;
  }

  public function status(Request $request)
  {
    $response = new Response();
    try {
      $this->model::where('id', $request->id)
        ->update([
          'status' => $request->status ? 0 : 1
        ]);

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function delete(Request $request, string $id)
  {
    $response = new Response();
    try {
      $deleted = $this->softDeletion
        ? $this->model::where('id', $id)
        ->update(['status' => null])
        : $this->model::where('id', $id)
        ->delete();

      if (!$deleted) throw new Exception('No se ha eliminado ningun registro');

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }
}
