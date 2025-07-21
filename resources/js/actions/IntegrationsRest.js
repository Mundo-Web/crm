import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class IntegrationsRest extends BasicRest {
  path = 'integrations'

  profile = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/profile`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data ?? true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default IntegrationsRest