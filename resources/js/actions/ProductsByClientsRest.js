import { Fetch } from "sode-extend-react";
import BasicRest from "./BasicRest";

class ProductsByClients extends BasicRest {
  path = 'products-by-client'

  byClient = async (client) => {
    const { result } = await Fetch(`/api/${this.path}/client/${client}`)
    return result?.data ?? []
  }
}

export default ProductsByClients