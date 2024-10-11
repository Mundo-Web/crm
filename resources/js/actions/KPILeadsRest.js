import { Fetch } from "sode-extend-react"

class KPILeadsRest {
  static kpi = async (month) => {
    const { result } = await Fetch(`/api/dashboard/leads/kpi/${month}`)
    return { data: result?.data ?? [], summary: result?.summary ?? {} }
  }
}

export default KPILeadsRest