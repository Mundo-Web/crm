<?php

namespace App\Http\Controllers;

use App\Models\Atalaya\Business;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\DefaultMessage;
use App\Models\Flow;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Status;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Text;

class FlowController extends BasicController
{
    public $model = Flow::class;
    public $reactView = 'Flows';
    public $prefix4filter = 'flows';
    public $softDeletion = false;

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

        // 1. Mensajes predeterminados locales
        $localMessages = DefaultMessage::where('business_id', $businessId)->get();

        $allMessages = [];

        foreach ($localMessages as $m) {
            $rawMessage = $m->description ?? $m->name;
            $allMessages[] = [
                'id'          => $m->id,
                'name'        => $m->name,
                'message'     => self::cleanHtmlText($rawMessage),
                'raw_message' => $rawMessage,
                'type'        => 'local',
                'is_meta'     => false,
            ];
        }

        // 2. Obtener plantillas oficiales de Meta WhatsApp WABA
        try {
            $integration = Integration::where('business_id', $businessId)
                ->where('meta_service', 'whatsapp')
                ->where('status', true)
                ->first();

            if ($integration && !empty($integration->meta_business_id) && !empty($integration->meta_access_token)) {
                $graphUrl = config('services.meta.facebook_graph_url') ?: env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
                $url = "{$graphUrl}/{$integration->meta_business_id}/message_templates?limit=100";
                $res = Http::withToken($integration->meta_access_token)->get($url);

                if ($res->ok()) {
                    $metaData = $res->json()['data'] ?? [];
                    foreach ($metaData as $tpl) {
                        $bodyText = '';
                        foreach ($tpl['components'] ?? [] as $comp) {
                            if (($comp['type'] ?? '') === 'BODY') {
                                $bodyText = $comp['text'] ?? '';
                                break;
                            }
                        }
                        $tplName = $tpl['name'] ?? 'plantilla_meta';
                        $allMessages[] = [
                            'id'            => 'meta_tpl_' . $tplName,
                            'name'          => $tplName,
                            'message'       => $bodyText,
                            'type'          => 'meta_template',
                            'is_meta'       => true,
                            'template_name' => $tplName,
                            'language'      => $tpl['language'] ?? 'es',
                            'status'        => $tpl['status'] ?? 'APPROVED',
                        ];
                    }
                }
            }
        } catch (\Throwable $th) {
            Log::error("Error fetching Meta WhatsApp templates in FlowController: " . $th->getMessage());
        }

        // Obtener solo usuarios activos del negocio (replica exacta de byBusiness(), segura en cualquier contexto)
        $activeAtalayaUserIds = \DB::connection('mysql_main')
            ->table('users')
            ->join('users_by_services_by_businesses', 'users_by_services_by_businesses.user_id', '=', 'users.id')
            ->join('services_by_businesses', 'services_by_businesses.id', '=', 'users_by_services_by_businesses.service_by_business_id')
            ->join('services', 'services.id', '=', 'services_by_businesses.service_id')
            ->where('services.correlative', env('APP_CORRELATIVE'))
            ->where('services_by_businesses.business_id', $businessId)
            ->pluck('users.id')
            ->unique()->filter()->values()->toArray();
        $users = User::where('business_id', $businessId)->whereIn('user_id', $activeAtalayaUserIds)->get();

        $hasFormsIntegration = Integration::where('business_id', $businessId)
            ->where('meta_service', 'forms')
            ->whereNotNull('meta_access_token')
            ->where('status', true)
            ->exists();

        $metaForms = $hasFormsIntegration ? MetaFormRuleController::fetchMetaFormsForBusiness($businessId) : [];

        $campaigns = \App\Models\Campaign::where('business_id', $businessId)->get();
        $campaignIds = $campaigns->pluck('id')->filter()->toArray();
        $metaCampaignIds = $campaigns->pluck('meta_id')->filter()->toArray();
        $allCampIdentifiers = array_unique(array_merge($campaignIds, $metaCampaignIds));

        $adSets = \App\Models\AdSet::where(function ($query) use ($businessId, $allCampIdentifiers) {
            $query->where('business_id', $businessId);
            if (!empty($allCampIdentifiers)) {
                $query->orWhereIn('campaign_id', $allCampIdentifiers);
            }
        })->get();

        $adSetIds = $adSets->pluck('id')->filter()->toArray();
        $metaAdSetIds = $adSets->pluck('meta_id')->filter()->toArray();
        $allAdSetIdentifiers = array_unique(array_merge($adSetIds, $metaAdSetIds));

        $ads = \App\Models\Ad::where(function ($query) use ($businessId, $allAdSetIdentifiers) {
            $query->where('business_id', $businessId);
            if (!empty($allAdSetIdentifiers)) {
                $query->orWhereIn('ad_set_id', $allAdSetIdentifiers);
            }
        })->get();

        $processes = \App\Models\Process::where('business_id', $businessId)->get();
        $noteTypes = \App\Models\NoteType::orderBy('order', 'asc')->get();

        $flows = Flow::where('business_id', $businessId)
            ->orderBy('updated_at', 'desc')
            ->get();

        $roles = \Spatie\Permission\Models\Role::where('business_id', $businessId)->get();

