import { Fetch, Notify } from "sode-extend-react"

const Logout = async () => {
  try {
    const { status, result } = await Fetch('./api/logout', { method: 'DELETE' })
    if (!status) throw new Error(result?.message || 'Ocurrio un error al cerrar sesion')
    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Cierre de sesion exitoso',
      body: 'Sera enviado a la pantalla de autenticacion',
    })
    location.reload()
  } catch (error) {
    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: error.message,
      type: 'danger'
    })
  }
}

export default Logout