import { Cookies } from "sode-extend-react";
import BasicRest from "./BasicRest";

let controller = new AbortController()
class MessagesRest extends BasicRest {
  path = 'messages'

  countUnSeenMessages = async (assigneds = []) => {
    controller.abort()
    controller = new AbortController()

    try {
      const res = await fetch(`/api/${this.path}/count-unseen`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        body: JSON.stringify({ assigneds }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error((await res.json())?.message ?? 'Error inesperado')
      const json = await res.json()
      return json?.data ?? 0
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Error:', error.message)
      }
      return null
    }
  }
}

export default MessagesRest