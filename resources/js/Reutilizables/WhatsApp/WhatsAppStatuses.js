const WhatsAppStatuses = {
  null: {
    icon: 'mdi mdi-qrcode',
    text: 'Inicia sesión en WhatsApp',
    color: 'dark'
  },
  verifying: {
    icon: 'fa fa-spinner fa-spin',
    text: 'Verificando sesión...',
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
    text: 'Sesión activa',
    color: 'primary'
  },
  ready: {
    icon: 'fa fa-check',
    text: 'Sesión activa y lista',
    color: 'success'
  },
  close: {
    icon: 'fa fa-warning',
    text: 'Sesión cerrada',
    color: 'danger'
  }
}

export default WhatsAppStatuses