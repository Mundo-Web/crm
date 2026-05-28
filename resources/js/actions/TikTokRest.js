import { Cookies, Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class TikTokRest extends BasicRest {
  path = 'tiktok'

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

  // TikTok API in current controller handles text. If media is sent, we notify the user or send it as text link.
  sendAudio = async (client_id, audio) => {
    Notify.add({
      icon: '/assets/img/icon.svg',
      title: 'Información',
      body: 'La mensajería de TikTok actualmente solo soporta mensajes de texto. El audio no pudo ser enviado.',
      type: 'warning'
    })
    return false
  }

  sendImage = async (client_id, image, message) => {
    if (message?.trim()) {
      return this.send(client_id, message)
    }
    Notify.add({
      icon: '/assets/img/icon.svg',
      title: 'Información',
      body: 'La mensajería de TikTok actualmente solo soporta mensajes de texto. La imagen no pudo ser enviada.',
      type: 'warning'
    })
    return false
  }

  sendDocument = async (client_id, document, message) => {
    if (message?.trim()) {
      return this.send(client_id, message)
    }
    Notify.add({
      icon: '/assets/img/icon.svg',
      title: 'Información',
      body: 'La mensajería de TikTok actualmente solo soporta mensajes de texto. El documento no pudo ser enviado.',
      type: 'warning'
    })
    return false
  }
}

export default TikTokRest;
