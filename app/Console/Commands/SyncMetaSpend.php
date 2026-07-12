<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Integration;
use App\Models\Campaign;
use SoDe\Extend\Fetch;
use Illuminate\Support\Facades\Log;

class SyncMetaSpend extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:meta-spend';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza el gasto publicitario de Meta Ads para todos los negocios activos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando sincronización de gastos de Meta Ads...');
        $graphUrl = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v22.0');
        
        // Sincronizar el gasto del mes actual por defecto
        $dateFrom = date('Y-m-01');
        $dateTo   = date('Y-m-d');

        $integrations = Integration::whereNotNull('meta_ad_account_id')
            ->where('meta_ad_account_id', '<>', '')
            ->get();

        foreach ($integrations as $integration) {
            $businessId = $integration->business_id;
            $accessToken  = $integration->meta_app_token ?: $integration->meta_access_token;
            $adAccountId  = ltrim($integration->meta_ad_account_id, 'act_');

            if (!$accessToken) continue;

            try {
                // Obtener moneda
                $accountUrl = "{$graphUrl}/act_{$adAccountId}?fields=currency&access_token={$accessToken}";
                $accRes = new Fetch($accountUrl);
                $accBody = $accRes->json();
                $accountCurrency = $accBody['currency'] ?? 'PEN';

                // Llamar a Meta Ads API
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
                        Log::error("Meta Ads API error en cron para negocio {$businessId}", ['error' => $body['error']]);
                        // Log and continue to the next business instead of throwing
                        break; 
                    }

                    if (!empty($body['data'])) {
                        $campaignsList = array_merge($campaignsList, $body['data']);
                    }

                    $nextUrl = $body['paging']['next'] ?? null;
                    $pages++;
                }

                foreach ($campaignsList as $metaCampaign) {
                    $metaId       = $metaCampaign['id'] ?? null;
                    $campaignName = $metaCampaign['name'] ?? '';
                    $spend        = (float)($metaCampaign['insights']['data'][0]['spend'] ?? 0);

                    if (!$metaId) continue;

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
                    }
                }
                
                $this->info("Gastos sincronizados para el negocio: {$businessId}");

            } catch (\Exception $e) {
                Log::error("Excepción en cron SyncMetaSpend para negocio {$businessId}: " . $e->getMessage());
            }
        }

        $this->info('Sincronización finalizada.');
    }
}
