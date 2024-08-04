import { Fetch, Notify } from "sode-extend-react"

class RemainingsHistoryRest {
  static get = async (month) => {
    const { result } = await Fetch(`/api/remainings-history/${month}`)
    return result?.data ?? 0
  }
}

export default RemainingsHistoryRest