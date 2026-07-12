import { Fetch } from "sode-extend-react"
import axios from "axios"

class KPICampaignsRest {
  /**
   * Obtiene los KPIs del dashboard de campañas.
   * Acepta un objeto de filtros con:
   *   - date_from : string YYYY-MM-DD
   *   - date_to   : string YYYY-MM-DD
   *   - platform  : 'all' | 'fb' | 'ig' | 'wa' | 'landing'
   *   - advisor_id: string UUID | 'all'
   *
   * @param {Object|string} params - Objeto de filtros (nuevo) o string 'YYYY-MM' (legacy)
   */
  static kpi = async (params) => {
    // Compatibilidad legacy: si se pasa un string 'YYYY-MM'
    if (typeof params === "string") {
      const { result } = await Fetch(`/api/dashboard/campaigns/kpi/${params}`)
      return { data: result?.data ?? [], summary: result?.summary ?? {} }
    }

    // Nuevo sistema: POST con date_from / date_to / platform / advisor_id
    const res = await axios.post("/api/dashboard/campaigns/kpi", params)
    const result = res.data?.result ?? res.data
    return { data: result?.data ?? [], summary: result?.summary ?? {} }
  }

  static leads = async (month, campaign_id, adset_name) => {
    const { result } = await Fetch(`/api/dashboard/campaigns/leads/${month}`, { campaign_id, adset_name })
    return result?.data ?? []
  }

  /**
   * Sincroniza el gasto publicitario desde Meta Ads API
   */
  static syncSpend = async ({ date_from, date_to } = {}) => {
    const res = await axios.post("/api/dashboard/campaigns/sync-spend", { date_from, date_to })
    return res.data?.result ?? res.data
  }

  /**
   * Obtiene las metas de leads configuradas para el negocio
   */
  static getGoals = async () => {
    const { result } = await Fetch("/api/dashboard/campaigns/goals")
    return result?.data ?? []
  }

  /**
   * Guarda o actualiza una meta de leads
   * @param {{ campaign_id?: string, period: string, target_leads: number }} data
   */
  static saveGoal = async (data) => {
    const res = await axios.post("/api/dashboard/campaigns/goals", data)
    return res.data?.result ?? res.data
  }

  /**
   * Elimina una meta de leads
   */
  static deleteGoal = async (id) => {
    const res = await axios.delete(`/api/dashboard/campaigns/goals/${id}`)
    return res.data?.result ?? res.data
  }
}

export default KPICampaignsRest
