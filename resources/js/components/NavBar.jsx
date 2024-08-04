import React, { useEffect } from "react"
import Logout from "../actions/Logout"
import WhatsAppStatuses from "../Reutilizables/WhatsApp/WhatsAppStatuses"

const NavBar = ({ can, session = {}, title = '', whatsappStatus, businesses, APP_DOMAIN }) => {

  const { color } = WhatsAppStatuses[whatsappStatus]

  useEffect(() => {
    document.title = `${title} | Atalaya`
  }, [null])

  return (
    <div className="navbar-custom">
      <ul className="list-unstyled topnav-menu float-end mb-0">

        {/* <li className="d-none d-lg-block">
          <form className="app-search">
            <div className="app-search-box">
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Search..." id="top-search" />
                <button className="btn input-group-text" type="submit">
                  <i className="fe-search"></i>
                </button>
              </div>
              <div className="dropdown-menu dropdown-lg" id="search-dropdown">

                <div className="dropdown-header noti-title">
                  <h5 className="text-overflow mb-2">Found 22 results</h5>
                </div>


                <a href="#" className="dropdown-item notify-item">
                  <i className="fe-home me-1"></i>
                  <span>Analytics Report</span>
                </a>


                <a href="#" className="dropdown-item notify-item">
                  <i className="fe-aperture me-1"></i>
                  <span>How can I help you?</span>
                </a>


                <a href="#" className="dropdown-item notify-item">
                  <i className="fe-settings me-1"></i>
                  <span>User profile settings</span>
                </a>


                <div className="dropdown-header noti-title">
                  <h6 className="text-overflow mb-2 text-uppercase">Users</h6>
                </div>

                <div className="notification-list">

                  <a href="#" className="dropdown-item notify-item">
                    <div className="d-flex align-items-start">
                      <img className="d-flex me-2 rounded-circle" src="/assets/img/user-404.svg"
                        alt="Generic placeholder image" height="32" />
                      <div className="w-100">
                        <h5 className="m-0 font-14">Erwin E. Brown</h5>
                        <span className="font-12 mb-0">UI Designer</span>
                      </div>
                    </div>
                  </a>


                  <a href="#" className="dropdown-item notify-item">
                    <div className="d-flex align-items-start">
                      <img className="d-flex me-2 rounded-circle" src="/assets/img/user-404.svg"
                        alt="Generic placeholder image" height="32" />
                      <div className="w-100">
                        <h5 className="m-0 font-14">Jacob Deo</h5>
                        <span className="font-12 mb-0">Developer</span>
                      </div>
                    </div>
                  </a>
                </div>

              </div>
            </div>
          </form>
        </li>

        <li className="dropdown d-inline-block d-lg-none">
          <a className="nav-link dropdown-toggle arrow-none waves-effect waves-light" data-bs-toggle="dropdown"
            href="#" role="button" aria-haspopup="false" aria-expanded="false">
            <i className="fe-search noti-icon"></i>
          </a>
          <div className="dropdown-menu dropdown-lg dropdown-menu-end p-0">
            <form className="p-3">
              <input type="text" className="form-control" placeholder="Search ..."
                aria-label="Recipient's username" />
            </form>
          </div>
        </li> */}

        {can('whatsapp', 'root', 'all') && <li className="notification-list topbar-dropdown">
          <a className="nav-link waves-effect waves-light" data-bs-toggle="modal" data-bs-target="#whatsapp-modal">
            <span className="position-relative">
              <i className="mdi mdi-whatsapp noti-icon"></i>
              <span className={`position-absolute top-0 start-100 translate-middle p-1 bg-${color} rounded-circle`}>
                <span className="visually-hidden">New alerts</span>
              </span>

            </span>
          </a>
        </li>}

        <li className="dropdown notification-list topbar-dropdown">
          <a className="nav-link dropdown-toggle nav-user me-0 waves-effect waves-light" data-bs-toggle="dropdown"
            href="#" role="button" aria-haspopup="false" aria-expanded="false">
            <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}?v=${crypto.randomUUID()}`} alt="user-image" className="rounded-circle" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            <span className="pro-user-name ms-1">
              {session.name} {session.lastname}
              <i className="mdi mdi-chevron-down"></i>
            </span>
          </a>
          <div className="dropdown-menu dropdown-menu-end profile-dropdown ">

            <div className="dropdown-header noti-title">
              <h6 className="text-overflow m-0">Bienvenido !</h6>
            </div>


            <a href="/profile" className="dropdown-item notify-item">
              <i className="fe-user"></i>
              <span>Mi perfil</span>
            </a>

            <a href="/account" className="dropdown-item notify-item">
              <i className="mdi mdi-account-key-outline"></i>
              <span>Mi cuenta</span>
            </a>
            <div className="dropdown-header noti-title">
              <h6 className="text-overflow m-0">Empresas</h6>
            </div>
            <div className="notification-list">
              {
                businesses.sort((a, b) => {
                  return a.id == session.business_id ? -1 : 1
                }).map((business, i) => {
                  return <span key={`business-${i}`} className="dropdown-item notify-item" style={{cursor: 'pointer'}}>
                    <div className="d-flex align-items-start">
                      <img className="d-flex me-2 rounded-circle" src="/api/profile/thumbnail/null"
                        alt={business.name} height="32" />
                      <div className="w-100">
                        <h5 className={`m-0 font-14 ${business.id == session.business_id && 'text-primary'}`}>{business.name}</h5>
                        <span className="font-12 mb-0">RUC: {business.person.document_number}</span>
                      </div>
                    </div>
                  </span>
                })
              }
            </div>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item notify-item" onClick={Logout}>
              <i className="fe-log-out"></i>
              <span>Cerrar sesion</span>
            </a>
          </div>
        </li>

        <li className="dropdown notification-list">
          <a href="#" className="nav-link right-bar-toggle waves-effect waves-light">
            <i className="fe-settings noti-icon"></i>
          </a>
        </li>

      </ul>


      <div className="logo-box">
        <a href="index.html" className="logo logo-light text-center">
          <span className="logo-sm">
            <img src="/assets/img/icon.svg" alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src="/assets/img/logo.svg" alt="" height="16" />
          </span>
        </a>
        <a href="index.html" className="logo logo-dark text-center">
          <span className="logo-sm">
            <img src="/assets/img/icon-dark.svg" alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src="/assets/img/logo-dark.svg" alt="" height="16" />
          </span>
        </a>
      </div>

      <ul className="list-unstyled topnav-menu topnav-menu-left mb-0">
        <li>
          <button className="button-menu-mobile disable-btn waves-effect">
            <i className="fe-menu"></i>
          </button>
        </li>

        <li>
          <h4 className="page-title-main">{title}</h4>
        </li>

      </ul>

      <div className="clearfix"></div>

    </div>
  )
}

export default NavBar