        return [
            'flows'               => $flows,
            'leadStatuses'        => $leadStatuses,
            'manageStatuses'      => $manageStatuses,
            'chatStatuses'        => $chatStatuses,
            'defaultMessages'     => $allMessages,
            'users'               => $users,
            'roles'               => $roles,
            'metaForms'           => $metaForms,
            'hasFormsIntegration' => $hasFormsIntegration,
            'campaigns'           => $campaigns,
            'adSets'              => $adSets,
            'ads'                 => $ads,
            'processes'           => $processes,
            'noteTypes'           => $noteTypes,
        ];
    }

    public function setPaginationInstance(Request $request, string $model)
    {
        $businessId = Auth::user()->business_id;
        return $model::where('business_id', $businessId);
    }

    public function beforeSave(Request $request)
    {
        $data = $request->all();
        if (array_key_exists('status', $data)) {
            $data['status'] = filter_var($data['status'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        }
        return $data;
    }

    public function status(Request $request)
    {
        $response = new \SoDe\Extend\Response();
        try {
            $statusVal = filter_var($request->status, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            Flow::where('id', $request->id)
                ->where('business_id', Auth::user()->business_id)
                ->update([
                    'status' => $statusVal
                ]);

            $response->status = 200;
            $response->message = 'Operación correcta';
            $response->data = ['status' => $statusVal];
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
        return $jpa;
    }

    public static function cleanHtmlText(?string $html): string
    {
        if (empty($html)) return '';
        $text = preg_replace('/<br\s*\/?>/i', "\n", $html);
        $text = preg_replace('/<\/p>/i', "\n", $text);
        $text = preg_replace('/<\/div>/i', "\n", $text);
        $text = strip_tags(html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        return trim(preg_replace("/\n{3,}/", "\n\n", $text));
    }

    public function activeFlows(Request $request)
    {
        $businessId = Auth::user()->business_id;
        $flows = Flow::where('business_id', $businessId)
            ->where('status', true)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'description', 'trigger_type']);

        return response()->json([
            'status' => true,
            'data'   => $flows,
        ]);
    }

    public function executeFlow(Request $request)
    {
        $request->validate([
            'flow_id' => 'required',
            'lead_id' => 'required',
        ]);

        $businessId = Auth::user()->business_id;

        $flow = Flow::where('business_id', $businessId)->find($request->flow_id);
        if (!$flow) {
            return response()->json([
                'status'  => false,
                'message' => 'Flujo no encontrado o inactivo',
            ], 404);
        }

        $lead = Client::where('business_id', $businessId)->find($request->lead_id);
        if (!$lead) {
            return response()->json([
                'status'  => false,
                'message' => 'Lead no encontrado',
            ], 404);
        }

        self::executeGraphForClient($flow, $lead);

        return response()->json([
            'status'  => true,
            'message' => "Flujo '{$flow->name}' ejecutado correctamente para {$lead->contact_name}",
            'data'    => [
                'flow_id'   => $flow->id,
                'flow_name' => $flow->name,
                'lead_id'   => $lead->id,
            ],
        ]);
    }

    public function executeOnMatchingLeads(Request $request)
    {
        $request->validate([
            'flow_id' => 'required',
        ]);

        $businessId = Auth::user()->business_id;
        $flow = Flow::where('business_id', $businessId)->find($request->flow_id);
        if (!$flow) {
            return response()->json([
                'status'  => false,
                'message' => 'Flujo no encontrado',
            ], 404);
        }

        $conditions = $flow->trigger_conditions ?? [];
        if (!is_array($conditions)) {
            $conditions = json_decode($conditions, true) ?? [];
        }

        $query = Client::where('business_id', $businessId);

        if (!empty($conditions['status_id'])) {
            $query->where('status_id', $conditions['status_id']);
        }
        if (!empty($conditions['manage_status_id'])) {
            $query->where('manage_status_id', $conditions['manage_status_id']);
        }
        if (!empty($conditions['meta_form_id'])) {
            $query->where('form_id', $conditions['meta_form_id']);
        }

        $leads = $query->get();
        $executedCount = 0;

        foreach ($leads as $client) {
            $clientOrigin = strtolower($client->origin ?? '');
            $triggeredByLower = strtolower($client->triggered_by ?? '');
            $sourceChannelLower = strtolower($client->source_channel ?? '');

            $isFormLead = !empty($client->form_id)
                || !empty($client->form_name)
                || str_contains($triggeredByLower, 'formulario')
                || str_contains($triggeredByLower, 'form')
                || str_contains($sourceChannelLower, 'form')
                || in_array($clientOrigin, ['forms', 'meta_form', 'meta_lead_ads', 'fb_form', 'ig_form']);

            $isCtwaLead = in_array($clientOrigin, ['ctwa', 'click_to_whatsapp'])
                || str_contains($triggeredByLower, 'ctwa')
                || str_contains($triggeredByLower, 'click to whatsapp');

            $isMessengerLead = in_array($clientOrigin, ['messenger', 'fb_messenger'])
                || str_contains($triggeredByLower, 'messenger');

            $isInstagramDmLead = ($clientOrigin === 'instagram' || str_contains($triggeredByLower, 'instagram')) && !$isFormLead;

            $isWhatsAppDirect = in_array($clientOrigin, ['whatsapp', 'evoapi', 'directo', 'whatsapp api']) && !$isCtwaLead;

            $originMatch = false;
            $type = $flow->trigger_type ?? 'all';
            if ($type === 'all' || $type === 'status_change') {
                $originMatch = true;
            } elseif ($type === 'messenger') {
                $originMatch = $isMessengerLead;
            } elseif ($type === 'instagram_dm') {
                $originMatch = $isInstagramDmLead;
            } elseif ($type === 'click_to_whatsapp') {
                $originMatch = $isCtwaLead;
            } elseif ($type === 'whatsapp') {
                $originMatch = ($isWhatsAppDirect || $isCtwaLead);
            } elseif (in_array($type, ['meta_lead_ads', 'fb_form', 'ig_form'])) {
                $originMatch = $isFormLead;
            }

            if ($originMatch) {
                self::executeGraphForClient($flow, $client);
                $executedCount++;
            }
        }

        return response()->json([
            'status'         => true,
            'message'        => "Flujo '{$flow->name}' ejecutado exitosamente sobre {$executedCount} leads existentes.",
            'executed_count' => $executedCount,
        ]);
    }


    public static function triggerFlowsForIncomingLead(Client $client, ?string $origin = null, ?Message $messageJpa = null)
    {
        try {
            $userMsgText = $messageJpa ? $messageJpa->message : null;
            $cacheKey = "flow_state_{$client->id}";
            $activeState = Cache::get($cacheKey);

            if ($activeState && !empty($activeState['flow_id'])) {
                $flow = Flow::where('business_id', $client->business_id)->find($activeState['flow_id']);
                if ($flow) {
                    $nextTargetId = $activeState['replied_edge_target'] ?? null;

                    // Si el estado era una petición de dato, guardar la respuesta en el campo del lead
                    if (($activeState['waiting_for'] ?? '') === 'peticion_datos' && !empty($activeState['field_key']) && !empty($userMsgText)) {
                        $fieldKey = $activeState['field_key'];
                        $allowedFields = ['contact_name', 'contact_email', 'contact_phone', 'contact_dni', 'contact_address', 'contact_city', 'contact_country', 'notes'];
                        if (in_array($fieldKey, $allowedFields)) {
                            $client->update([$fieldKey => $userMsgText]);
                            $client->refresh();
                            Log::info("PETICION_DATOS: campo '{$fieldKey}' guardado con valor '{$userMsgText}' para lead {$client->id}");
                        }
                    }

                    Cache::forget($cacheKey);

                    if ($nextTargetId) {
                        Log::info("Reanudando flujo '{$flow->name}' para el lead ID {$client->id} tras recibir respuesta.");
                        self::executeGraphForClient($flow, $client, $nextTargetId, $origin, $userMsgText);
                        return true;
                    }
                }
            }


            $flows = Flow::where('business_id', $client->business_id)
                ->where('status', true)
                ->get();

            if ($flows->isEmpty()) return false;

            $matchedFlow = null;

            foreach ($flows as $flow) {
                $type = $flow->trigger_type ?? 'all';
                $conditions = $flow->trigger_conditions ?? [];
                if (!is_array($conditions)) {
                    $conditions = json_decode($conditions, true) ?? [];
                }

                $originLower = strtolower($origin ?? ($client->origin ?? ''));
                $triggeredByLower = strtolower($client->triggered_by ?? '');
                $sourceChannelLower = strtolower($client->source_channel ?? '');

                $isFormLead = !empty($client->form_id)
                    || !empty($client->form_name)
                    || str_contains($triggeredByLower, 'formulario')
                    || str_contains($triggeredByLower, 'form')
                    || str_contains($sourceChannelLower, 'form')
                    || in_array($originLower, ['forms', 'meta_form', 'meta_lead_ads', 'fb_form', 'ig_form']);

                $isCtwaLead = in_array($originLower, ['ctwa', 'click_to_whatsapp'])
                    || str_contains($triggeredByLower, 'ctwa')
                    || str_contains($triggeredByLower, 'click to whatsapp');

                $isMessengerLead = in_array($originLower, ['messenger', 'fb_messenger'])
                    || str_contains($triggeredByLower, 'messenger');

                $isInstagramDmLead = ($originLower === 'instagram' || str_contains($triggeredByLower, 'instagram')) && !$isFormLead;

                $isWhatsAppDirect = in_array($originLower, ['whatsapp', 'evoapi', 'directo', 'whatsapp api']) && !$isCtwaLead;

                $originMatch = false;
                if ($type === 'all' || $type === 'status_change') {
                    $originMatch = true;
                } else if ($type === 'messenger') {
                    $originMatch = $isMessengerLead;
                } else if ($type === 'instagram_dm') {
                    $originMatch = $isInstagramDmLead;
                } else if ($type === 'click_to_whatsapp') {
                    $originMatch = $isCtwaLead;
                } else if ($type === 'whatsapp') {
                    $originMatch = ($isWhatsAppDirect || $isCtwaLead);
                } else if (in_array($type, ['meta_lead_ads', 'fb_form', 'ig_form'])) {
                    $originMatch = $isFormLead;
                }

                if (!$originMatch) continue;

                if (!empty($conditions['manage_status_id']) && $conditions['manage_status_id'] != $client->manage_status_id) {
                    continue;
                }

                if (!empty($conditions['status_id']) && $conditions['status_id'] != $client->status_id) {
                    continue;
                }

                if (!empty($conditions['campaign_id']) && $conditions['campaign_id'] != $client->campaign_id) {
                    continue;
                }

                if (!empty($conditions['meta_form_id']) && !empty($client->form_id) && $conditions['meta_form_id'] != $client->form_id) {
                    continue;
                }

                $matchedFlow = $flow;
                break;
            }

            if ($matchedFlow) {
                Log::info("Iniciando flujo '{$matchedFlow->name}' (ID: {$matchedFlow->id}) para el lead ID {$client->id} en origen '{$origin}'");
                self::executeGraphForClient($matchedFlow, $client, null, $origin, $userMsgText);
                return true;
            }
        } catch (\Throwable $th) {
            Log::error("Error al evaluar flujos entrantes para el lead ID {$client->id}: " . $th->getMessage());
        }

        return false;
    }

    public static function triggerFlowsForStatusChange(Client $client)
    {
        try {
            $clientOrigin = strtolower($client->origin ?? '');
            $triggeredByLower = strtolower($client->triggered_by ?? '');
            $sourceChannelLower = strtolower($client->source_channel ?? '');

            $isFormLead = !empty($client->form_id)
                || !empty($client->form_name)
                || str_contains($triggeredByLower, 'formulario')
                || str_contains($triggeredByLower, 'form')
                || str_contains($sourceChannelLower, 'form')
                || in_array($clientOrigin, ['forms', 'meta_form', 'meta_lead_ads', 'fb_form', 'ig_form']);

            $isCtwaLead = in_array($clientOrigin, ['ctwa', 'click_to_whatsapp'])
                || str_contains($triggeredByLower, 'ctwa')
                || str_contains($triggeredByLower, 'click to whatsapp');

            $isMessengerLead = in_array($clientOrigin, ['messenger', 'fb_messenger'])
                || str_contains($triggeredByLower, 'messenger');

            $isInstagramDmLead = ($clientOrigin === 'instagram' || str_contains($triggeredByLower, 'instagram')) && !$isFormLead;

            $isWhatsAppDirect = in_array($clientOrigin, ['whatsapp', 'evoapi', 'directo', 'whatsapp api']) && !$isCtwaLead;

            $flows = Flow::where('business_id', $client->business_id)
                ->where('status', true)
                ->get();

            foreach ($flows as $flow) {
                $type = $flow->trigger_type ?? 'all';

                $originMatch = false;
                if ($type === 'all' || $type === 'status_change') {
                    $originMatch = true;
                } elseif ($type === 'messenger') {
                    $originMatch = $isMessengerLead;
                } elseif ($type === 'instagram_dm') {
                    $originMatch = $isInstagramDmLead;
                } elseif ($type === 'click_to_whatsapp') {
                    $originMatch = $isCtwaLead;
                } elseif ($type === 'whatsapp') {
                    $originMatch = ($isWhatsAppDirect || $isCtwaLead);
                } elseif (in_array($type, ['meta_lead_ads', 'fb_form', 'ig_form'])) {
                    $originMatch = $isFormLead;
                }

                if (!$originMatch) continue;

                $conditions = $flow->trigger_conditions ?? [];
                if (!is_array($conditions)) {
                    $conditions = json_decode($conditions, true) ?? [];
                }

                if (!empty($conditions['manage_status_id']) && $conditions['manage_status_id'] != $client->manage_status_id) {
                    continue;
                }

                if (!empty($conditions['status_id']) && $conditions['status_id'] != $client->status_id) {
                    continue;
                }

                if (!empty($conditions['meta_form_id']) && !empty($client->form_id) && $conditions['meta_form_id'] != $client->form_id) {
                    continue;
                }

                Log::info("Disparando flujo '{$flow->name}' por cambio de estado para lead ID {$client->id} (origen: {$clientOrigin}, trigger: {$type})");
                self::executeGraphForClient($flow, $client, null, $clientOrigin ?: null, null);
            }
        } catch (\Throwable $th) {
            Log::error("Error al disparar flujos por cambio de estado: " . $th->getMessage());
        }
    }


    public static function executeFlowForClient(Flow $flow, Client $client, ?string $origin = null)
    {
        self::executeGraphForClient($flow, $client, null, $origin, null);
    }

    public static function executeGraphForClient(Flow $flow, Client $client, ?string $startNodeId = null, ?string $origin = null, ?string $userResponseText = null)
    {
        try {
            $tree = $flow->tree ?? [];
            $nodes = $tree['nodes'] ?? [];
            $edges = $tree['edges'] ?? [];

            if (empty($nodes)) return;

            $businessJpa = Business::find($client->business_id);
            if (!$businessJpa) return;

            $effectiveOrigin = $origin ?? ($client->origin === 'WhatsApp' ? 'evoapi' : strtolower($client->origin ?? 'messenger'));

            if (!$startNodeId) {
                $triggerNode = null;
                foreach ($nodes as $n) {
                    if (($n['type'] ?? '') === 'TRIGGER') {
                        $triggerNode = $n;
                        break;
                    }
                }
                $currentNodeId = $triggerNode ? $triggerNode['id'] : ($nodes[0]['id'] ?? null);
            } else {
                $currentNodeId = $startNodeId;
            }

            $visitedCount = 0;
            $maxSteps = 30;

            while ($currentNodeId && $visitedCount < $maxSteps) {
                $visitedCount++;

                $currentNode = null;
                foreach ($nodes as $n) {
                    if (strval($n['id']) === strval($currentNodeId)) {
                        $currentNode = $n;
                        break;
                    }
                }

                if (!$currentNode) break;

                $nodeType = $currentNode['type'] ?? '';
                $nodeData = $currentNode['data'] ?? [];

                $outgoingEdges = array_values(array_filter($edges, function ($e) use ($currentNodeId, $nodes) {
                    if (strval($e['source'] ?? '') !== strval($currentNodeId)) return false;
                    $targetId = $e['target'] ?? '';
                    foreach ($nodes as $n) {
                        if (strval($n['id']) === strval($targetId)) return true;
                    }
                    return false;
                }));

                if ($nodeType === 'TRIGGER') {
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
                    continue;
                }

                if ($nodeType === 'MENSAJE') {
                    $isMetaTemplate = !empty($nodeData['is_meta_template']);
                    $templateName = $nodeData['template_name'] ?? null;
                    if (!$templateName && !empty($nodeData['default_message_id']) && str_starts_with($nodeData['default_message_id'], 'meta_tpl_')) {
                        $templateName = str_replace('meta_tpl_', '', $nodeData['default_message_id']);
                        $isMetaTemplate = true;
                    }

                    if ($isMetaTemplate && !empty($templateName)) {
                        self::sendMetaWhatsAppTemplate($client, $templateName, 'es', [], $nodeData['content'] ?? null);
                    } else if (!empty($nodeData['content'])) {
                        $rawText = self::cleanHtmlText($nodeData['content']);
                        $clientData = $client->toArray();
                        unset($clientData['form_answers']);
                        $textToSend = Text::replaceData($rawText, $clientData);
                        MetaController::sendWithOrigin($businessJpa, $client, $textToSend, '', $effectiveOrigin);
                    }
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
                    continue;
                }

                if ($nodeType === 'PETICION_DATOS') {
                    $fieldKey     = $nodeData['field_key']     ?? 'contact_name';
                    $promptMsg    = $nodeData['question_text'] ?? ($nodeData['prompt_message'] ?? ($nodeData['prompt'] ?? ($nodeData['content'] ?? null)));
                    // El frontend guarda 'skip_if_exists'. Default: false (no omitir) para que
                    // siempre pregunte salvo que el usuario active el toggle explícitamente.
                    $skipIfFilled = $nodeData['skip_if_exists'] ?? false;

                    // Si el campo ya está lleno y se configuró para omitir, saltar al siguiente nodo
                    $currentValue = $client->{$fieldKey} ?? null;
                    if ($skipIfFilled && !empty($currentValue)) {
                        Log::info("PETICION_DATOS: campo '{$fieldKey}' ya tiene valor '{$currentValue}' para lead {$client->id}. Saltando.");
                        $nextEdge = $outgoingEdges[0] ?? null;
                        $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
                        continue;
                    }

                    // Enviar la pregunta al lead si hay un mensaje configurado
                    if (!empty($promptMsg)) {
                        $rawText = self::cleanHtmlText($promptMsg);
                        $clientData = $client->toArray();
                        unset($clientData['form_answers']);
                        $textToSend = Text::replaceData($rawText, $clientData);
                        MetaController::sendWithOrigin($businessJpa, $client, $textToSend, '', $effectiveOrigin);
                    }

                    // Pausar el flujo esperando la respuesta del cliente
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $targetNodeId = $nextEdge ? $nextEdge['target'] : null;

                    // Mirar hacia adelante: si el siguiente nodo es un TEMPORIZADOR,
                    // lanzar su timer AHORA para que "Expiró" se dispare si el usuario no responde.
                    $timerDurationSec = null;
                    $timerTimeoutTarget = null;
                    $timerNodeId = null;
                    if ($targetNodeId) {
                        $nextNode = null;
                        foreach ($nodes as $n) {
                            if (strval($n['id']) === strval($targetNodeId)) {
                                $nextNode = $n;
                                break;
                            }
                        }
                        if ($nextNode && in_array($nextNode['type'] ?? '', ['TEMPORIZADOR', 'TIMER'])) {
                            $tData = $nextNode['data'] ?? [];
                            $tVal  = floatval($tData['timeout_value'] ?? 1);
                            $tUnit = strtolower($tData['timeout_unit'] ?? 'minutos');
                            $timerDurationSec = intval($tVal * 60);
                            if ($tUnit === 'segundos' || $tUnit === 'segundo') $timerDurationSec = intval($tVal);
                            elseif ($tUnit === 'horas' || $tUnit === 'hora') $timerDurationSec = intval($tVal * 3600);
                            elseif (in_array($tUnit, ['dias', 'día', 'días', 'day', 'days'])) $timerDurationSec = intval($tVal * 86400);

                            // Buscar la arista "Expiró" del temporizador
                            $timerNodeId = $nextNode['id'];
                            $timerOutEdges = array_values(array_filter($edges, fn($e) => strval($e['source'] ?? '') === strval($timerNodeId)));
                            foreach ($timerOutEdges as $te) {
                                $tHandle = strtolower($te['sourceHandle'] ?? '');
                                $tLabel  = strtolower($te['label'] ?? '');
                                if (str_contains($tHandle, 'timeout') || str_contains($tHandle, 'expir') || str_contains($tLabel, 'expir')) {
                                    $timerTimeoutTarget = $te['target'];
                                }
                            }
                            // Si no encontró la arista "Expiró", usar la segunda arista
                            if (!$timerTimeoutTarget && count($timerOutEdges) > 1) {
                                $timerTimeoutTarget = $timerOutEdges[1]['target'];
                            }

                            // También guardar la arista "Respondió" para cuando el usuario sí responda
                            $timerRepliedTarget = null;
                            foreach ($timerOutEdges as $te) {
                                $tHandle = strtolower($te['sourceHandle'] ?? '');
                                $tLabel  = strtolower($te['label'] ?? '');
                                if (str_contains($tHandle, 'replied') || str_contains($tHandle, 'respon') || str_contains($tLabel, 'respon')) {
                                    $timerRepliedTarget = $te['target'];
                                }
                            }
                            if (!$timerRepliedTarget) $timerRepliedTarget = $timerOutEdges[0]['target'] ?? null;

                            // Reemplazar el target del nodo siguiente: cuando el usuario responda,
                            // saltamos el TEMPORIZADOR y vamos directo a "Respondió"
                            $targetNodeId = $timerRepliedTarget ?? $targetNodeId;
                        }
                    }

                    // IMPORTANTE: si hay un TEMPORIZADOR siguiente, el node_id en cache
                    // debe ser el del TEMPORIZADOR (no el de PETICION_DATOS) para que
                    // FlowTimeoutCommand pueda hacer match correctamente.
                    $cacheNodeId = ($timerNodeId !== null) ? $timerNodeId : $currentNode['id'];
                    $cacheTtl    = ($timerDurationSec !== null)
                        ? now()->addSeconds($timerDurationSec + 300)
                        : now()->addDays(1);

                    Cache::put("flow_state_{$client->id}", [
                        'flow_id'             => $flow->id,
                        'node_id'             => $cacheNodeId,       // ID del TEMPORIZADOR para que el timer haga match
                        'waiting_for'         => 'peticion_datos',   // tipo de espera para el handler de respuesta
                        'field_key'           => $fieldKey,
                        'replied_edge_target' => $targetNodeId,      // rama "Respondió" del timer
                        'timeout_edge_target' => $timerTimeoutTarget, // rama "Expiró" del timer
                        'origin'              => $effectiveOrigin,
                    ], $cacheTtl);

                    // Si el siguiente nodo era un TEMPORIZADOR, lanzar su timer para que "Expiró" se dispare
                    if ($timerDurationSec !== null && $timerNodeId !== null) {
                        self::dispatchBackgroundTimer($flow, $client, $timerNodeId, $timerTimeoutTarget, $effectiveOrigin, $timerDurationSec);
                        Log::info("PETICION_DATOS: timer lanzado ({$timerDurationSec}s), node_id cache={$timerNodeId}, 'Expiró'→{$timerTimeoutTarget} para lead {$client->id}");
                    }

                    Log::info("Flujo en PAUSA (PETICION_DATOS campo='{$fieldKey}') para el lead ID {$client->id}");
                    break;
                }

                if ($nodeType === 'ESTADO') {
                    $updates = [];
                    if (!empty($nodeData['manage_status_id'])) {
                        $updates['manage_status_id'] = $nodeData['manage_status_id'];
                    }
                    if (!empty($nodeData['status_id'])) {
                        $updates['status_id'] = $nodeData['status_id'];
                    }
                    if (!empty($updates)) {
                        $client->update($updates);
                    }
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
                    continue;
                }

                if ($nodeType === 'TRANSFERIR') {
                    $assignmentMode = $nodeData['assignment_mode'] ?? (!empty($nodeData['assigned_to']) && $nodeData['assigned_to'] !== 'round_robin' ? 'specific' : 'automatic_load');

                    if ($assignmentMode === 'specific' && !empty($nodeData['assigned_to']) && $nodeData['assigned_to'] !== 'round_robin') {
                        $client->update(['assigned_to' => $nodeData['assigned_to']]);
                    } else {
                        // Rotación Automática por Carga de Trabajo
                        $roleIds = $nodeData['role_ids'] ?? [];
                        if (!is_array($roleIds)) {
                            $roleIds = !empty($roleIds) ? [$roleIds] : [];
                        }

                        $statusIds = $nodeData['status_ids'] ?? [];
                        if (!is_array($statusIds)) {
                            $statusIds = !empty($statusIds) ? [$statusIds] : [];
                        }

                        $manageStatusIds = $nodeData['manage_status_ids'] ?? [];
                        if (!is_array($manageStatusIds)) {
                            $manageStatusIds = !empty($manageStatusIds) ? [$manageStatusIds] : [];
                        }

                        // Obtener IDs de roles si se pasaron nombres o IDs
                        $actualRoleIds = \Spatie\Permission\Models\Role::where(function ($q) use ($roleIds) {
                            $q->whereIn('id', $roleIds)->orWhereIn('name', $roleIds);
                        })->pluck('id')->toArray();

                        $roleNamesBuscados = \Spatie\Permission\Models\Role::whereIn('id', !empty($actualRoleIds) ? $actualRoleIds : $roleIds)
                            ->pluck('name')
                            ->toArray();

                        // Buscar usuarios asociados a esos roles en model_has_roles para este negocio
                        $userIdsWithRole = \App\Models\ModelHasRoles::where('business_id', $client->business_id)
                            ->whereIn('role_id', !empty($actualRoleIds) ? $actualRoleIds : $roleIds)
                            ->pluck('model_id')
                            ->toArray();

                        // Obtener solo IDs activos del negocio (replica exacta de byBusiness(), segura en background jobs)
                        $activeAtalayaIdsForTransfer = \DB::connection('mysql_main')
                            ->table('users')
                            ->join('users_by_services_by_businesses', 'users_by_services_by_businesses.user_id', '=', 'users.id')
                            ->join('services_by_businesses', 'services_by_businesses.id', '=', 'users_by_services_by_businesses.service_by_business_id')
                            ->join('services', 'services.id', '=', 'services_by_businesses.service_id')
                            ->where('services.correlative', env('APP_CORRELATIVE'))
                            ->where('services_by_businesses.business_id', $client->business_id)
                            ->pluck('users.id')
                            ->unique()->filter()->values()->toArray();

                        $candidateQuery = User::where('business_id', $client->business_id)
                            ->whereIn('user_id', $activeAtalayaIdsForTransfer);

                        if (!empty($roleIds)) {
                            $candidateQuery->where(function ($q) use ($roleIds, $roleNamesBuscados, $userIdsWithRole) {
                                $q->whereIn('id', $userIdsWithRole);
                                if (!empty($roleNamesBuscados)) {
                                    $q->orWhereHas('roles', function ($rq) use ($roleNamesBuscados) {
                                        $rq->whereIn('roles.name', $roleNamesBuscados);
                                    });
                                }
                            });
                        }

                        $candidateUsers = $candidateQuery->get();

                        if ($candidateUsers->isEmpty()) {
                            if (empty($roleIds)) {
                                $candidateUsers = User::where('business_id', $client->business_id)->get();
                            } else {
                                Log::warning("Nodo TRANSFERIR: No se encontraron usuarios para el negocio ID {$client->business_id} con los roles marcados (" . implode(', ', $roleIds) . ").");
                            }
                        }

                        // Si hay varios candidatos y existen asesores comerciales regulares, excluir al Owner (Julio)
                        if ($candidateUsers->count() > 1) {
                            $regularAdvisors = $candidateUsers->filter(function ($u) {
                                $email = strtolower($u->email);
                                return !str_contains($email, 'julio@mundoweb') && !str_contains($email, 'admin');
                            });
                            if ($regularAdvisors->isNotEmpty()) {
                                $candidateUsers = $regularAdvisors;
                            }
                        }

                        if ($candidateUsers->isNotEmpty()) {
                            $userLoads = [];
                            foreach ($candidateUsers as $u) {
                                $cq = Client::where('assigned_to', $u->id);
                                if (!empty($statusIds) || !empty($manageStatusIds)) {
                                    $cq->where(function ($subQ) use ($statusIds, $manageStatusIds) {
                                        if (!empty($statusIds)) {
                                            $subQ->whereIn('status_id', $statusIds);
                                        }
                                        if (!empty($manageStatusIds)) {
                                            if (!empty($statusIds)) {
                                                $subQ->orWhereIn('manage_status_id', $manageStatusIds);
                                            } else {
                                                $subQ->whereIn('manage_status_id', $manageStatusIds);
                                            }
                                        }
                                    });
                                }
                                $count = $cq->count();
                                $userLoads[] = [
                                    'user' => $u,
                                    'count' => $count,
                                ];
                            }

                            usort($userLoads, function ($a, $b) {
                                return $a['count'] <=> $b['count'];
                            });

                            $minCount = $userLoads[0]['count'];
                            $minUsers = array_filter($userLoads, function ($ul) use ($minCount) {
                                return $ul['count'] === $minCount;
                            });
                            $minUsers = array_values($minUsers);

                            $chosenUser = $minUsers[array_rand($minUsers)]['user'];
                            $client->update(['assigned_to' => $chosenUser->id]);
                            Log::info("Lead ID {$client->id} asignado exitosamente al usuario '{$chosenUser->fullname}' (ID {$chosenUser->id}) por carga de trabajo. Carga actual en estados seleccionados: {$minCount}");
                        }
                    }
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
                    continue;
                }

                if ($nodeType === 'CREAR_TAREA') {
                    if (!empty($nodeData['process_id'])) {
                        Task::create([
                            'model_id' => ClientNote::class,
                            'name' => $nodeData['title'] ?? 'Tarea de Flujo',
                            'description' => $nodeData['description'] ?? 'Generado automáticamente por el flujo',
                            'process_id' => $nodeData['process_id'],
                            'user_id' => $client->assigned_to,
                            'business_id' => $client->business_id,
                        ]);
                    }
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
                    continue;
                }

                if ($nodeType === 'DECISION') {
                    $ruleType = $nodeData['rule_type'] ?? 'keyword';
                    $expectedVal = strtolower($nodeData['expected_value'] ?? '');
                    $decisionResult = false;

                    if ($ruleType === 'keyword') {
                        $evalText = strtolower($userResponseText ?? $client->last_message ?? '');
                        $decisionResult = !empty($expectedVal) && str_contains($evalText, $expectedVal);
                    } else if ($ruleType === 'lead_status') {
                        $decisionResult = ($client->status_id == $nodeData['expected_value']);
                    } else if ($ruleType === 'manage_status') {
                        $decisionResult = ($client->manage_status_id == $nodeData['expected_value']);
                    } else if ($ruleType === 'business_hours') {
                        $decisionResult = true;
                    } else {
                        $decisionResult = true;
                    }

                    $yesEdge = null;
                    $noEdge = null;
                    foreach ($outgoingEdges as $e) {
                        $handle = strtolower($e['sourceHandle'] ?? '');
                        $label = strtolower($e['label'] ?? '');
                        if ($handle === 'yes' || str_contains($label, 'sí') || str_contains($label, 'si')) {
                            $yesEdge = $e;
                        } else if ($handle === 'no' || str_contains($label, 'no')) {
                            $noEdge = $e;
                        }
                    }
                    if (!$yesEdge) $yesEdge = $outgoingEdges[0] ?? null;
                    if (!$noEdge) $noEdge = $outgoingEdges[1] ?? $outgoingEdges[0] ?? null;

                    $targetEdge = $decisionResult ? $yesEdge : $noEdge;
                    $currentNodeId = $targetEdge ? $targetEdge['target'] : null;
                    continue;
                }

                if ($nodeType === 'ESPERAR_RESPUESTA') {
                    $nextEdge = $outgoingEdges[0] ?? null;
                    $targetNodeId = $nextEdge ? $nextEdge['target'] : null;

                    // Mirar hacia adelante: si el nodo siguiente es TEMPORIZADOR,
                    // aplicar la misma lógica: lanzar timer y guardar el ID correcto en cache.
                    $erTimerNodeId      = null;
                    $erTimerDurationSec = null;
                    $erTimerTimeout     = null;
                    $erRepliedTarget    = $targetNodeId;

                    if ($targetNodeId) {
                        $nextNode = null;
                        foreach ($nodes as $n) {
                            if (strval($n['id']) === strval($targetNodeId)) { $nextNode = $n; break; }
                        }
                        if ($nextNode && in_array($nextNode['type'] ?? '', ['TEMPORIZADOR', 'TIMER'])) {
                            $erTimerNodeId = $nextNode['id'];
                            $tData = $nextNode['data'] ?? [];
                            $tVal  = floatval($tData['timeout_value'] ?? 1);
                            $tUnit = strtolower($tData['timeout_unit'] ?? 'minutos');
                            $erTimerDurationSec = intval($tVal * 60);
                            if ($tUnit === 'segundos' || $tUnit === 'segundo') $erTimerDurationSec = intval($tVal);
                            elseif ($tUnit === 'horas' || $tUnit === 'hora') $erTimerDurationSec = intval($tVal * 3600);
                            elseif (in_array($tUnit, ['dias', 'día', 'días', 'day', 'days'])) $erTimerDurationSec = intval($tVal * 86400);

                            $timerOutEdges = array_values(array_filter($edges, fn($e) => strval($e['source'] ?? '') === strval($erTimerNodeId)));
                            foreach ($timerOutEdges as $te) {
                                $tH = strtolower($te['sourceHandle'] ?? '');
                                $tL = strtolower($te['label'] ?? '');
                                if (str_contains($tH, 'timeout') || str_contains($tH, 'expir') || str_contains($tL, 'expir')) {
                                    $erTimerTimeout = $te['target'];
                                }
                            }
                            if (!$erTimerTimeout && count($timerOutEdges) > 1) $erTimerTimeout = $timerOutEdges[1]['target'];

                            // rama "Respondió" del timer
                            $erRepliedTarget = null;
                            foreach ($timerOutEdges as $te) {
                                $tH = strtolower($te['sourceHandle'] ?? '');
                                $tL = strtolower($te['label'] ?? '');
                                if (str_contains($tH, 'replied') || str_contains($tH, 'respon') || str_contains($tL, 'respon')) {
                                    $erRepliedTarget = $te['target'];
                                }
                            }
                            if (!$erRepliedTarget) $erRepliedTarget = $timerOutEdges[0]['target'] ?? null;
                        }
                    }

                    $erCacheNodeId = $erTimerNodeId ?? $currentNode['id'];
                    $erCacheTtl    = $erTimerDurationSec ? now()->addSeconds($erTimerDurationSec + 300) : now()->addDays(1);

                    Cache::put("flow_state_{$client->id}", [
                        'flow_id'             => $flow->id,
                        'node_id'             => $erCacheNodeId,
                        'waiting_for'         => 'response',
                        'replied_edge_target' => $erRepliedTarget,
                        'timeout_edge_target' => $erTimerTimeout,
                        'origin'              => $effectiveOrigin,
                    ], $erCacheTtl);

                    if ($erTimerNodeId && $erTimerDurationSec) {
                        self::dispatchBackgroundTimer($flow, $client, $erTimerNodeId, $erTimerTimeout, $effectiveOrigin, $erTimerDurationSec);
                        Log::info("ESPERAR_RESPUESTA: timer lanzado ({$erTimerDurationSec}s), node_id cache={$erTimerNodeId} para lead {$client->id}");
                    }

                    Log::info("Flujo en PAUSA (ESPERAR RESPUESTA) para el lead ID {$client->id}");
                    break;
                }

                if ($nodeType === 'TEMPORIZADOR' || $nodeType === 'TIMER') {
                    $val = floatval($nodeData['timeout_value'] ?? 1);
                    $unit = strtolower($nodeData['timeout_unit'] ?? 'minutos');

                    $durationSec = intval($val * 60);
                    if ($unit === 'segundos' || $unit === 'segundo') $durationSec = intval($val);
                    else if ($unit === 'horas' || $unit === 'hora') $durationSec = intval($val * 3600);
                    else if (in_array($unit, ['dias', 'día', 'días', 'day', 'days'])) $durationSec = intval($val * 86400);

                    $repliedEdge = null;
                    $timeoutEdge = null;

                    foreach ($outgoingEdges as $e) {
                        $handle = strtolower($e['sourceHandle'] ?? '');
                        $label = strtolower($e['label'] ?? '');
                        if (str_contains($handle, 'replied') || str_contains($handle, 'respon') || str_contains($label, 'respon')) {
                            $repliedEdge = $e;
                        } else if (str_contains($handle, 'timeout') || str_contains($handle, 'expir') || str_contains($label, 'expir')) {
                            $timeoutEdge = $e;
                        }
                    }
                    if (!$repliedEdge) $repliedEdge = $outgoingEdges[0] ?? null;
                    if (!$timeoutEdge) $timeoutEdge = count($outgoingEdges) > 1 ? $outgoingEdges[1] : ($outgoingEdges[0] ?? null);

                    $repliedTarget = $repliedEdge ? $repliedEdge['target'] : null;
                    $timeoutTarget = $timeoutEdge ? $timeoutEdge['target'] : null;

                    // Si ya hay una respuesta del usuario en este contexto de ejecución
                    // (ej: el usuario acaba de responder a un PETICION_DATOS), tomar la
                    // rama "Respondió" inmediatamente sin iniciar el temporizador.
                    if (!empty($userResponseText) && $repliedTarget) {
                        Log::info("TEMPORIZADOR: usuario ya respondió en este contexto, tomando rama 'Respondió' para lead {$client->id}");
                        $currentNodeId = $repliedTarget;
                        continue;
                    }

                    Cache::put("flow_state_{$client->id}", [
                        'flow_id' => $flow->id,
                        'node_id' => $currentNode['id'],
                        'waiting_for' => 'timer_or_response',
                        'replied_edge_target' => $repliedTarget,
                        'timeout_edge_target' => $timeoutTarget,
                        'origin' => $effectiveOrigin,
                    ], now()->addSeconds($durationSec + 300));

                    self::dispatchBackgroundTimer($flow, $client, $currentNode['id'], $timeoutTarget, $effectiveOrigin, $durationSec);

                    Log::info("Flujo en PAUSA TEMPORIZADOR ({$val} {$unit} / {$durationSec}s) para el lead ID {$client->id}");
                    break;
                }


                $nextEdge = $outgoingEdges[0] ?? null;
                $currentNodeId = $nextEdge ? $nextEdge['target'] : null;
            }
        } catch (\Throwable $th) {
            Log::error("Error en executeGraphForClient en flujo '{$flow->name}': " . $th->getMessage());
        }
    }

    public static function dispatchBackgroundTimer(Flow $flow, Client $client, string $nodeId, ?string $timeoutTarget, ?string $origin, int $durationSec)
    {
        if (config('queue.default') === 'sync' || env('QUEUE_CONNECTION') === 'sync') {
            $artisan = base_path('artisan');
            $flowId = escapeshellarg($flow->id);
            $clientId = escapeshellarg($client->id);
            $escapedNodeId = escapeshellarg($nodeId);
            $targetId = escapeshellarg($timeoutTarget ?? '');
            $originArg = escapeshellarg($origin ?? '');

            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $cmd = "start /B cmd /c \"timeout /t {$durationSec} > nul && php {$artisan} flow:timeout {$flowId} {$clientId} {$escapedNodeId} {$targetId} {$originArg}\"";
                pclose(popen($cmd, "r"));
            } else {
                $cmd = "nohup sh -c \"sleep {$durationSec} && php {$artisan} flow:timeout {$flowId} {$clientId} {$escapedNodeId} {$targetId} {$originArg}\" > /dev/null 2>&1 &";
                shell_exec($cmd);
            }
            Log::info("Disparador en segundo plano OS programado para el flujo en {$durationSec} segundos.");
        } else {
            \App\Jobs\FlowTimerJob::dispatch($flow->id, $client->id, $nodeId, $timeoutTarget, $origin)
                ->delay(now()->addSeconds($durationSec));
        }
    }

    public static function sendMetaWhatsAppTemplate(Client $client, string $templateName, string $language = 'es', array $parameters = [], ?string $fallbackText = null): bool
    {
        try {
            $number = $client->contact_phone;
            if (!$number) {
                Log::warning("sendMetaWhatsAppTemplate: cliente ID {$client->id} no tiene teléfono registrado.");
                return false;
            }

            $number = preg_replace('/[^0-9]/', '', $number);
            if (strlen($number) === 9 && strpos($number, '9') === 0) {
                $number = '51' . $number;
            }

            $integration = ($client->integration && $client->integration->meta_service === 'whatsapp' && $client->integration->status)
                ? $client->integration
                : Integration::where('business_id', $client->business_id)
                    ->where('meta_service', 'whatsapp')
                    ->where('status', true)
                    ->first();

            if (!$integration || empty($integration->meta_access_token) || empty($integration->meta_number_id)) {
                Log::error("sendMetaWhatsAppTemplate: no se encontró integración activa de WhatsApp Meta para business_id {$client->business_id}");
                return false;
            }

            $url = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0') . '/' . $integration->meta_number_id . '/messages';

            $templatePayload = [
                'name' => $templateName,
                'language' => [
                    'code' => $language ?: 'es'
                ]
            ];

            if (!empty($parameters)) {
                $compParams = [];
                foreach ($parameters as $p) {
                    $compParams[] = ['type' => 'text', 'text' => $p];
                }
                $templatePayload['components'] = [
                    [
                        'type' => 'body',
                        'parameters' => $compParams
                    ]
                ];
            }

            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type'    => 'individual',
                'to'                => $number,
                'type'              => 'template',
                'template'          => $templatePayload
            ];

            Log::info("sendMetaWhatsAppTemplate: Enviando plantilla '{$templateName}' a {$number} (lead {$client->id})", ['url' => $url]);

            $res = Http::withToken($integration->meta_access_token)->post($url, $payload);

            if (!$res->ok()) {
                Log::error("sendMetaWhatsAppTemplate: Error al enviar plantilla '{$templateName}' a {$number}: " . $res->body());
                return false;
            }

            $resData = $res->json();
            $messageId = $resData['messages'][0]['id'] ?? null;

            $dbMessage = $fallbackText ? self::cleanHtmlText($fallbackText) : "[Plantilla Meta: {$templateName}]";

            Message::create([
                'wa_id'       => $number,
                'role'        => 'AI',
                'message'     => Text::html2wa($dbMessage),
                'prompt'      => "Flujo Plantilla Meta: {$templateName}",
                'microtime'   => (int) (microtime(true) * 1_000_000),
                'business_id' => $client->business_id,
                'message_id'  => $messageId,
                'seen'        => true,
            ]);

            Log::info("sendMetaWhatsAppTemplate: Plantilla '{$templateName}' enviada exitosamente a {$number} para lead {$client->id}");
            return true;
        } catch (\Throwable $th) {
            Log::error("sendMetaWhatsAppTemplate exception: " . $th->getMessage());
            return false;
        }
    }
}

