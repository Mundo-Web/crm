import React from 'react'
import Logout from '../actions/Logout'
import MenuItem from './MenuItem'
import MenuItemContainer from './MenuItemContainer'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css';
import BusinessCard from '../Reutilizables/Business/BusinessCard'

const Menu = ({ session, theme, can, whatsAppStatus, APP_PROTOCOL, APP_DOMAIN, leadsCount, tasksCount, businesses, wsActive }) => {

  let mainRole = {}
  if (session.is_owner) {
    mainRole = {
      name: 'Owner',
      description: 'Persona que crea la empresa'
    }
  } else {
    mainRole = session.service_user.roles[0] ?? {
      name: 'Sin rol',
      description: 'El usuario aún no tiene un rol asignado'
    }
  }

  const currentBusiness = businesses.find(({ id }) => session.business_id == id)
  const otherBusinesses = businesses.filter(({ id }) => session.business_id != id)

  const idBirthday = moment(session.birthdate).format('MM-DD') == moment().format('MM-DD')

  return (<div className="left-side-menu py-0">
    <div className="h-100 pt-3 driver-js-menu" data-simplebar >
      {/* <div className="user-box text-center">
        <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}?v=${new Date(session.updated_at).getTime()}`} alt={session.name} title={session.name}
          className="rounded-circle img-thumbnail avatar-md" style={{ backgroundColor: 'unset', borderColor: '#98a6ad', objectFit: 'cover', objectPosition: 'center' }} />
        <div className="dropdown">
          <a href="#" className="user-name dropdown-toggle h5 mt-2 mb-1 d-block" data-bs-toggle="dropdown"
            aria-expanded="false" style={{ fontFamily: "'Comfortaa', sans-serif" }}>
            {session.name.split(' ')[0]} {session.lastname.split(' ')[0]} {idBirthday ? <Tippy content={`Feliz cumpleaños ${session.name}`} arrow={true}><i className=' fas fa-birthday-cake text-danger'></i></Tippy> : ''}
          </a>
          <div className="dropdown-menu user-pro-dropdown">


            <a href={`//${APP_DOMAIN}/profile`} className="dropdown-item notify-item">
              <i className="fe-user me-1"></i>
              <span>Mi perfil</span>
            </a>

            <a href={`//${APP_DOMAIN}/account`} className="dropdown-item notify-item">
              <i className="mdi mdi-account-key-outline me-1"></i>
              <span>Mi cuenta</span>
            </a>

            <a href="#" className="dropdown-item notify-item right-bar-toggle dropdown notification-list">
              <i className="fe-settings me-1"></i>
              <span>Configuracion</span>
            </a>

            <a href="#" className="dropdown-item notify-item" onClick={Logout}>
              <i className="fe-log-out me-1"></i>
              <span>Cerrar sesion</span>
            </a>

          </div>
        </div>

        <Tippy content={mainRole.description} arrow={true}>
          <p className="text-muted left-user-info" >{mainRole.name}</p>
        </Tippy>
      </div> */}
      <div className="user-box w-100 mb-2" style={{ padding: '0px 20px' }}>
        <div className='position-relative' style={{ width: 'max-content', height: 'max-content' }}>
          <img
            src={`//${APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}?v=${new Date(session.updated_at).getTime()}`}
            alt={session.name}
            title={session.name}
            className="rounded-circle img-thumbnail avatar-md mb-2"
            style={{
              padding: 0,
              backgroundColor: 'unset',
              // borderColor: '#98a6ad',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <span
            className={`d-block ${wsActive ? 'bg-success' : 'bg-danger'} position-absolute rounded-circle`}
            style={{ width: '12px', height: '12px', bottom: '16px', right: '0px' }}
          />
        </div>
        <div className="d-flex justify-content-between align-items-center gap-1">
          <div className="w-100" style={{ maxWidth: '70%' }}>
            <span
              className="user-name h4 mt-0 mb-0 d-block text-truncate"
              style={{
                fontFamily: "'Nunito Sans', sans-serif",
                color: theme == 'dark' ? '#fff' : undefined
              }}
            >
              {session.name.split(' ')[0]} {session.lastname.split(' ')[0]}
              {idBirthday &&
                <Tippy content={`Feliz cumpleaños ${session.name}`} arrow={true}>
                  <i className='fas fa-birthday-cake text-danger ms-1'></i>
                </Tippy>
              }
            </span>
            <small className="text-muted text-truncate d-block">{session.email}</small>
          </div>
          <Tippy content={mainRole.description} arrow={true}>
            <span className="badge bg-soft-primary text-primary rounded-pill">{mainRole.name}</span>
          </Tippy>
        </div>
      </div>

      <div className={`px-2 py-1 text-center ${otherBusinesses.length > 0 ? 'd-block' : ''}`} style={{ position: 'relative' }}>
        <span className="btn dropdown-toggle waves-effect waves-light d-flex align-items-center justify-content-between gap-1 mx-auto"
          data-bs-toggle={otherBusinesses.length > 0 ? "dropdown" : undefined}
          role="button" aria-haspopup="false" aria-expanded="false" style={{ borderColor: 'rgba(187, 187, 187, .25)', width: '200px', boxShadow: '0 0 8px rgba(187, 187, 187, .125)', borderRadius: '8px', cursor: otherBusinesses.length > 0 ? 'pointer' : 'default' }}>
          <div className="d-flex align-items-start">
            <img className="d-flex me-2 rounded-circle" src={`//${APP_DOMAIN}/api/logo/thumbnail/null`}
              alt={currentBusiness.name} height="32" />
            <div className="w-100 text-start">
              <h5 className={`m-0 font-14 text-primary text-truncate`} style={{ width: '115px' }}>{currentBusiness.name}</h5>
              <span className="font-12 mb-0">RUC: {currentBusiness.person.document_number}</span>
            </div>
          </div>
          {
            otherBusinesses.length > 0 &&
            <i className="mdi mdi-chevron-down"></i>
          }
        </span>
        {
          otherBusinesses.length > 0 &&
          <>
            <div className="dropdown-menu dropdown-menu-center profile-dropdown w-full">
              <div className="notification-list">
                {
                  otherBusinesses.sort((a, b) => {
                    return a.id == session.business_id ? -1 : 1
                  }).map((business, i) => {
                    return <BusinessCard key={`business-${i}`} {...business} session={session} APP_PROTOCOL={APP_PROTOCOL} APP_DOMAIN={APP_DOMAIN} />
                  })
                }
              </div>
              <div className="dropdown-divider"></div>
              <a href={`//${APP_DOMAIN}/businesses`} className="dropdown-item notify-item">
                <i className="fe-arrow-up-right"></i>
                <span>Otras empresas</span>
              </a>
            </div>
          </>
        }
      </div>

      <div id="sidebar-menu" className='show'>

        <ul id="side-menu">
          <li className="menu-title">Panel de navegacion</li>
          <MenuItemContainer title='KPIs' icon='mdi mdi-chart-donut-variant'>
            <MenuItem href="/home" icon='mdi mdi-account-multiple'>Leads</MenuItem>
            {can('dashboard', 'all', 'list') && <MenuItem href="/home/projects" icon='mdi mdi-page-next'>Proyectos</MenuItem>}
          </MenuItemContainer>

          {/* {can('dashboard', 'all', 'list') && <MenuItem href="/home" icon='mdi mdi-home'>Inicio</MenuItem>} */}

          {/* <MenuItem href="/calendar" icon='mdi mdi-calendar'>Calendario</MenuItem> */}
          <MenuItem href="/tasks" icon='mdi mdi-format-list-checks' badge={tasksCount > 0 ? tasksCount : ''}>Tareas</MenuItem>
          <MenuItem href="/chat" icon='mdi mdi-chat'>Chat</MenuItem>

          <MenuItemContainer title='Personas' icon='mdi mdi-account-group'>
            <MenuItem href="/leads" icon='mdi mdi-check-bold' badge={leadsCount > 0 ? leadsCount : ''}>Leads</MenuItem>
            {can('clients', 'all', 'list') && <MenuItem href="/clients" icon='mdi mdi-account-multiple'>Clientes</MenuItem>}
            <MenuItem id='archived-item' href="/archived" icon='mdi mdi-archive'>Archivados</MenuItem>
          </MenuItemContainer>

          {whatsAppStatus == 'ready' && <MenuItem href="/messages" icon='mdi mdi-forum'>Mensajes</MenuItem>}
          <MenuItem href="/products" icon='mdi mdi-layers'>Productos</MenuItem>
          {can('processes', 'root', 'all', 'list') && <MenuItem href="/processes" icon='mdi mdi-timeline-text'>Procesos</MenuItem>}

          {can('projects', 'root', 'all', 'list') && <MenuItemContainer title='Proyectos' icon='mdi mdi-page-next'>
            <MenuItem href="/projects" icon='mdi mdi-lan-pending'>En curso</MenuItem>
            <MenuItem href="/projects/done" icon='mdi mdi-check'>Entregados</MenuItem>
            <MenuItem href="/projects/archived" icon='mdi mdi-archive'>Archivados</MenuItem>
            <MenuItem href="/projects/taskboard" icon='mdi mdi-view-dashboard'>Cuadro de control</MenuItem>
          </MenuItemContainer>
          }
          {
            (can('users', 'root', 'all', 'list') || can('roles', 'root', 'all', 'list') || can('permissions', 'root', 'all', 'list')) &&
            <MenuItemContainer title='Usuarios y roles' icon='mdi mdi-account-lock'>
              {
                can('users', 'root', 'all', 'list') &&
                <MenuItem href="/users" icon='mdi mdi-account'>Usuarios</MenuItem>
              }
              {
                can('roles', 'root', 'all', 'list') &&
                <MenuItem href="/roles" icon='mdi mdi-account-convert'>Roles</MenuItem>
              }
              {/* {
                can('permissions', 'root', 'all', 'list') &&
                <MenuItem href="/permissions" icon='mdi mdi-account-check'>Permisos</MenuItem>
              } */}
            </MenuItemContainer>
          }

          <MenuItem href="/default-messages" icon='mdi mdi-message-bulleted'>Mensajes predeter...</MenuItem>
          <MenuItem href="/repository" icon='mdi mdi-database'>Repositorio</MenuItem>

          {
            can('apikeys', 'root', 'all', 'list') &&
            <MenuItemContainer title='Integraciones' icon='mdi mdi-api'>
              <MenuItem href="/webhooks" icon='mdi mdi-webhook'>Redes sociales</MenuItem>
              <MenuItem href="/apikeys" icon='mdi mdi-form-textbox'>Formulario Externo</MenuItem>
            </MenuItemContainer>
          }

          {
            (can('tables', 'root', 'all', 'list') || can('statuses', 'root', 'all', 'list') || can('types', 'root', 'all', 'list')) && <>
              <li className="menu-title">Menus del sistema</li>
              <MenuItemContainer title='Mantenimiento' icon='mdi mdi-application-cog'>
                {/* {
                  can('tables', 'root', 'all', 'list') &&
                  <MenuItem href='/tables' icon='mdi mdi-table'>Tablas</MenuItem>
                } */}
                {
                  can('statuses', 'root', 'all', 'list') &&
                  <MenuItem href='/statuses' icon='mdi mdi-format-list-checks'>Estados</MenuItem>
                }
                {
                  can('types', 'root', 'all', 'list') &&
                  <MenuItem href="/types" icon='mdi mdi-format-list-text'>Tipos</MenuItem>
                }
              </MenuItemContainer>
              {/* {
                can('views', 'root', 'all', 'list') &&
                <MenuItem href="/views" icon='mdi mdi-view-carousel'>Vistas</MenuItem>
              } */}
              {
                can('settings', 'root', 'all', 'list') &&
                <MenuItem href='/settings' icon='mdi mdi-cogs'>Configuraciones</MenuItem>
              }
            </>
          }
        </ul>

      </div>


      <div className="clearfix"></div>

    </div>
  </div>)
}

export default Menu