import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class ClientsRest extends BasicRest {
  path = 'clients'

  static assign = async (client_id, assign) => {
    try {
      const { status: fetchStatus, result } = await Fetch('/api/clients/assign', {
        method: assign ? 'PUT' : 'DELETE',
        body: JSON.stringify({ id: client_id })
      })
      if (!fetchStatus) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })

      return true
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

  static clientStatus = async (client, status) => {
    try {
      const { status: fetchStatus, result } = await Fetch('/api/clients/client-status', {
        method: 'PATCH',
        body: JSON.stringify({ client, status })
      })
      if (!fetchStatus) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })

      return true
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

export default ClientsRest