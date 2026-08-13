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

        $users = User::where('business_id', $businessId)->get();

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

        $roles = \Spatie\Permission\Models\Role::all();

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

        $lead = \App\Models\Lead::where('business_id', $businessId)->find($request->lead_id);
        if (!$lead) {
            return response()->json([
                'status'  => false,
                'message' => 'Lead no encontrado',
            ], 404);
        }

        $nodes = $flow->tree['nodes'] ?? [];
        $executed = [];

        foreach ($nodes as $node) {
            if (($node['type'] ?? '') === 'MENSAJE' && !empty($node['data']['content'])) {
                $executed[] = [
                    'type' => 'MENSAJE',
                    'title' => $node['data']['title'] ?? 'Mensaje de Flujo',
                    'content' => self::cleanHtmlText($node['data']['content']),
                ];
                break;
            }
        }

        return response()->json([
            'status'  => true,
            'message' => "Flujo '{$flow->name}' asignado e iniciado correctamente a {$lead->contact_name}",
            'data'    => [
                'flow_id'   => $flow->id,
                'flow_name' => $flow->name,
                'lead_id'   => $lead->id,
                'executed'  => $executed,
            ],
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

                $originMatch = false;
                if ($type === 'all') {
                    $originMatch = true;
                } else if ($type === 'messenger' && in_array($origin, ['messenger', 'fb_messenger'])) {
                    $originMatch = true;
                } else if ($type === 'instagram_dm' && in_array($origin, ['instagram', 'ig_dm'])) {
                    $originMatch = true;
                } else if (in_array($type, ['whatsapp', 'click_to_whatsapp']) && in_array($origin, ['whatsapp', 'evoapi', 'ctwa'])) {
                    $originMatch = true;
                } else if (in_array($type, ['meta_lead_ads', 'fb_form', 'ig_form']) && in_array($origin, ['forms', 'meta_form'])) {
                    $originMatch = true;
                } else if ($type === 'status_change') {
                    $originMatch = true;
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
            $flows = Flow::where('business_id', $client->business_id)
                ->where('status', true)
                ->whereIn('trigger_type', ['all', 'status_change'])
                ->get();

            foreach ($flows as $flow) {
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

                Log::info("Disparando flujo '{$flow->name}' por cambio de estado para el lead ID {$client->id}");
                self::executeGraphForClient($flow, $client, null, null, null);
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
                    if (!empty($nodeData['content'])) {
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

                        $candidateQuery = User::where('business_id', $client->business_id);
                        if (!empty($roleIds)) {
                            $candidateQuery->whereHas('roles', function ($q) use ($roleIds) {
                                $q->whereIn('roles.id', $roleIds)->orWhereIn('roles.name', $roleIds);
                            });
                        }

                        $candidateUsers = $candidateQuery->get();
                        if ($candidateUsers->isEmpty()) {
                            $candidateUsers = User::where('business_id', $client->business_id)->get();
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
                            Log::info("Lead ID {$client->id} asignado a usuario ID {$chosenUser->id} por carga de trabajo (Carga actual en estados seleccionados: {$minCount})");
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

                    $targetNode = null;
                    if ($targetNodeId) {
                        foreach ($nodes as $n) {
                            if (strval($n['id']) === strval($targetNodeId)) {
                                $targetNode = $n;
                                break;
                            }
                        }
                    }

                    if ($targetNode && ($targetNode['type'] ?? '') === 'TEMPORIZADOR') {
                        $currentNodeId = $targetNode['id'];
                        continue;
                    }

                    Cache::put("flow_state_{$client->id}", [
                        'flow_id' => $flow->id,
                        'node_id' => $currentNode['id'],
                        'waiting_for' => 'response',
                        'replied_edge_target' => $targetNodeId,
                        'origin' => $effectiveOrigin,
                    ], now()->addDays(1));

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
}
