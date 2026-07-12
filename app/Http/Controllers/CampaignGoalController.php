<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use SoDe\Extend\Response;

class CampaignGoalController extends Controller
{
    /**
     * Lista las metas configuradas para el negocio del usuario autenticado.
     * Incluye tanto metas globales (sin campaign_id) como metas por campaña.
     */
    public function index(Request $request)
    {
        $response = Response::simpleTryCatch(function ($response) {
            $businessId = Auth::user()->business_id;

            $goals = DB::table('campaign_goals')
                ->where('business_id', $businessId)
                ->orderBy('created_at', 'desc')
                ->get();

            $response->data = $goals;
        });

        return \response($response->toArray(), $response->status);
    }

    /**
     * Crea o actualiza una meta de leads.
     *
     * Body JSON:
     *   campaign_id  : string|null  — null = meta global del negocio
     *   period       : 'monthly' | 'weekly'
     *   target_leads : int          — cantidad de leads objetivo
     *   target_spend : float|null   — gasto objetivo (opcional)
     */
    public function store(Request $request)
    {
        $response = Response::simpleTryCatch(function ($response) use ($request) {
            $businessId = Auth::user()->business_id;

            $campaignId  = $request->campaign_id ?? null;
            $period      = $request->period ?? 'monthly';
            $targetLeads = (int)($request->target_leads ?? 0);
            $targetSpend = $request->target_spend ? (float)$request->target_spend : null;

            if ($targetLeads <= 0) {
                throw new \Exception('El objetivo de leads debe ser mayor a 0.');
            }

            // Buscar si ya existe una meta para esta combinación business + campaign + period
            $existing = DB::table('campaign_goals')
                ->where('business_id', $businessId)
                ->where('period', $period)
                ->where(function ($q) use ($campaignId) {
                    if ($campaignId) {
                        $q->where('campaign_id', $campaignId);
                    } else {
                        $q->whereNull('campaign_id');
                    }
                })
                ->first();

            $now = now();

            if ($existing) {
                DB::table('campaign_goals')
                    ->where('id', $existing->id)
                    ->update([
                        'target_leads' => $targetLeads,
                        'target_spend' => $targetSpend,
                        'updated_at'   => $now,
                    ]);
                $response->message = 'Meta actualizada correctamente.';
                $response->data = ['id' => $existing->id, 'updated' => true];
            } else {
                $id = Str::uuid()->toString();
                DB::table('campaign_goals')->insert([
                    'id'           => $id,
                    'business_id'  => $businessId,
                    'campaign_id'  => $campaignId,
                    'period'       => $period,
                    'target_leads' => $targetLeads,
                    'target_spend' => $targetSpend,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ]);
                $response->message = 'Meta creada correctamente.';
                $response->data = ['id' => $id, 'updated' => false];
            }
        });

        return \response($response->toArray(), $response->status);
    }

    /**
     * Elimina una meta de leads por su ID.
     */
    public function destroy(string $id)
    {
        $response = Response::simpleTryCatch(function ($response) use ($id) {
            $businessId = Auth::user()->business_id;

            $deleted = DB::table('campaign_goals')
                ->where('id', $id)
                ->where('business_id', $businessId)
                ->delete();

            if (!$deleted) {
                throw new \Exception('Meta no encontrada o sin permiso para eliminarla.');
            }

            $response->message = 'Meta eliminada correctamente.';
        });

        return \response($response->toArray(), $response->status);
    }
}
