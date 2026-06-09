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
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  sendImage = async (client_id, image, message) => {
    try {
      const formData = new FormData()
      formData.append('client_id', client_id)
      formData.append('image', image)
      if (message?.trim()) formData.append('message', message)
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
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  sendDocument = async (client_id, document, message) => {
    try {
      const formData = new FormData()
      formData.append('client_id', client_id)
      formData.append('document', document)
      if (message?.trim()) formData.append('message', message)
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
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  getTemplates = async () => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/templates`)
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al obtener las plantillas')
      return result.data ?? []
    } catch (error) {
      console.error(error.message)
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return []
    }
  }

  sendTemplate = async (client_id, template_name, language_code, parameters, template_text) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/send-template`, {
        method: 'POST',
        body: JSON.stringify({ client_id, template_name, language_code, parameters, template_text })
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al enviar la plantilla')
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

  createTemplate = async (name, category, language, text) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/templates`, {
        method: 'POST',
        body: JSON.stringify({ name, category, language, text })
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al crear la plantilla en Meta')
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

  deleteTemplate = async (name) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/templates/${name}`, {
        method: 'DELETE'
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al eliminar la plantilla de Meta')
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

  verifyBilling = async () => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/billing-status`)
      if (!status) return { has_payment_method: true }
      return result.data ?? { has_payment_method: true }
    } catch (error) {
      console.error(error.message)
      return { has_payment_method: true }
    }
  }
}

export default WhatsAppRest