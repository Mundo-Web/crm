import { Cookies, Fetch, JSON, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"
import Global from "../Utils/Global"

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

  addSign = async (request) => {
    let status = false
    let result = null

    const res = await fetch(`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/api/signs`, {
      method: 'POST',
      headers: {
        'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
      },
      body: request
    })
    status = res.ok
    result = JSON.parseable(await res.text())

    if (!status) return Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: result?.message || 'Ocurrió un error inesperado',
      type: 'danger'
    })
    return result?.data ?? true
  }

  deleteSign = async () => {
    try {
      const { status, result } = await Fetch(`/api/users/sign`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error inesperado')

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

  setDefaultSign = async (sign) => {
    try {
      const { status, result } = await Fetch(`/api/users/sign/default`, {
        method: 'PUT',
        body: JSON.stringify(sign)
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error inesperado')
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