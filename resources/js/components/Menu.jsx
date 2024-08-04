import React from 'react'
import Logout from '../actions/Logout'
import MenuItem from './MenuItem'
import MenuItemContainer from './MenuItemContainer'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css';

const Menu = ({ session, can, presets, APP_DOMAIN }) => {
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

  const idBirthday = moment(session.birthdate).format('MM-DD') == moment().format('MM-DD')

  return (<div className="left-side-menu">
    <div className="h-100" data-simplebar>
      <div className="user-box text-center">
        <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${session.relative_id}?v=${new Date(session.updated_at).getTime()}`} alt={session.name} title={session.name}
          className="rounded-circle img-thumbnail avatar-md" style={{ backgroundColor: 'unset', borderColor: '#98a6ad', objectFit: 'cover', objectPosition: 'center' }} />
        <div className="dropdown">
          <a href="#" className="user-name dropdown-toggle h5 mt-2 mb-1 d-block" data-bs-toggle="dropdown"
            aria-expanded="false">{session.name} {session.lastname} {idBirthday ? <Tippy content={`Feliz cumpleaños ${session.name}`} arrow={true}><i className=' fas fa-birthday-cake text-danger'></i></Tippy> : ''}</a>
          <div className="dropdown-menu user-pro-dropdown">


            <a href="/profile" className="dropdown-item notify-item">
              <i className="fe-user me-1"></i>
              <span>Mi perfil</span>
            </a>

            <a href="/account" className="dropdown-item notify-item">
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

        <ul className="list-inline">
          <li className="list-inline-item">
            <Tippy content="Configuracion">
              <a href="#" className="text-muted left-user-info right-bar-toggle dropdown notification-list">
                <i className="mdi mdi-cog"></i>
              </a>
            </Tippy>
          </li>

          <li className="list-inline-item">
            <Tippy content="Cerrar sesion">
              <a href="#" className="text-danger" onClick={Logout}>
                <i className="mdi mdi-power"></i>
              </a>
            </Tippy>
          </li>
        </ul>
      </div>


      <div id="sidebar-menu" className='show'>

        <ul id="side-menu">
          <li className="menu-title">Panel de navegacion</li>
          <MenuItem href="/home" icon='mdi mdi-home'>Inicio</MenuItem>
          {
            can('clients', 'root', 'all', 'list') &&
            <MenuItemContainer title='Personas' icon='mdi mdi-account-group'>
              <MenuItem href="/clients" icon='mdi mdi-account-group'>Clientes</MenuItem>
              <MenuItem href="/leads" icon='mdi mdi-texture'>Leads</MenuItem>
              {/* {
                presets.filter(x => x.table.name == 'Clientes').map((view, i) => {
                  return <MenuItem key={`menu-${i}`} href={`/clients/${view.id}`} icon='mdi mdi-page-layout-sidebar-left'>{view.name}</MenuItem>
                })
              } */}
            </MenuItemContainer>
          }

          {
            can('projects', 'root', 'all', 'list') &&
            <MenuItemContainer title='Proyectos' icon='mdi mdi-page-next'>
              <MenuItem href="/projects" icon='mdi mdi-page-layout-sidebar-left'>Todos</MenuItem>
              {
                presets.filter(x => x.table.name == 'Proyectos').map((view, i) => {
                  return <MenuItem key={`menu-${i}`} href={`/projects/${view.id}`} icon='mdi mdi-page-layout-sidebar-left'>{view.name}</MenuItem>
                })
              }
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

          {
            can('apikeys', 'all', 'list') &&
            <MenuItem href="/apikeys" icon='mdi mdi-account-convert'>API Keys</MenuItem>
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