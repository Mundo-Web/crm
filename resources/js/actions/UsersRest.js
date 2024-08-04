import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class UsersRest extends BasicRest {
  path = 'users'
  
  assignRole = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/assign-role`, {
        method: 'POST',
        body: JSON.stringify(request)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

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

export default UsersRest