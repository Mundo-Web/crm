import { Cookies, Fetch, JSON, Notify } from "sode-extend-react"

class GmailRest {
  check = async () => {
    const { status, result } = await Fetch(`/api/gmail/check`)
    if (!status) return Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: result?.message || 'Ocurrió un error inesperado',
      type: 'danger'
    })
    return result?.data
  }

  list = async (email) => {
    const { status, result } = await Fetch(`/api/gmail`, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
    if (!status) return Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: result?.message || 'Ocurrió un error inesperado',
      type: 'danger'
    })
    return result?.data
  }

  getDetails = async (id) => {
    const { status, result } = await Fetch(`/api/gmail/details/${id}`)
    if (!status) return Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: result?.message || 'Ocurrió un error inesperado',
      type: 'danger'
    })
    return result?.data
  }

  send = async (request) => {
    const { status, result } = await Fetch(`/api/gmail/send`, {
      method: 'POST',
      headers: {
        'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
      },
      body: JSON.stringify(request)
    })

    if (!status) return Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: result?.message || 'Ocurrió un error inesperado',
      type: 'danger'
    })
    return result?.data ?? true
  }
}

export default GmailRest