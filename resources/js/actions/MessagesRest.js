import { Cookies, Fetch } from "sode-extend-react";
import BasicRest from "./BasicRest";

class MessagesRest extends BasicRest {
  path = 'messages'

  countUnSeenMessages = async () => {
    const { status, result } = await Fetch(`/api/${this.path}/count-unseen`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
      }
    })
    if (!status) return null
    return result?.data ?? 0
  }
}

export default MessagesRest