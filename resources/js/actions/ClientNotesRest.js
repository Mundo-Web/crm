import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class ClientNotesRest extends BasicRest {

  path = 'client-notes'
  byClient = async (client) => {
    const { result } = await Fetch(`/api/${this.path}/client/${client}`)
    return result?.data ?? []
  }
}

export default ClientNotesRest