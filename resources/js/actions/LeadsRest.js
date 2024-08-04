import { Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class LeadsRest extends BasicRest {
  path = 'leads'

  all = async () => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return []
    }
  }

  leadStatus = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/status`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  manageStatus = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/manage-status`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  attend = async (lead, attend) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/attend/${lead}`, {
        method: attend ? 'PUT':'DELETE'
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default LeadsRest