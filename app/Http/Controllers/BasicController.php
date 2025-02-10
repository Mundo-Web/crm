<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\dxDataGrid;
use App\Models\Notification;
use App\Models\Setting;
use App\Models\Task;
use App\Models\View;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use SoDe\Extend\Crypto;
use Illuminate\Support\Facades\Schema;

class BasicController extends Controller
{
  public $model = Model::class;
  public $softDeletion = true;
  public $reactView = 'Home';
  public $reactRootView = 'admin';
  public $prefix4filter = null;
  public $ignorePrefix = [];
  public $filterBusiness = true;
  public $throwMediaError = false;
  public $imageFields = [];

  public function media(Request $request, string $uuid)
  {
    try {
      $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));
      if (Text::has($uuid, '.')) {
        $route = "images/{$snake_case}/{$uuid}";
      } else {
        $route = "images/{$snake_case}/{$uuid}.img";
      }
      $content = Storage::get($route);
      if (!$content) throw new Exception('Imagen no encontrado');
      return response($content, 200, [
        'Content-Type' => 'application/octet-stream'
      ]);
    } catch (\Throwable $th) {
      $content = Storage::get('utils/cover-404.svg');
      $status = 200;
      if ($this->throwMediaError) return null;
      return response($content, $status, [
        'Content-Type' => 'image/svg+xml'
      ]);
    }
  }

  public function setPaginationInstance(string $model)
  {
    return $model::select();
  }

  public function setPaginationSummary(string $model, Builder $query)
  {
    return [];
  }

  public function setReactViewProperties(Request $request)
  {
    return [];
  }

  public function reactView(Request $request)
  {
    // $views = View::with(['table'])->where('business_id', Auth::user()->business_id)->get();
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
    $notificationsCount = Notification::where(function ($query) {
      $query->where('notify_to', Auth::user()->service_user->id);
      $query->orWhereNull('notify_to');
    })
      ->where('business_id', Auth::user()->business_id)
      ->where('module', '<>', 'Leads')
      ->where('seen', false)
      ->where('status', true)
      ->count();

    $tasksCount = Task::with(['clientNote', 'assigned', 'clientNote', 'clientNote.client'])
      ->join('client_notes AS client_note', 'client_note.id', 'tasks.note_id')
      ->join('clients AS client', 'client.id', 'client_note.client_id')
      ->where('tasks.assigned_to', Auth::user()->service_user->id)
      ->where('client.business_id', Auth::user()->business_id)
      ->whereNotNull('client.status')
      ->where('tasks.status', 'Pendiente')
      ->count();

    $defaultStatus = Setting::get('default-lead-status');

    $leadsCount = Client::where('business_id', Auth::user()->business_id)
      ->where('status_id', $defaultStatus)
      ->where('status', true)
      ->count();

    $properties = [
      'businesses' => $businessesIWork,
      // 'presets' => $views,
      'session' => Auth::user(),
      'notificationsCount' => $notificationsCount,
      'tasksCount' => $tasksCount,
      'leadsCount' => $leadsCount,
      'global' => [
        'WA_URL' => env('WA_URL'),
        'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
        'APP_URL' => env('APP_URL'),
        'APP_DOMAIN' => env('APP_DOMAIN', 'atalaya.localhost'),
        'APP_CORRELATIVE' => env('APP_CORRELATIVE', 'crm'),
      ],
      'WA_URL' => env('WA_URL'),
      'PUBLIC_RSA_KEY' => Controller::$PUBLIC_RSA_KEY,
      'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
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
        if (!str_contains($selector, '.') && $this->prefix4filter && !Text::startsWith($selector, '!') && !in_array($selector, $this->ignorePrefix)) {
          $selector = "{$this->prefix4filter}.{$selector}";
        }
        // $instance = $this->model::select(DB::raw("{$selector} AS key"))
        $instance = $instance->select(DB::raw("{$selector} AS key"))
          ->groupBy(str_replace('!', '', $selector));
      }

      if ($this->filterBusiness) {
        if (Schema::hasColumn((new $this->model)->getTable(), 'business_id')) {
          if ($this->prefix4filter) {
            $instance->where("{$this->prefix4filter}.business_id", Auth::user()->business_id);
          } else {
            $instance->where('business_id', Auth::user()->business_id);
          }
        }
      }

      if ($request->filter) {
        $instance->where(function ($query) use ($request) {
          dxDataGrid::filter($query, $request->filter ?? [], false, $this->prefix4filter, $this->ignorePrefix);
        });
      }

      if ($request->sort != null) {
        foreach ($request->sort as $sorting) {
          // $selector = \str_replace('.', '__', $sorting['selector']);
          $selector = $sorting['selector'];
          if (!str_contains($selector, '.') && $this->prefix4filter && !Text::startsWith($selector, '!') && !in_array($selector, $this->ignorePrefix)) {
            $selector = "{$this->prefix4filter}.{$selector}";
          }
          $instance->orderBy(
            str_replace('!', '', $selector),
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
        try {
          $instance4count = clone $instance;
          $instance4count->getQuery()->groups = null;
          // $totalCount = $instance->count();
          if ($this->prefix4filter) {
            $totalCount = $instance4count->select(DB::raw("COUNT(DISTINCT({$this->prefix4filter}.id)) as total_count"))->value('total_count');
          } else {
            $totalCount = $instance4count->select(DB::raw('COUNT(DISTINCT(id)) as total_count'))->value('total_count');
          }
        } catch (\Throwable $th) {
          //throw $th;
        }
      }

      $response->summary = $this->setPaginationSummary($this->model, clone $instance);

      $jpas = [];
      if ($request->requireData !== false) {
        $jpas = $request->isLoadingAll
          ? $instance->get()
          : $instance
          ->skip($request->skip ?? 0)
          ->take($request->take ?? 10)
          ->get();
      }

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

      $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));

      foreach ($this->imageFields as $field) {
        if (!$request->hasFile($field)) continue;
        $full = $request->file($field);
        $uuid = Crypto::randomUUID();
        $ext = $full->getClientOriginalExtension();
        $path = "images/{$snake_case}/{$uuid}.{$ext}";
        Storage::put($path, file_get_contents($full));
        $body[$field] = "{$uuid}.{$ext}";
      }

      $jpa = $this->model::find(isset($body['id']) ? $body['id'] : null);

      if (!isset($body['business_id'])) {
        $body['business_id'] = Auth::user()->business_id;
      }

      if (!$jpa) {
        $isNew = true;
        $jpa = $this->model::create($body);
      } else {
        $isNew = false;
        $jpa->update($body);
      }

      $data = $this->afterSave($request, $jpa, $isNew);
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

  public function afterSave(Request $request, object $jpa, ?bool $isNew)
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

  public function boolean(Request $request)
  {
    $response = new Response();
    try {
      $data = [];
      $data[$request->field] = $request->value;

      $this->model::where('id', $request->id)
        ->update($data);

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

  public function beforeDelete(Request $request)
  {
    return [];
  }

  public function afterDelete(Model $data)
  {
    return [];
  }

  public function delete(Request $request, string $id)
  {
    $response = new Response();
    try {
      $body = $this->beforeDelete($request);

      $dataBeforeDelete = new $this->model;
      if ($this->softDeletion) {
        $deleted = $this->model::where('id', $id)
          ->update(\array_merge(['status' => null], $body));
        $dataBeforeDelete = $this->model::find($id);
      } else {
        $deleted = $this->model::where('id', $id)
          ->delete();
      }

      dump($dataBeforeDelete);

      $this->afterDelete($dataBeforeDelete);

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
