<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use App\Models\MetaFormRule;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

    public static function fetchMetaFormsForBusiness($businessId)
    {
        $integrations = Integration::where('business_id', $businessId)
            ->where('status', true)
            ->get();

        $forms = [];
        $formIdsMap = [];
        
        // Resolve Graph URL using config() to prevent env() returning null on config:cache in production
        $graphUrl = config('services.meta.facebook_graph_url') ?: env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
        if (empty($graphUrl) || !str_starts_with($graphUrl, 'http')) {
            $graphUrl = 'https://graph.facebook.com/v22.0';
        }

        Log::info("fetchMetaFormsForBusiness started", ['businessId' => $businessId, 'integrations_count' => $integrations->count(), 'graphUrl' => $graphUrl]);

        foreach ($integrations as $integration) {
            $tokens = array_unique(array_filter([
                $integration->meta_access_token,
                $integration->meta_app_token,
            ]));

            foreach ($tokens as $token) {
                // A. Consultar páginas del usuario vía /me/accounts
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
                                        Log::info("Meta Forms from Page {$pageId}", ['forms_found' => count($fData['data'] ?? [])]);
                                        foreach ($fData['data'] ?? [] as $f) {
                                            if (isset($f['id']) && !isset($formIdsMap[$f['id']])) {
                                                $formIdsMap[$f['id']] = true;
                                                $forms[] = $f;
                                            }
                                        }
                                    } else {
                                        Log::warning("Page leadgen_forms non-200", ['pageId' => $pageId, 'res' => $formsRes->json()]);
                                    }
                                } catch (\Throwable $th) {
                                    Log::error("Error querying page {$pageId} leadgen_forms: " . $th->getMessage());
                                }
                            }
                        }
                    } else {
                        Log::warning("me/accounts non-200", ['res' => $pagesRes->json()]);
                    }
                } catch (\Throwable $th) {
                    Log::error("Error querying /me/accounts: " . $th->getMessage());
                }

                // B. Consultar ID de negocio/página directo si existe
                if (!empty($integration->meta_business_id)) {
                    try {
                        $formsUrl = "{$graphUrl}/{$integration->meta_business_id}/leadgen_forms?fields=id,name,questions,status,created_time&limit=100&access_token={$token}";
                        $formsRes = new Fetch($formsUrl);
                        if ($formsRes->ok) {
                            $fData = $formsRes->json();
                            Log::info("Meta Forms from Business ID {$integration->meta_business_id}", ['forms_found' => count($fData['data'] ?? [])]);
                            foreach ($fData['data'] ?? [] as $f) {
                                if (isset($f['id']) && !isset($formIdsMap[$f['id']])) {
                                    $formIdsMap[$f['id']] = true;
                                    $forms[] = $f;
                                }
                            }
                        } else {
                            Log::warning("meta_business_id leadgen_forms non-200", ['res' => $formsRes->json()]);
                        }
                    } catch (\Throwable $th) {
                        Log::error("Error querying meta_business_id leadgen_forms: " . $th->getMessage());
                    }
                }

                // C. Consultar Cuenta Publicitaria si existe
                if (!empty($integration->meta_ad_account_id)) {
                    $adAccountId = $integration->meta_ad_account_id;
                    if (!str_starts_with($adAccountId, 'act_')) {
                        $adAccountId = 'act_' . $adAccountId;
                    }
                    try {
                        $formsUrl = "{$graphUrl}/{$adAccountId}/leadgen_forms?fields=id,name,questions,status,created_time&limit=100&access_token={$token}";
                        $formsRes = new Fetch($formsUrl);
                        if ($formsRes->ok) {
                            $fData = $formsRes->json();
                            Log::info("Meta Forms from AdAccount {$adAccountId}", ['forms_found' => count($fData['data'] ?? [])]);
                            foreach ($fData['data'] ?? [] as $f) {
                                if (isset($f['id']) && !isset($formIdsMap[$f['id']])) {
                                    $formIdsMap[$f['id']] = true;
                                    $forms[] = $f;
                                }
                            }
                        } else {
                            Log::warning("ad_account leadgen_forms non-200", ['res' => $formsRes->json()]);
                        }
                    } catch (\Throwable $th) {
                        Log::error("Error querying ad account leadgen_forms: " . $th->getMessage());
                    }

                    // D. Buscar form_ids desde Anuncios
                    try {
                        $creativesUrl = "{$graphUrl}/{$adAccountId}/ads?fields=id,creative{object_story_spec,asset_feed_spec}&limit=100&access_token={$token}";
                        $creativesRes = new Fetch($creativesUrl);
                        if ($creativesRes->ok) {
                            $cData = $creativesRes->json();
                            $specs = ['video_data', 'link_data', 'photo_data', 'template_data'];
                            foreach ($cData['data'] ?? [] as $adItem) {
                                $creative = $adItem['creative'] ?? [];
                                $foundFormId = null;
                                foreach ($specs as $spec) {
                                    if (isset($creative['object_story_spec'][$spec]['call_to_action']['value']['lead_gen_form_id'])) {
                                        $foundFormId = $creative['object_story_spec'][$spec]['call_to_action']['value']['lead_gen_form_id'];
                                        break;
                                    }
                                }
                                if ($foundFormId && !isset($formIdsMap[$foundFormId])) {
                                    try {
                                        $fRes = new Fetch("{$graphUrl}/{$foundFormId}?fields=id,name,questions,status&access_token={$token}");
                                        if ($fRes->ok) {
                                            $fObj = $fRes->json();
                                            if (isset($fObj['id'])) {
                                                $formIdsMap[$fObj['id']] = true;
                                                $forms[] = $fObj;
                                            }
                                        }
                                    } catch (\Throwable $th) {
                                    }
                                }
                            }
                        }
                    } catch (\Throwable $th) {
                        Log::error("Error querying ad creatives: " . $th->getMessage());
                    }
                }
            }
        }

        // E. Fallback: Formularios detectados en la tabla Ads
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

        // Fallback: Populate missing questions from ClientNotes
        foreach ($forms as &$f) {
            if (empty($f['questions'])) {
                $f['questions'] = self::extractQuestionsFromClientNotes($businessId, $f['id'] ?? null, $f['name'] ?? null);
            }
        }
        unset($f);

        Log::info("fetchMetaFormsForBusiness completed", ['businessId' => $businessId, 'total_forms' => count($forms)]);

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

        $forms = self::fetchMetaFormsForBusiness($businessId);

        return [
            'leadStatuses'   => $leadStatuses,
            'manageStatuses' => $manageStatuses,
            'chatStatuses'   => $chatStatuses,
            'users'          => $users,
            'rules'          => $rules,
            'metaForms'      => $forms,
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $businessId = Auth::user()->business_id;
        return $model::where('business_id', $businessId)
            ->with(['chatStatus', 'manageStatus', 'statusRef', 'assigned']);
    }

    public function getMetaForms(Request $request)
    {
        $response = Response::simpleTryCatch(function () {
            $businessId = Auth::user()->business_id;
            return self::fetchMetaFormsForBusiness($businessId);
        });

        return response($response->toArray(), $response->status);
    }

    public function getFormQuestions(Request $request, string $formId)
    {
        $response = Response::simpleTryCatch(function () use ($formId) {
            $businessId = Auth::user()->business_id;
            $integrations = Integration::where('business_id', $businessId)
                ->where('status', true)
                ->get();

            $graphUrl = config('services.meta.facebook_graph_url') ?: env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
            if (empty($graphUrl) || !str_starts_with($graphUrl, 'http')) {
                $graphUrl = 'https://graph.facebook.com/v22.0';
            }

            $data = null;

            foreach ($integrations as $integration) {
                $tokens = array_unique(array_filter([
                    $integration->meta_access_token,
                    $integration->meta_app_token,
                ]));

                foreach ($tokens as $token) {
                    try {
                        $res = new Fetch("{$graphUrl}/{$formId}?fields=id,name,questions,status&access_token={$token}");
                        if ($res->ok) {
                            $json = $res->json();
                            if (isset($json['id']) && !empty($json['questions'])) {
                                $data = $json;
                                break 2;
                            }
                        } else {
                            Log::warning("getFormQuestions non-200 for form {$formId}", ['res' => $res->json()]);
                        }
                    } catch (\Throwable $th) {
                        Log::error("getFormQuestions exception for form {$formId}: " . $th->getMessage());
                    }
                }
            }

            $extractedQuestions = self::extractQuestionsFromClientNotes($businessId, $formId);

            return [
                'id' => $formId,
                'name' => $data['name'] ?? 'Formulario ' . $formId,
                'questions' => !empty($data['questions']) ? $data['questions'] : $extractedQuestions
            ];
        });

        return response($response->toArray(), $response->status);
    }
}
