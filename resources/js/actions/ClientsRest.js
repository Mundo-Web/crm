import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class ClientsRest extends BasicRest {
  path = 'clients'

  get = async (client) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${client}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }

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