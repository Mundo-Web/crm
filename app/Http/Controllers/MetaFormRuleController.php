<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use App\Models\MetaFormRule;
use App\Models\Setting;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class MetaFormRuleController extends BasicController
{
    public $model = MetaFormRule::class;
    public $reactView = 'MetaForms';
    public $prefix4filter = 'meta_form_rules';

    public static function extractQuestionsFromClientNotes($businessId, $formId = null, $formName = null)
    {
        try {
            $notes = \App\Models\ClientNote::whereHas('client', function ($q) use ($businessId, $formId, $formName) {
                $q->where('business_id', $businessId);
                if ($formId && !str_starts_with($formId, 'form_')) {
                    $q->where('form_id', $formId);
                } elseif ($formName) {
                    $q->where('form_name', $formName);
                }
            })->orderBy('id', 'desc')->take(100)->get();

            $extractedMap = [];

            foreach ($notes as $note) {
                $desc = $note->description ?? '';
                if (preg_match_all('/(\d+)\.\s*(.*?)(?:<br>|\n)(?:&emsp;|\s+)*(.*?)(?:<br>|\n)/i', $desc, $matches, PREG_SET_ORDER)) {
                    foreach ($matches as $m) {
                        $qText = trim(strip_tags($m[2] ?? ''));
                        $ansVal = trim(strip_tags($m[3] ?? ''));
                        if (!empty($qText) && !in_array(strtolower($qText), ['full_name', 'phone_number', 'email', 'nombre', 'correo', 'teléfono', 'work_phone_number'])) {
                            if (!isset($extractedMap[$qText])) {
                                $extractedMap[$qText] = [
                                    'id' => 'q_' . md5($qText),
                                    'key' => $qText,
                                    'label' => $qText,
                                    'type' => 'CUSTOM',
                                    'options' => []
                                ];
                            }
                            if (!empty($ansVal) && !in_array($ansVal, array_column($extractedMap[$qText]['options'], 'value'))) {
                                $extractedMap[$qText]['options'][] = [
                                    'key' => $ansVal,
                                    'value' => $ansVal
                                ];
                            }
                        }
                    }
                }
            }

            return array_values($extractedMap);
        } catch (\Throwable $th) {
            Log::error('Error extracting questions from ClientNotes: ' . $th->getMessage());
            return [];
        }
    }

    public static function fetchMetaFormsForBusiness($businessId, bool $force = false)
    {
        $cacheKey = "meta_forms_business_{$businessId}";
        $cacheTtl = 6 * 3600; // 6 horas

        if (!$force && Cache::has($cacheKey)) {
            Log::info("fetchMetaFormsForBusiness [CACHE HIT]", ['businessId' => $businessId]);
            return Cache::get($cacheKey);
        }

        $integrations = Integration::where('business_id', $businessId)
            ->where('status', true)
            ->whereIn('meta_service', ['forms', 'messenger', 'facebook', 'instagram'])
            ->get();

        $forms = [];
        $formIdsMap = [];
        
        // Resolve Graph URL using config() to prevent env() returning null on config:cache in production
        $graphUrl = config('services.meta.facebook_graph_url') ?: env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
        if (empty($graphUrl) || !str_starts_with($graphUrl, 'http')) {
            $graphUrl = 'https://graph.facebook.com/v22.0';
        }

        Log::info("fetchMetaFormsForBusiness started", ['businessId' => $businessId, 'integrations_count' => $integrations->count(), 'graphUrl' => $graphUrl]);

        $pageTokens = [];

        // 1. Recopilar todos los meta_app_token (User Tokens) activos de cualquier servicio Meta del negocio
        $userTokens = $integrations->pluck('meta_app_token')->filter()->unique();

        foreach ($userTokens as $uToken) {
            try {
                $meAccountsUrl = "{$graphUrl}/me/accounts?fields=id,name,access_token&limit=100&access_token={$uToken}";
                $meRes = new Fetch($meAccountsUrl);
                if ($meRes->ok) {
                    $meData = $meRes->json();
                    foreach ($meData['data'] ?? [] as $pData) {
                        if (!empty($pData['access_token'])) {
                            $pageTokens[] = $pData['access_token'];
                            Log::info("Derived fresh Page Token from me/accounts", ['page_id' => $pData['id'] ?? null, 'page_name' => $pData['name'] ?? null]);
                        }
                    }
                }
            } catch (\Throwable $th) {
                Log::error("Error fetching me/accounts page tokens: " . $th->getMessage());
            }
        }

        // 2. Añadir los meta_access_token guardados en la BD como respaldo
        foreach ($integrations as $integ) {
            if (!empty($integ->meta_access_token)) {
                $pageTokens[] = $integ->meta_access_token;
            }
        }

        $pageTokens = array_unique(array_filter($pageTokens));

        foreach ($integrations as $integration) {
            if (empty($pageTokens)) continue;

            foreach ($pageTokens as $token) {
                $foundCountBefore = count($forms);

                // A. Consultar ID de negocio/página directo si existe
                if (!empty($integration->meta_business_id)) {
                    try {
                        $formsUrl = "{$graphUrl}/{$integration->meta_business_id}/leadgen_forms?fields=id,name,questions,status,created_time&limit=100&access_token={$token}";
                        $formsRes = new Fetch($formsUrl);
                        if ($formsRes->ok) {
                            $fData = $formsRes->json();
                            Log::info("Meta Forms fetched successfully from Page ID {$integration->meta_business_id}", ['forms_found' => count($fData['data'] ?? [])]);
                            foreach ($fData['data'] ?? [] as $f) {
                                if (isset($f['id']) && !isset($formIdsMap[$f['id']])) {
                                    $formIdsMap[$f['id']] = true;
                                    $forms[] = $f;
                                }
                            }
                        } else {
                            Log::warning("Page leadgen_forms non-200", ['res' => $formsRes->json()]);
                        }
                    } catch (\Throwable $th) {
                        Log::error("Error querying page leadgen_forms: " . $th->getMessage());
                    }
                }

                // B. Consultar todas las páginas devueltas por /me/accounts si aún no hay formularios
                if (empty($forms)) {
                    try {
                        $url = "{$graphUrl}/me/accounts?fields=id,name,access_token&limit=100&access_token={$token}";
                        $pagesRes = new Fetch($url);
                        if ($pagesRes->ok) {
                            $pagesData = $pagesRes->json();
                            foreach ($pagesData['data'] ?? [] as $page) {
                                $pageId = $page['id'] ?? null;
                                $pageToken = $page['access_token'] ?? $token;
                                if ($pageId) {
                                    try {
                                        $formsUrl = "{$graphUrl}/{$pageId}/leadgen_forms?fields=id,name,questions,status,created_time&limit=100&access_token={$pageToken}";
                                        $formsRes = new Fetch($formsUrl);
                                        if ($formsRes->ok) {
                                            $fData = $formsRes->json();
                                            foreach ($fData['data'] ?? [] as $f) {
                                                if (isset($f['id']) && !isset($formIdsMap[$f['id']])) {
                                                    $formIdsMap[$f['id']] = true;
                                                    $forms[] = $f;
                                                }
                                            }
                                        }
                                    } catch (\Throwable $th) {
                                    }
                                }
                            }
                        }
                    } catch (\Throwable $th) {
                    }
                }

                // Si este token obtuvo formularios exitosamente de Meta, salir del bucle de tokens
                if (count($forms) > $foundCountBefore) {
                    break;
                }
            }
        }

        // C. Fallback: ÚNICAMENTE si Meta no retornó formularios reales, buscar en la tabla Ads
        if (empty($forms)) {
            try {
                $adsWithForms = \App\Models\Ad::where('business_id', $businessId)
                    ->whereNotNull('form_name')
                    ->where('form_name', '!=', 'WhatsApp')
                    ->get();

                foreach ($adsWithForms as $ad) {
                    $adFormName = $ad->form_name;
                    $alreadyExists = false;
                    foreach ($forms as $f) {
                        if (($f['name'] ?? '') === $adFormName) {
                            $alreadyExists = true;
                            break;
                        }
                    }
                    if (!$alreadyExists && $adFormName) {
                        $fallbackId = 'form_' . md5($adFormName);
                        if (!isset($formIdsMap[$fallbackId])) {
                            $formIdsMap[$fallbackId] = true;
                            $forms[] = [
                                'id' => $fallbackId,
                                'name' => $adFormName,
                                'questions' => []
                            ];
                        }
                    }
                }
            } catch (\Throwable $th) {
                Log::error("Error querying Ads table fallback: " . $th->getMessage());
            }
        }

        // D. Complementar preguntas faltantes usando notas previas de clientes si fuera necesario
        foreach ($forms as &$f) {
            if (empty($f['questions'])) {
                $f['questions'] = self::extractQuestionsFromClientNotes($businessId, $f['id'] ?? null, $f['name'] ?? null);
            }
        }
        unset($f);

        Log::info("fetchMetaFormsForBusiness completed", ['businessId' => $businessId, 'total_forms' => count($forms)]);

        // Guardar en caché solo si encontramos formularios
        if (!empty($forms)) {
            Cache::put($cacheKey, $forms, $cacheTtl);
        }

        return $forms;
    }

    public function setReactViewProperties(Request $request)
    {
        $businessId = Auth::user()->business_id;

        $statuses = Status::with(['table'])
            ->where('business_id', $businessId)
            ->whereNotNull('status')
            ->get();

        $leadStatuses = $statuses->filter(function ($s) {
            return $s->table_id === 'e05a43e5-b3a6-46ce-8d1f-381a73498f33' || $s->table_id === 'a8367789-666e-4929-aacb-7cbc2fbf74de';
        })->values();

        $manageStatuses = $statuses->filter(function ($s) {
            return $s->table_id === '9c27e649-574a-47eb-82af-851c5d425434';
        })->values();

        $chatStatuses = $statuses->filter(function ($s) {
            return !empty($s->icon);
        })->values();

        $users = User::where('business_id', $businessId)->get();

        $rules = MetaFormRule::with(['chatStatus', 'manageStatus', 'statusRef', 'assigned'])
            ->where('business_id', $businessId)
            ->get();

        $flows = \App\Models\Flow::where('business_id', $businessId)->get();

        $force = $request->boolean('force', false);
        $forms = self::fetchMetaFormsForBusiness($businessId, $force);
        $lastSync = Setting::get('meta_forms_last_sync', $businessId);

        return [
            'leadStatuses'   => $leadStatuses,
            'manageStatuses' => $manageStatuses,
            'chatStatuses'   => $chatStatuses,
            'users'          => $users,
            'rules'          => $rules,
            'flows'          => $flows,
            'metaForms'      => $forms,
            'lastSync'       => $lastSync,
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $businessId = Auth::user()->business_id;
        return $model::where('business_id', $businessId)
            ->with(['chatStatus', 'manageStatus', 'statusRef', 'assigned']);
    }

    public function getLastSync(Request $request)
    {
        $businessId = Auth::user()->business_id;
        $lastSync = Setting::get('meta_forms_last_sync', $businessId);
        return response()->json(['status' => true, 'lastSync' => $lastSync]);
    }

    public function getMetaForms(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = Auth::user()->business_id;
            $force = $request->boolean('force', false);
            $lastSync = Setting::get('meta_forms_last_sync', $businessId);

            if ($force && $lastSync) {
                $lastSyncDate = \Carbon\Carbon::parse($lastSync);
                if ($lastSyncDate->isToday()) {
                    throw new \Exception("La sincronización con Meta solo se permite 1 vez al día para evitar bloqueos. Última sincronización: " . $lastSyncDate->format('d/m/Y H:i'));
                }
            }

            if ($force) {
                Cache::forget("meta_forms_business_{$businessId}");
            }

            $forms = self::fetchMetaFormsForBusiness($businessId, $force);

            if ($force && !empty($forms)) {
                Setting::set('meta_forms_last_sync', now()->toIso8601String(), $businessId);
            }

            return $forms;
        });

        return response($response->toArray(), $response->status);
    }

    public function getFormQuestions(Request $request, string $formId)
    {
        $response = Response::simpleTryCatch(function () use ($formId, $request) {
            $businessId = Auth::user()->business_id;
            $cacheKey   = "meta_form_questions_{$businessId}_{$formId}";
            $force      = $request->boolean('force', false);

            if (!$force && Cache::has($cacheKey)) {
                return Cache::get($cacheKey);
            }

            $integrations = Integration::where('business_id', $businessId)
                ->where('status', true)
                ->whereIn('meta_service', ['forms', 'messenger', 'facebook', 'instagram'])
                ->get();

            $graphUrl = config('services.meta.facebook_graph_url', 'https://graph.facebook.com/v22.0');

            $data = null;

            foreach ($integrations as $integration) {
                $pageTokens = [];

                if (!empty($integration->meta_app_token)) {
                    try {
                        $meAccountsUrl = "{$graphUrl}/me/accounts?fields=id,name,access_token&limit=100&access_token={$integration->meta_app_token}";
                        $meRes = new Fetch($meAccountsUrl);
                        if ($meRes->ok) {
                            $meData = $meRes->json();
                            foreach ($meData['data'] ?? [] as $pData) {
                                if (!empty($pData['access_token'])) {
                                    $pageTokens[] = $pData['access_token'];
                                }
                            }
                        }
                    } catch (\Throwable $th) {
                    }
                }

                if (!empty($integration->meta_access_token)) {
                    $pageTokens[] = $integration->meta_access_token;
                }

                $pageTokens = array_unique(array_filter($pageTokens));

                foreach ($pageTokens as $token) {
                    try {
                        $res = new Fetch("{$graphUrl}/{$formId}?fields=id,name,questions,status&access_token={$token}");
                        if ($res->ok) {
                            $json = $res->json();
                            if (isset($json['id']) && !empty($json['questions'])) {
                                $data = $json;
                                break 2;
                            }
                        }
                    } catch (\Throwable $th) {
                        Log::error("getFormQuestions exception for form {$formId}: " . $th->getMessage());
                    }
                }
            }

            $extractedQuestions = self::extractQuestionsFromClientNotes($businessId, $formId);

            $result = [
                'id'        => $formId,
                'name'      => $data['name'] ?? 'Formulario ' . $formId,
                'questions' => !empty($data['questions']) ? $data['questions'] : $extractedQuestions
            ];

            // Cachear preguntas por 12 horas (cambian muy poco)
            if (!empty($result['questions'])) {
                Cache::put($cacheKey, $result, 12 * 3600);
            }

            return $result;
        });

        return response($response->toArray(), $response->status);
    }

    public function saveTree(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $businessId = Auth::user()->business_id;
            $formId     = $request->input('form_id');
            $formName   = $request->input('form_name');
            $ruleName   = $request->input('rule_name', 'Árbol de Decisión');
            $tree       = $request->input('tree');
            $ruleId     = $request->input('id');

            if (empty($formId)) {
                throw new \Exception('El ID del formulario es requerido');
            }

            if ($ruleId) {
                $rule = MetaFormRule::where('business_id', $businessId)->find($ruleId);
            } else {
                $rule = MetaFormRule::where('business_id', $businessId)->where('form_id', $formId)->first();
            }

            if (!$rule) {
                $rule = new MetaFormRule();
                $rule->business_id = $businessId;
                $rule->form_id     = $formId;
            }

            $rule->form_name = $formName ?: ($rule->form_name ?? "Formulario {$formId}");
            $rule->rule_name = $ruleName;
            $rule->tree      = $tree;
            $rule->status    = true;
            $rule->save();

            return $rule->fresh(['chatStatus', 'manageStatus', 'statusRef', 'assigned']);
        });

        return response($response->toArray(), $response->status);
    }
}
