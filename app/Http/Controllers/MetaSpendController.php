<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class MetaSpendController extends Controller
{
    /**
     * Sincroniza el gasto publicitario desde Meta Ads API para todas las
     * campañas activas del negocio autenticado.
     *
     * Parámetros opcionales (body JSON):
     *   date_from : string YYYY-MM-DD  (default: inicio del mes actual)
     *   date_to   : string YYYY-MM-DD  (default: hoy)
     */
    public function syncSpend(Request $request)
    {
        $response = Response::simpleTryCatch(function ($response) use ($request) {
            $businessId = Auth::user()->business_id;

            $dateFrom = $request->date_from ?? date('Y-m-01');
            $dateTo   = $request->date_to   ?? date('Y-m-d');

            // ── Obtener integración Meta del negocio ─────────────────
            // Filtramos para evitar tomar registros con meta_ad_account_id vacío ("")
            $integration = Integration::where('business_id', $businessId)
                ->whereNotNull('meta_access_token')
                ->whereNotNull('meta_ad_account_id')
                ->where('meta_ad_account_id', '<>', '')
                ->first();

            if (!$integration) {
                throw new \Exception('No se encontró una integración de Meta Ads con Cuenta de Anuncios configurada para este negocio.');
            }

            // Priorizar meta_app_token (token de usuario para campañas) sobre meta_access_token (token de página)
            $accessToken  = $integration->meta_app_token ?: $integration->meta_access_token;
            $adAccountId  = $integration->meta_ad_account_id;
            $graphUrl     = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');

            // Eliminar prefijo "act_" si ya viene incluido
            $adAccountId = ltrim($adAccountId, 'act_');

            // ── Obtener Moneda de la Cuenta Publicitaria ─────────────
            $accountUrl = "{$graphUrl}/act_{$adAccountId}?fields=currency&access_token={$accessToken}";
            $accRes = new Fetch($accountUrl);
            $accBody = $accRes->json();
            $accountCurrency = $accBody['currency'] ?? 'PEN';

            // ── Llamar a Meta Ads API ────────────────────────────────
            $timeRange = json_encode(['since' => $dateFrom, 'until' => $dateTo]);
            // The time_range must be applied directly to the insights edge to filter spend correctly
            $fields    = "id,name,status,insights.time_range({$timeRange}){spend}";
            $url       = "{$graphUrl}/act_{$adAccountId}/campaigns?fields=" . urlencode($fields)
                       . "&limit=200"
                       . "&access_token={$accessToken}";

            $campaignsList = [];
            $nextUrl = $url;
            $pages = 0;

            while ($nextUrl && $pages < 10) {
                $res  = new Fetch($nextUrl);
                $body = $res->json();

                if (isset($body['error'])) {
                    Log::error('Meta Ads API error en syncSpend', ['error' => $body['error']]);
                    
                    $message = $body['error']['message'] ?? 'Error desconocido';
                    $code = $body['error']['code'] ?? 0;
                    
                    if ($code === 100 || str_contains($message, 'Unsupported get request')) {
                        throw new \Exception('El token actual de Meta es de tipo Página. Para sincronizar el gasto automáticamente se requiere un Token de Usuario con permisos publicitarios (ads_read). Por favor, configure el gasto de campañas manualmente en la sección de Campañas.');
                    }
                    
                    throw new \Exception('Error de Meta Ads API: ' . $message);
                }

                if (!empty($body['data'])) {
                    $campaignsList = array_merge($campaignsList, $body['data']);
                }

                $nextUrl = $body['paging']['next'] ?? null;
                $pages++;
            }

            if (empty($campaignsList)) {
                $response->message = 'No se encontraron campañas en Meta para el periodo indicado.';
                $response->data = ['updated' => 0];
                return;
            }

            $updated = 0;
            $notFound = [];

            foreach ($campaignsList as $metaCampaign) {
                // Meta retorna el ID de campaña sin prefijo "c:" a veces; normalizar
                $metaId       = $metaCampaign['id'] ?? null;
                $campaignName = $metaCampaign['name'] ?? '';
                $spend        = (float)($metaCampaign['insights']['data'][0]['spend'] ?? 0);

                if (!$metaId) continue;

                // Buscar la campaña en nuestra base de datos por meta_id o por título
                $campaign = Campaign::where('business_id', $businessId)
                    ->where(function ($q) use ($metaId, $campaignName) {
                        $q->where('meta_id', $metaId)
                          ->orWhere('title', $campaignName);
                    })
                    ->first();

                if ($campaign) {
                    $campaign->spend = $spend;
                    $campaign->currency = $accountCurrency;
                    $campaign->spend_updated_at = now();
                    $campaign->save();
                    $updated++;
                } else {
                    $notFound[] = $campaignName;
                }
            }

            $response->message = "Gasto sincronizado correctamente.";
            $response->data = [
                'updated'  => $updated,
                'total'    => count($campaignsList),
                'notFound' => $notFound,
                'period'   => ['from' => $dateFrom, 'to' => $dateTo],
            ];
        });

        return \response($response->toArray(), $response->status);
    }
}
