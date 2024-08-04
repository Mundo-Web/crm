import React from 'react'
import { Local } from 'sode-extend-react'

const RigthBar = () => {

  const settings = Local.get('adminto_settings') ?? {}

  // Theme
  const bsLight = document.getElementById('bs-default-stylesheet')
  const bsDark = document.getElementById('bs-dark-stylesheet')

  const appLight = document.getElementById('app-default-stylesheet')
  const appDark = document.getElementById('app-dark-stylesheet')

  const dgLight = document.getElementById('dg-default-stylesheet')
  const dgDark = document.getElementById('dg-dark-stylesheet')

  if (settings.theme == 'dark') {
    bsDark.disabled = false
    appDark.disabled = false
    dgDark.disabled = false

    bsLight.disabled = true
    appLight.disabled = true
    dgLight.disabled = true
  } else {
    bsLight.disabled = false
    appLight.disabled = false
    dgLight.disabled = false

    bsDark.disabled = true
    appDark.disabled = true
    dgDark.disabled = true
  }

  const body = document.body

  // Width
  body.setAttribute('data-layout-width', settings.width ?? 'fluid')
  // Menu position
  body.setAttribute('data-layout-menu-position', settings.menuPosition ?? 'fixed')
  // Menu color
  body.setAttribute('data-sidebar-color', settings.menuColor ?? 'light')
  // User info
  body.setAttribute('data-sidebar-showuser', settings.userInfo ?? true)
  // Menu size
  body.setAttribute('data-sidebar-size', settings.menuSize ?? 'default')
  // Navbar color
  body.setAttribute('data-topbar-color', settings.navbarColor ?? 'light')

  return (<div className="right-bar">

    <div data-simplebar className="h-100">

      <div className="rightbar-title">
        <a href="#" className="right-bar-toggle float-end">
          <i className="mdi mdi-close"></i>
        </a>
        <h4 className="font-16 m-0 text-white">Configurar tema</h4>
      </div>
      <div className="tab-content pt-0">

        <div className="tab-pane active" id="settings-tab" role="tabpanel">

          <div className="p-3">
            <div className="alert alert-warning" role="alert">
              <strong>Modifica </strong> el tema, el menu, la barra superior, etc.
            </div>

            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Tema principal</h6>
            <div className="form-check form-switch mb-1">
              <input type="checkbox" className="form-check-input" name="color-scheme-mode"
                id="light-mode-check" defaultChecked={settings.theme == 'dark'} />
              <label className="form-check-label" htmlFor="light-mode-check">{settings.theme == 'dark' ? 'Modo oscuro' : 'Modo claro'}</label>
            </div>
            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Ancho de la ventana</h6>
            <div className="form-check form-switch mb-1">
              <input type="checkbox" className="form-check-input" name="width" id="fluid-check"
                defaultChecked={settings.width == 'boxed'} />
              <label className="form-check-label" htmlFor="fluid-check">{settings.width == 'boxed' ? 'Encuadrado' : 'Completo'}</label>
            </div>
            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Posicion del menu y el nabvar</h6>

            <div className="form-check form-switch mb-1">
              <input type="checkbox" className="form-check-input" name="menus-position"
                id="fixed-check" defaultChecked={settings.menuPosition == 'scrollable'} />
              <label className="form-check-label" htmlFor="fixed-check">{settings.menuPosition == 'scrollable' ? 'Posision dinamica' : 'Posicion fija'}</label>
            </div>

            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Color del menu</h6>

            <div className="form-check form-switch mb-1">
              <input type="radio" className="form-check-input" name="leftsidebar-color" value="light"
                id="light-check" defaultChecked={!settings.menuColor || settings.menuColor == 'light'} />
              <label className="form-check-label" htmlFor="light-check">Claro</label>
            </div>

            <div className="form-check form-switch mb-1">
              <input type="radio" className="form-check-input" name="leftsidebar-color" value="dark"
                id="dark-check" defaultChecked={settings.menuColor == 'dark'} />
              <label className="form-check-label" htmlFor="dark-check">Oscuro</label>
            </div>

            <div className="form-check form-switch mb-1">
              <input type="radio" className="form-check-input" name="leftsidebar-color" value="brand"
                id="brand-check" defaultChecked={settings.menuColor == 'brand'} />
              <label className="form-check-label" htmlFor="brand-check">Brand</label>
            </div>

            <div className="form-check form-switch mb-3">
              <input type="radio" className="form-check-input" name="leftsidebar-color" value="gradient"
                id="gradient-check" defaultChecked={settings.menuColor == 'gradient'} />
              <label className="form-check-label" htmlFor="gradient-check">Gradiente</label>
            </div>
            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Medida del menu</h6>

            <div className="form-check form-switch mb-1">
              <input type="radio" className="form-check-input" name="leftsidebar-size" value="default"
                id="default-size-check" defaultChecked={!settings.menuSize || settings.menuSize == 'default'} />
              <label className="form-check-label" htmlFor="default-size-check">Por defecto</label>
            </div>

            <div className="form-check form-switch mb-1">
              <input type="radio" className="form-check-input" name="leftsidebar-size" value="condensed"
                id="condensed-check" defaultChecked={settings.menuSize == 'condensed'}/>
              <label className="form-check-label" htmlFor="condensed-check">Condensado <small>(Tamaño extra pequeño)</small></label>
            </div>

            <div className="form-check form-switch mb-1">
              <input type="radio" className="form-check-input" name="leftsidebar-size" value="compact"
                id="compact-check" defaultChecked={settings.menuSize == 'compact'} />
              <label className="form-check-label" htmlFor="compact-check">Compacto <small>(Tamaño pequeño)</small></label>
            </div>
            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Informacion del Usuario (Menu)</h6>

            <div className="form-check form-switch mb-1">
              <input type="checkbox" className="form-check-input" name="leftsidebar-user" value="fixed"
                id="sidebaruser-check" defaultChecked={settings.userInfo != false} />
              <label className="form-check-label" htmlFor="sidebaruser-check">{settings.userInfo == 'false' ? 'Ocultar' : 'Mostrar'}</label>
            </div>
            <h6 className="fw-medium font-14 mt-4 mb-2 pb-1">Color de la barra superior</h6>

            <div className="form-check form-switch mb-1">
              <input type="checkbox" className="form-check-input" name="topbar-color" value="dark"
                id="darktopbar-check" defaultChecked={settings.navbarColor == 'dark'} />
              <label className="form-check-label" htmlFor="darktopbar-check">{settings.navbarColor == 'dark' ? 'Oscuro' : 'Acorde al cuerpo'}</label>
            </div>

            <div className="d-grid mt-4">
              <button className="btn btn-primary" id="resetBtn">Restablecer</button>
              {/* <a href="https://1.envato.market/admintoadmin" className="btn btn-danger mt-3"
                target="_blank"><i className="mdi mdi-basket me-1"></i> Purchase Now</a> */}
            </div>

          </div>

        </div>
      </div>

    </div>
  </div>)
}

export default RigthBar