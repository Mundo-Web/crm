import { Fetch, Notify } from "sode-extend-react"

class AuthRest {
  static login = async (request) => {
    try {

      const { status, result } = await Fetch('./api/login', {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Error al iniciar sesion')

      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Operacion correcta',
        body: 'Se inicio sesion correctamente'
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

export default AuthRest