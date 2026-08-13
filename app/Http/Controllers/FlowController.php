<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Client;
use App\Models\DefaultMessage;
use App\Models\Flow;
use App\Models\Integration;
use App\Models\Status;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $flows = Flow::where('business_id', $businessId)
            ->orderBy('updated_at', 'desc')
            ->get();

        return [
            'flows'               => $flows,
            'leadStatuses'        => $leadStatuses,
            'manageStatuses'      => $manageStatuses,
            'chatStatuses'        => $chatStatuses,
            'defaultMessages'     => $allMessages,
            'users'               => $users,
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

                // Si tiene condición de manage_status_id, debe coincidir
                if (!empty($conditions['manage_status_id']) && $conditions['manage_status_id'] != $client->manage_status_id) {
                    continue;
                }

                // Si tiene condición de status_id, debe coincidir
                if (!empty($conditions['status_id']) && $conditions['status_id'] != $client->status_id) {
                    continue;
                }

                Log::info("Disparando flujo '{$flow->name}' por cambio de estado para el lead ID {$client->id}");
                self::executeFlowForClient($flow, $client);
            }
        } catch (\Throwable $th) {
            Log::error("Error al disparar flujos por cambio de estado: " . $th->getMessage());
        }
    }

    public static function executeFlowForClient(Flow $flow, Client $client)
    {
        try {
            $nodes = $flow->tree['nodes'] ?? [];
            $businessJpa = Business::find($client->business_id);
            if (!$businessJpa) return;

            foreach ($nodes as $node) {
                $nodeType = $node['type'] ?? '';
                $nodeData = $node['data'] ?? [];

                if ($nodeType === 'MENSAJE' && !empty($nodeData['content'])) {
                    $rawText = self::cleanHtmlText($nodeData['content']);
                    $clientData = $client->toArray();
                    unset($clientData['form_answers']);
                    $textToSend = Text::replaceData($rawText, $clientData);
                    MetaController::sendWithOrigin($businessJpa, $client, $textToSend, '', 'evoapi');
                } else if ($nodeType === 'ESTADO') {
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
                } else if ($nodeType === 'TRANSFERIR' && !empty($nodeData['assigned_to'])) {
                    if ($nodeData['assigned_to'] !== 'round_robin') {
                        $client->update(['assigned_to' => $nodeData['assigned_to']]);
                    }
                }
            }
        } catch (\Throwable $th) {
            Log::error("Error al ejecutar bloques del flujo '{$flow->name}': " . $th->getMessage());
        }
    }
}
