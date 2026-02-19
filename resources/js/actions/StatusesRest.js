import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class StatusesRest extends BasicRest {
  path = 'statuses'

  saveParent = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/massive`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      return result.data || true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }
}

export default StatusesRest