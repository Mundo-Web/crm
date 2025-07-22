import React, { useEffect, useState } from "react"
import Logout from "../actions/Logout"
import WhatsAppStatuses from "../Reutilizables/WhatsApp/WhatsAppStatuses"
import BusinessCard from "../Reutilizables/Business/BusinessCard"
import NotificationsRest from "../actions/NotificationsRest"
import NotificationItem from "./notification/NotificationItem"
import { toast } from "sonner"

const notificationsRest = new NotificationsRest();

const NavBar = ({ can, session = {}, theme, setTheme, title = '', whatsappStatus, businesses, APP_PROTOCOL, APP_DOMAIN, notificationsCount: notificationsCountDB }) => {
  const { color } = WhatsAppStatuses[whatsappStatus]

  const [notificationsCount, setNotificationsCount] = useState(notificationsCountDB)
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.title = `${title} | Atalaya`
    $(document).on('change', '#light-mode-check', (e) => {
      setTheme(e.target.checked ? 'dark' : 'light')
    })
    return () => {
      $(document).off('change', '#light-mode-check')
    }
  }, [theme])

  const otherBusinesses = businesses.filter(({ id }) => session.business_id != id)

  const onNotificationsClicked = async () => {
    const isVisible = $('#notifications').is(':visible')
    if (!isVisible) return
    const { data, totalCount } = await notificationsRest.paginate({ requireTotalCount: true })
    setNotificationsCount(totalCount)
    setNotifications(data ?? [])
  }

  useEffect(() => {
    const notiRest = new NotificationsRest()
    const getRandomInterval = () => (Math.random() * 5000) + 5000
    const fetchNotificationsCount = async () => {
      const { totalCount, status } = await notiRest.paginate({
        requireTotalCount: true,
        requireData: false
      })
      if (status == 200) setNotificationsCount(old => {
        if (old != totalCount && old < totalCount) {
          const diff = totalCount - old;
          toast(`Tienes ${diff} notificaci${diff > 1 ? 'ones' : 'ón'} nueva${diff > 1 ? 's' : ''}`, {
            icon: <i className="mdi mdi-bell"></i>
          });
        }
        return totalCount
      })
    }
    fetchNotificationsCount()
    const interval = setInterval(fetchNotificationsCount, getRandomInterval())
    return () => clearInterval(interval)
  }, [notificationsCount])

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
          <a className="nav-link dropdown-toggle waves-effect waves-light" data-bs-toggle="dropdown" href="#"
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
                {/* <span className="float-end">
                  <a href="" className="text-dark">
                    <small>Clear All</small>
                  </a>
                </span> */}
                Notificaciones
              </h5>
            </div>

            <div className="noti-scroll" style={{ maxHeight: '230px', overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map((notification, i) => {
                  return <NotificationItem key={`notification-${i}`} {...notification} APP_DOMAIN={APP_DOMAIN} />
                })
              ) : (
                <div className="text-center" style={{overflow: 'hidden', padding: '0px 20px'}}>
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
          <a className="nav-link dropdown-toggle nav-user me-0 waves-effect waves-light" data-bs-toggle="dropdown"
            href="#" role="button" aria-haspopup="false" aria-expanded="false">
            <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}?v=${crypto.randomUUID()}`} alt="user-image" className="rounded-circle" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            <span className="pro-user-name ms-1">
              {session.name.split(' ')[0]} {session.lastname.split(' ')[0]}
              <i className="mdi mdi-chevron-down"></i>
            </span>
          </a>
          <div className="dropdown-menu dropdown-menu-end profile-dropdown ">

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
            {
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
            <img src="/assets/img/icon.svg?v=gracias-manuel-de-nada-manuel" alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src="/assets/img/logo.svg?v=gracias-manuel-de-nada-manuel" alt="" height="32" />
          </span>
        </a>
        <a href="/" className="logo logo-dark text-center">
          <span className="logo-sm">
            <img src="/assets/img/icon-dark.svg?v=gracias-manuel-de-nada-manuel" alt="" height="22" />
          </span>
          <span className="logo-lg">
            <img src="/assets/img/logo-dark.svg?v=gracias-manuel-de-nada-manuel" alt="" height="32" />
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