import { Cookies, Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class WhatsAppRest extends BasicRest {
  path = 'whatsapp'

  verify = async (showNotify = false) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}`)
      // if (!status) throw new Error(result?.message ?? 'Ocurrio un error al verificar la sesion')
      return { status: result.status, data: result.data } ?? true
    } catch (error) {
      console.error(error.message)
      showNotify && Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return { status: 400, data: null }
    }
  }

  send = async (client_id, message) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/send`, {
        method: 'POST',
        body: JSON.stringify({ client_id, message })
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al enviar el mensaje')
      return result
    } catch (error) {
      console.error(error.message)
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  sendAudio = async (client_id, audio) => {
    try {
      const formData = new FormData()
      formData.append('client_id', client_id)
      formData.append('audio', audio)
      const response = await fetch(`/api/${this.path}/send`, {
        method: 'POST',
        headers: {
           'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        body: formData
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.message ?? 'Ocurrio un error al enviar el mensaje')
      return result
    } catch (error) {
      console.error(error.message)
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default WhatsAppRest