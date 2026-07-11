import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class CampaignsRest extends BasicRest {
  path = 'campaigns'
  syncMetaHierarchy = async () => {
    const { status, result } = await Fetch(`/api/meta/sync-hierarchy`, {
      method: 'POST'
    })
    if (!status) {
      const message = result?.message || result?.error || 'Error al sincronizar con Meta'
      throw new Error(message)
    }
    return result.data ?? result
  }
}

export default CampaignsRest