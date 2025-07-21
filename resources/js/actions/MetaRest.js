import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class MetaRest extends BasicRest {
  path = 'meta'

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
}

export default MetaRest