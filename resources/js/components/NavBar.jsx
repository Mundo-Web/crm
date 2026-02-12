import React, { useEffect, useState } from "react"
import Logout from "../actions/Logout"
import WhatsAppStatuses from "../Reutilizables/WhatsApp/WhatsAppStatuses"
import BusinessCard from "../Reutilizables/Business/BusinessCard"
import NotificationsRest from "../actions/NotificationsRest"
import NotificationItem from "./notification/NotificationItem"
import { toast } from "sonner"
import { io } from "socket.io-client"
import Global from "../Utils/Global"
import Tippy from "@tippyjs/react"
import UsersByServicesByBusinessesRest from "../actions/Atalaya/UsersByServicesByBusinessesRest"
import useWebSocket from "../Reutilizables/CustomHooks/useWebSocket"
import DDMenuItem from "./DDMenuItem"

const notificationsRest = new NotificationsRest();
const usersByServicesByBusinessesRest = new UsersByServicesByBusinessesRest();

const audio = new Audio('/assets/sounds/notification.wav');

const NavBar = ({ can, session = {}, services, theme, setTheme, title = '', wsActive, setWsActive, whatsappStatus, businesses, APP_PROTOCOL, APP_DOMAIN, pinned, setPinned }) => {
  const { color } = WhatsAppStatuses[whatsappStatus]

  const [notifications, setNotifications] = useState([]);

  const { notificationsCount } = useWebSocket();

  const otherBusinesses = businesses.filter(({ id }) => session.business_id != id)

  const onNotificationsClicked = async () => {
    const isVisible = $('#notifications').is(':visible')
    if (!isVisible) return
    const { data, totalCount } = await notificationsRest.paginate({ requireTotalCount: true })
    // setNotificationsCount(totalCount)
    setNotifications(data ?? [])
  }

  const fetchNotificationsCount = async () => {
    const notiRest = new NotificationsRest()
    const { totalCount, status } = await notiRest.paginate({
      requireTotalCount: true,
      requireData: false
    })
    if (status == 200) setNotificationsCount(totalCount)
  }

  const onMarkAsReadClicked = async () => {
    await notificationsRest.boolean({
      field: 'seen',
      value: true
    }, false)
    // fetchNotificationsCount()
    setNotifications([])
  }

  const onServiceOpen = async ({ correlative, i_work, status }) => {
    if (!status) return

    if (!i_work) {
      location.href = `${APP_PROTOCOL}://${APP_DOMAIN}/businesses`
      return
    }

    const result = await usersByServicesByBusinessesRest.authorize({
      service: correlative
    })
    if (!result) return
    location.href = `${APP_PROTOCOL}://${correlative}.${APP_DOMAIN}/home`
  }

  useEffect(() => {
    $(document).on('change', '#light-mode-check', (e) => {
      setTheme(e.target.checked ? 'dark' : 'light')
    })
    return () => {
      $(document).off('change', '#light-mode-check')
    }
  }, [theme])

  useEffect(() => {
    if (notificationsCount > 0) {
      document.title = `(${notificationsCount}) ${title} | Atalaya`
    } else {
      document.title = `${title} | Atalaya`
    }
  }, [notificationsCount])

  useEffect(() => {
    return
    // Conectar al servicio específico (el service se toma del path)
    const service = Global.APP_CORRELATIVE // Este sería el {service} en la URL
    const socket = io(`wss://events.atalaya.pe/${service}`)

    socket.on("connect", () => {
      socket.emit("register_filters", {
        business_id: session.business_id,
        user_id: session.service_user.id
      })
    })

    // Escuchar confirmación de registro de filtros
    socket.on("filters_registered", ({ service }) => {
      setWsActive(true)
      console.log(`Conectado a eventos de ${service}`)
    })

    // Escuchar diferentes tipos de eventos
    socket.on("notification", (message) => {
      toast(message, { icon: <i className="mdi mdi-bell" /> })
      fetchNotificationsCount()

      if (!document.hasFocus()) {
        const broadcast = new BroadcastChannel('focus-check');
        let otherTabHasFocus = false;

        broadcast.postMessage('check-focus');

        broadcast.onmessage = (event) => {
          if (event.data === 'has-focus') {
            otherTabHasFocus = true;
          }
        };

        setTimeout(() => {
          // if (!otherTabHasFocus) {
          audio.play();
          // }
          broadcast.close();
        }, 100);
      }
    })

    // Escuchar errores
    socket.on("error", (error) => {
      console.error("❌ Error:", error)
    })

    socket.on("disconnect", () => {
      setWsActive(false)
      console.log("Desconectado del servidor")
    })

    return () => {
      socket.disconnect()
    }
  }, [null]);

  return (
    <div className={`navbar-custom border-bottom ${theme == 'light' ? 'bg-white' : ''}`} style={{ backgroundColor: (theme == 'light' ? undefined : '#313844') }}>
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
        </li> */}

        {/* <li className="dropdown d-inline-block d-lg-none">
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

        <li className="dropdown notification-list d-none d-lg-block">
          <div className="nav-link">
            <label htmlFor="light-mode-check" type="button" className={`btn btn-xs ${theme == 'dark' ? 'btn-secondary' : 'btn-secondary'} rounded-pill waves-effect waves-light`}>
              {theme == 'dark'
                ? <>
                  Light
                  <span className="btn-label-right ms-1" style={{ paddingLeft: '6px' }}>
                    <i className="mdi mdi-weather-sunny"></i>
                  </span>
                </>
                : <>
                  <span className="btn-label me-1" style={{ paddingRight: '6px' }}>
                    <i className="mdi mdi-moon-waning-crescent"></i>
                  </span>
                  Dark
                </>
              }
            </label>
          </div>
        </li>

        {can('whatsapp', 'root', 'all') && <li className="notification-list topbar-dropdown d-none d-lg-block">
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
          <a className="nav-link dropdown-toggle waves-effect waves-light driver-js-notifications" data-bs-toggle="dropdown" href="#"
            role="button" aria-haspopup="false" aria-expanded="false" onClick={onNotificationsClicked}>
            <i className={`fe-bell noti-icon rounded-pill ${notificationsCount > 0 && 'pulse'}`}></i>
            {
              notificationsCount > 0 ?
                <span className="badge bg-danger rounded-circle noti-icon-badge">{notificationsCount}</span>
                : ''
            }
          </a>
          <div id="notifications" className="dropdown-menu dropdown-menu-end dropdown-lg">

            <div className="dropdown-item noti-title">
              <h5 className="m-0">
                {
                  notificationsCount > 0 &&
                  <span className="float-end">
                    <Tippy content='Marcar todo como leido'>
                      <span className="link text-dark" style={{ cursor: 'pointer' }} onClick={onMarkAsReadClicked}>
                        <i className="mdi mdi-check-all me-1"></i>
                        <small>Leído</small>
                      </span>
                    </Tippy>
                  </span>
                }
                Notificaciones
              </h5>
            </div>

            <div className="noti-scroll" style={{ maxHeight: '230px', overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map((notification, i) => {
                  return <NotificationItem key={`notification-${i}`} {...notification} APP_DOMAIN={APP_DOMAIN} />
                })
              ) : (
                <div className="text-center" style={{ overflow: 'hidden', padding: '0px 20px' }}>
                  <span className="text-muted">No tienes notificaciones nuevas</span>
                </div>
              )}
            </div>
            {/* <a href="#"
              className="dropdown-item text-center text-primary notify-item notify-all">
              Ver todo
              <i className="fe-arrow-right"></i>
            </a> */}

          </div>
        </li>

        <li className="dropdown notification-list topbar-dropdown">
          <a className="nav-link dropdown-toggle waves-effect waves-light" data-bs-toggle="dropdown" href="#" role="button" aria-haspopup="false" aria-expanded="false">
            <i className="fe-grid noti-icon"></i>
          </a>
          <div className="dropdown-menu dropdown-menu-end dropdown-lg">
            <div className="dropdown-header noti-title pb-0">
              <h5 className="m-0">Aplicaciones</h5>
            </div>
            <div className="row g-0 gy-2 px-2 py-2">
              {/* Mi cuenta */}
              <div className="col-4 text-center">
                <button
                  onClick={() => window.location.href = `//${APP_DOMAIN}/account`}
                  className="d-block btn-ligth bg-white rounded waves-effect p-1 pt-2 border-0 w-100"
                  title="Mi cuenta"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                >
                  <img
                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}`}
                    onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                    alt="Mi cuenta"
                    className="mb-1 rounded-circle"
                    style={{ width: '40px', height: '40px' }}
                  />
                  <div className="small fw-semibold">Mi cuenta</div>
                </button>
              </div>

              {/* Servicios restantes en grilla 3xN */}
              {services.map((service, idx) => (
                <div key={idx} className="col-4 text-center">
                  <button
                    disabled={!service.status || !service.i_work}
                    onClick={() => onServiceOpen(service)}
                    className="d-block btn-ligth bg-white rounded waves-effect p-1 pt-2 border-0 w-100"
                    style={{ cursor: service.status && service.i_work ? 'pointer' : 'not-allowed' }}
                    title={service.description}
                  >
                    <div className="position-relative d-inline-block mb-1">
                      <img
                        src={`//${service.correlative}.${Global.APP_DOMAIN}/assets/img/icon.svg`}
                        onError={(e) => e.target.src = `//${APP_DOMAIN}/assets/img/icon.svg`}
                        alt={service.name}
                        style={{
                          width: '40px', height: '40px',
                          objectFit: 'contain', objectPosition: 'center',
                          opacity: service.status && service.i_work ? 1 : 0.75
                        }}
                      />
                      {!service.status && (
                        <span className="position-absolute top-50 start-50 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '8px' }}>
                          Proximamente
                        </span>
                      )}
                      {
                        service.status && !service.i_work && (
                          <span className="position-absolute top-50 start-50 translate-middle badge rounded-pill bg-secondary" style={{ fontSize: '8px' }}>
                            Por activar
                          </span>
                        )
                      }
                    </div>
                    <div className="small fw-semibold text-truncate">{service.name}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </li>

        <li className="dropdown notification-list topbar-dropdown">
          <a className="nav-link dropdown-toggle nav-user me-0 waves-effect waves-light driver-js-account" data-bs-toggle="dropdown"
            href="#" role="button" aria-haspopup="false" aria-expanded="false">
            <div className="d-inline-block position-relative" style={{ height: 'max-content' }}>
              <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}`} alt="user-image" onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }} className="rounded-circle" style={{ objectFit: 'cover', objectPosition: 'center' }} />
              <span className={`d-block ${wsActive ? 'bg-success' : 'bg-danger'} position-absolute rounded-circle`} style={{ width: '8px', height: '8px', bottom: '16px', right: '0px' }}></span>
            </div>
            <span className="pro-user-name ms-1">
              {session.name.split(' ')[0]} {session.lastname.split(' ')[0]}
              <i className="mdi mdi-chevron-down"></i>
            </span>
          </a>
          <div className="dropdown-menu dropdown-menu-end profile-dropdown driver-js-account-dropdown " onClick={e => e.stopPropagation()}>

            <div className="dropdown-header noti-title">
              <h6 className="text-overflow m-0">Bienvenido !</h6>
            </div>


            <a href={`//${APP_DOMAIN}/profile`} className="dropdown-item notify-item">
              <i className="fe-user"></i>
              <span>Mi perfil</span>
            </a>

            <a href={`//${APP_DOMAIN}/account`} className="dropdown-item notify-item">
              <i className="mdi mdi-account-key-outline"></i>
              <span>Mi cuenta</span>
            </a>
            {/* {
              otherBusinesses.length > 0 &&
              <>
                <div className="dropdown-header noti-title">
                  <h6 className="text-overflow m-0">Otras empresas</h6>
                </div>
                <div className="notification-list">
                  {
                    otherBusinesses.map((business, i) => {
                      return <BusinessCard key={`business-${i}`} {...business} session={session} APP_PROTOCOL={APP_PROTOCOL} APP_DOMAIN={APP_DOMAIN} />
                    })
                  }
                </div>
              </>
            } */}
            <div className="dropdown-divider"></div>
            {
              (can('users', 'root', 'all', 'list') || can('roles', 'root', 'all', 'list') || can('permissions', 'root', 'all', 'list')) &&
              <>
                <a href="#users-roles" className="dropdown-item notify-item" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="users-roles">
                  <i className="mdi mdi-account-lock me-1"></i>
                  <span>Usuarios y roles</span>
                  <i className="mdi mdi-chevron-down float-end"></i>
                </a>
                <div className="collapse ms-3" id="users-roles">
                  {can('users', 'root', 'all', 'list') &&
                    <DDMenuItem icon='mdi mdi-account' href='/users' pinned={pinned} setPinned={setPinned}>Usuarios</DDMenuItem>
                  }
                  {can('roles', 'root', 'all', 'list') &&
                    <DDMenuItem icon='mdi mdi-account-convert' href='/roles' pinned={pinned} setPinned={setPinned}>Roles</DDMenuItem>
                  }
                </div>
              </>
            }

            <DDMenuItem icon='mdi mdi-message-bulleted' href='/default-messages' pinned={pinned} setPinned={setPinned}>Mensajes predeter...</DDMenuItem>

            <DDMenuItem icon='mdi mdi-database' href='/repository' pinned={pinned} setPinned={setPinned}>Repositorio</DDMenuItem>

            {
              can('apikeys', 'root', 'all', 'list') &&
              <>
                <a href="#integrations" className="dropdown-item notify-item" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="integrations">
                  <i className="mdi mdi-api me-1"></i>
                  <span>Integraciones</span>
                  <i className="mdi mdi-chevron-down float-end"></i>
                </a>
                <div className="collapse ms-3" id="integrations">
                  <DDMenuItem icon='mdi mdi-webhook' href='/webhooks' pinned={pinned} setPinned={setPinned}>Redes sociales</DDMenuItem>
                  <DDMenuItem icon='mdi mdi-form-textbox' href='/apikeys' pinned={pinned} setPinned={setPinned}>Formulario Externo</DDMenuItem>
                  <DDMenuItem icon='mdi mdi-image-filter-center-focus-strong' href='/pixels' pinned={pinned} setPinned={setPinned}>Atalaya Pixel</DDMenuItem>
                </div>
              </>
            }

            {
              (can('tables', 'root', 'all', 'list') || can('statuses', 'root', 'all', 'list') || can('types', 'root', 'all', 'list')) && <>
                <div className="dropdown-header noti-title">
                  <h6 className="text-overflow m-0">Menus del sistema</h6>
                </div>
                <a href="#maintenance" className="dropdown-item notify-item" data-bs-toggle="collapse" role="button" aria-expanded="false" aria-controls="maintenance">
                  <i className="mdi mdi-application-cog me-1"></i>
                  <span>Mantenimiento</span>
                  <i className="mdi mdi-chevron-down float-end"></i>
                </a>
                <div className="collapse ms-3" id="maintenance">
                  {can('statuses', 'root', 'all', 'list') &&
                    <DDMenuItem icon='mdi mdi-format-list-checks' href='/statuses' pinned={pinned} setPinned={setPinned}>Estados</DDMenuItem>
                  }
                  {can('types', 'root', 'all', 'list') &&
                    <DDMenuItem icon='mdi mdi-format-list-text' href='/types' pinned={pinned} setPinned={setPinned}>Tipos</DDMenuItem>
                  }
                </div>
                {can('settings', 'root', 'all', 'list') &&
                  <DDMenuItem icon='mdi mdi-cogs' href='/settings' pinned={pinned} setPinned={setPinned}>Configuraciones</DDMenuItem>
                }
              </>
            }
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item notify-item" onClick={Logout}>
              <i className="fe-log-out"></i>
              <span>Cerrar sesion</span>
            </a>
          </div>
        </li>

        {/* <li className="dropdown notification-list">
          <a href="#" className="nav-link right-bar-toggle waves-effect waves-light">
            <i className="fe-settings noti-icon"></i>
          </a>
        </li> */}

      </ul>

      <div className="logo-box border-bottom">
        <a href="/" className="logo logo-light text-center">
          <span className="logo-sm">
            <img src="/assets/img/icon.svg?v=ef450a74-d0cd-4e77-be41-d3063bb50bc8" alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src="/assets/img/logo.svg?v=ef450a74-d0cd-4e77-be41-d3063bb50bc8" alt="" height="32" />
          </span>
        </a>
        <a href="/" className="logo logo-dark text-center">
          <span className="logo-sm">
            <img src="/assets/img/icon-dark.svg?v=ef450a74-d0cd-4e77-be41-d3063bb50bc8" alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src="/assets/img/logo-dark.svg?v=ef450a74-d0cd-4e77-be41-d3063bb50bc8" alt="" height="32" />
          </span>
        </a>
      </div>

      <ul className="list-unstyled topnav-menu topnav-menu-left mb-0">
        <li>
          <button className="button-menu-mobile disable-btn waves-effect">
            <i className="fe-menu"></i>
          </button>
        </li>

        {/* <li>
          <h4 className="page-title-main">{title}</h4>
        </li> */}

      </ul>

      <div className="clearfix"></div>

    </div>
  )
}

export default NavBar