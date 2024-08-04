import { Fetch, Notify } from "sode-extend-react"

class ProfileRest {
  static save = async (request) => {
    try {
      const { status, result } = await Fetch('/api/profile', {
        method: 'PATCH',
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

export default ProfileRest