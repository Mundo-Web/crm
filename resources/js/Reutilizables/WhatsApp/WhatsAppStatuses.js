const WhatsAppStatuses = {
  verifying: {
    icon: 'fa fa-spinner fa-spin',
    text: 'Verificando sesion...',
    color: 'secondary'
  },
  qr: {
    icon: 'mdi mdi-qrcode-scan',
    text: 'Escanea el QR',
    color: 'danger'
  },
  loading_screen: {
    icon: 'fa fa-spinner fa-spin',
    text: 'Cargando...',
    color: 'secondary'
  },
  authenticated: {
    icon: 'fa fa-check',
    text: 'Sesion activa',
    color: 'primary'
  },
  ready: {
    icon: 'fa fa-check',
    text: 'Sesion activa y lista',
    color: 'success'
  },
  close: {
    icon: 'fa fa-warning',
    text: 'Sesion cerrada',
    color: 'danger'
  }
}

export default WhatsAppStatuses