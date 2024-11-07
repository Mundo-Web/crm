import { Fetch, Notify } from "sode-extend-react"

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
}

export default GmailRest