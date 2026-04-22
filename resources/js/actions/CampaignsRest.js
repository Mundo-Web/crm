import { Fetch } from "sode-extend-react";
import BasicRest from "./BasicRest";

class CampaignsRest extends BasicRest {
  path = 'campaigns'
  syncMetaHierarchy = async () => {
    const { status, result } = await Fetch(`/api/meta/sync-hierarchy`, {
      method: 'POST'
    })
    return status ? result.data ?? result : null
  }
}

export default CampaignsRest