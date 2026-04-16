import { Fetch } from "sode-extend-react"

class KPICampaignsRest {
  static kpi = async (month) => {
    const { result } = await Fetch(`/api/dashboard/campaigns/kpi/${month}`)
    return { data: result?.data ?? [], summary: result?.summary ?? {} }
  }
}

export default KPICampaignsRest
