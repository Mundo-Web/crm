import { Fetch } from "sode-extend-react"

class KPICampaignsRest {
  static kpi = async (month) => {
    const { result } = await Fetch(`/api/dashboard/campaigns/kpi/${month}`)
    return { data: result?.data ?? [], summary: result?.summary ?? {} }
  }

  static leads = async (month, campaign_id, adset_name) => {
    const { result } = await Fetch(`/api/dashboard/campaigns/leads/${month}`, { campaign_id, adset_name })
    return result?.data ?? []
  }
}

export default KPICampaignsRest
