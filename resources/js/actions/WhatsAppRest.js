import { Fetch, Notify } from "sode-extend-react";
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
}

export default WhatsAppRest