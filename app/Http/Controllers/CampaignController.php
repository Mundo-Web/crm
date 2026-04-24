<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use Illuminate\Http\Request;

class CampaignController extends BasicController
{
    public $model = Campaign::class;
    public $reactView = 'Campaigns';

    public function setPaginationInstance(Request $request, string $model)
    {
        return $model::where('status', true)->withCount('clients');
    }

    public static function syncAllMetricsForAdAccount($businessId, $adAccountId, $token)
    {
        $url = env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com/v20.0');

        // 1. Fetch ALL Ads Insights con Paginación
        $adsMetrics = [];
        $insightsUrl = "{$url}/{$adAccountId}/insights?level=ad&fields=campaign_id,adset_id,ad_id,spend,impressions,clicks&date_preset=maximum&limit=100&access_token={$token}";
        
        while ($insightsUrl) {
            $restInsights = new \SoDe\Extend\Fetch($insightsUrl);
            $insightsData = $restInsights->json() ?? [];
            if (isset($insightsData['error'])) break;
            
            if (isset($insightsData['data'])) {
                foreach ($insightsData['data'] as $insight) {
                    if (!isset($insight['ad_id'])) continue;
                    $adsMetrics[$insight['ad_id']] = [
                        'spend' => $insight['spend'] ?? 0,
                        'impressions' => $insight['impressions'] ?? 0,
                        'clicks' => $insight['clicks'] ?? 0,
                    ];
                }
            }
            $insightsUrl = $insightsData['paging']['next'] ?? null;
        }

        // 2. Fetch ALL Ads Creatives con Paginación
        $adsCreatives = [];
        $formIdsToFetch = [];
        $creativesUrl = "{$url}/{$adAccountId}/ads?fields=id,creative{image_url,thumbnail_url,body,title,name,object_story_spec,asset_feed_spec}&limit=50&access_token={$token}";
        
        while ($creativesUrl) {
            $restCreatives = new \SoDe\Extend\Fetch($creativesUrl);
            $creativesData = $restCreatives->json() ?? [];
            if (isset($creativesData['error'])) {
                \Illuminate\Support\Facades\Log::error('Meta Creatives API Error', $creativesData['error']);
                break;
            }
            
            if (isset($creativesData['data'])) {
                foreach ($creativesData['data'] as $adItem) {
                    if (!isset($adItem['id']) || !isset($adItem['creative'])) continue;
                    $creative = $adItem['creative'];
                    
                    // Intentar extraer el form_id y el link
                    $formId = null;
                    $link = null;
                    $isWhatsapp = false;

                    $specs = ['video_data', 'link_data', 'photo_data', 'template_data'];
                    foreach ($specs as $spec) {
                        if (isset($creative['object_story_spec'][$spec]['call_to_action']['value'])) {
                            $value = $creative['object_story_spec'][$spec]['call_to_action']['value'];
                            if (isset($value['lead_gen_form_id'])) {
                                $formId = $value['lead_gen_form_id'];
                            }
                            if (isset($value['link'])) {
                                $link = $value['link'];
                            }
                        }
                    }

                    // También puede estar en asset_feed_spec
                    if (isset($creative['asset_feed_spec']['call_to_action_types']) && in_array('WHATSAPP_MESSAGE', $creative['asset_feed_spec']['call_to_action_types'])) {
                        $isWhatsapp = true;
                    }
                    
                    if (str_contains($link ?? '', 'api.whatsapp.com') || str_contains($link ?? '', 'wa.me')) {
                        $isWhatsapp = true;
                    }

                    if ($formId) {
                        $formIdsToFetch[$formId] = $formId;
                    }

                    $adsCreatives[$adItem['id']] = [
                        'preview_image_url' => $creative['image_url'] ?? $creative['thumbnail_url'] ?? null,
                        'body_text' => $creative['body'] ?? $creative['title'] ?? $creative['name'] ?? null,
                        'form_id' => $formId,
                        'is_whatsapp' => $isWhatsapp
                    ];
                }
            }
            $creativesUrl = $creativesData['paging']['next'] ?? null;
        }

        // 3. Fetch Form Names (Opcional, hacemos una petición rápida por cada formulario encontrado)
        // Ya que usualmente son pocos formularios distintos, podemos iterarlos o guardarlos
        $formNames = [];
        foreach ($formIdsToFetch as $formId) {
            $formRes = new \SoDe\Extend\Fetch("{$url}/{$formId}?fields=name&access_token={$token}");
            $formData = $formRes->json() ?? [];
            if (!isset($formData['error']) && isset($formData['name'])) {
                $formNames[$formId] = $formData['name'];
            }
        }

        // 4. Procesar y Guardar en la Base de Datos Local
        // Actualizamos primero los Ads
        $allAds = \App\Models\Ad::where('business_id', $businessId)->get();
        foreach ($allAds as $ad) {
            if (!$ad->meta_id) continue;
            
            $updates = [];
            // Inyectar Métricas
            if (isset($adsMetrics[$ad->meta_id])) {
                $updates['spend'] = $adsMetrics[$ad->meta_id]['spend'];
                // Podríamos agregar impressions y clicks a la tabla ads si las tuviéramos
            }
            
            // Inyectar Creatividades
            if (isset($adsCreatives[$ad->meta_id])) {
                $cr = $adsCreatives[$ad->meta_id];
                $updates['preview_image_url'] = $cr['preview_image_url'];
                $updates['body_text'] = $cr['body_text'];
                
                // Nombre del Formulario o WhatsApp
                if ($cr['is_whatsapp']) {
                    $updates['form_name'] = 'WhatsApp';
                } elseif ($cr['form_id'] && isset($formNames[$cr['form_id']])) {
                    $updates['form_name'] = $formNames[$cr['form_id']];
                }
            }
            
            if (!empty($updates)) {
                $ad->update($updates);
            }
        }

        // Actualizamos AdSets (sumando el spend de sus Ads)
        $allAdSets = \App\Models\AdSet::where('business_id', $businessId)->get();
        foreach ($allAdSets as $adSet) {
            $sumSpend = \App\Models\Ad::where('ad_set_id', $adSet->id)->sum('spend');
            $adSet->update(['spend' => $sumSpend]);
        }

        // Actualizamos Campaigns (sumando el spend de sus AdSets)
        $allCampaigns = \App\Models\Campaign::where('business_id', $businessId)->get();
        foreach ($allCampaigns as $campaign) {
            $sumSpend = \App\Models\AdSet::where('campaign_id', $campaign->id)->sum('spend');
            
            // Las impresiones y clicks sí los sacamos directamente del insight masivo si lo mapeamos,
            // pero como la suma jerárquica ya es exacta, podemos simplemente mapear del array si existe.
            // Extraigamos las impresiones de los ads que pertenecen a esta campaña:
            $campaignAdsMetaIds = \App\Models\Ad::whereIn('ad_set_id', \App\Models\AdSet::where('campaign_id', $campaign->id)->pluck('id'))->pluck('meta_id');
            $sumImpressions = 0;
            $sumClicks = 0;
            
            foreach ($campaignAdsMetaIds as $mId) {
                if (isset($adsMetrics[$mId])) {
                    $sumImpressions += $adsMetrics[$mId]['impressions'];
                    $sumClicks += $adsMetrics[$mId]['clicks'];
                }
            }

            $campaign->update([
                'spend' => $sumSpend,
                'impressions' => $sumImpressions,
                'clicks' => $sumClicks
            ]);
        }

        return true;
    }

    public function syncMetaMetrics(Request $request)
    {
        $response = \SoDe\Extend\Response::simpleTryCatch(function() use ($request) {
            throw new \Exception('Este método ha sido reemplazado por la sincronización masiva a nivel de cuenta publicitaria.');
        });
        return response($response->toArray(), 200);
    }
}
