import { Cookies, Fetch, Notify } from "sode-extend-react";
import BasicRest from "./BasicRest";

class LeadsRest extends BasicRest {
  path = 'leads'
  paginateSufix = 'served'

  get = async (lead) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${lead}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }

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
        body: JSON.stringify(request),
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
        body: JSON.stringify(request),
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

  massiveAssign = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/massive-assign`, {
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
        method: attend ? 'PUT' : 'DELETE'
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

  import = async (request) => {
    try {
      const res = await fetch(`/api/${this.path}/import`, {
        method: 'POST',
        headers: {
          'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
        },
        body: request
      })
      const status = res.ok
      const result = JSON.parseable(await res.text())
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