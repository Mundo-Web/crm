
import React from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import UsersRest from './actions/UsersRest.js'
import Adminto from './components/Adminto'
import Tippy from '@tippyjs/react'

const usersRest = new UsersRest()

const Users = ({ can, users, roles, APP_DOMAIN }) => {

  const onDeleteClicked = async (id) => {
    const result = await UsersRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onAssignRoleClicked = async (role, user) => {
    const result = await usersRest.assignRole({
      role: role.id,
      user: user.id
    })
    if (!result) return

    location.reload()
  }

  return (<>
    <div className='d-flex flex-wrap align-items-center justify-content-center' style={{ minHeight: 'calc(100vh - 135px)', maxHeight: 'max-content' }}>
      <div className='d-flex flex-wrap align-items-center justify-content-center gap-2'>
        {
          users.map((user, i) => {
            const role = user.service_user?.roles?.[0] ?? {
              name: 'Sin rol',
              description: 'El usuario no tiene un rol asignado'
            }
            return <div key={`user-${i}`} className="card mb-0" style={{ width: '360px' }}>
              <div className="card-body widget-user">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0 avatar-lg me-3">
                    <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`} className="img-fluid rounded-circle" alt="user" />
                  </div>
                  <div>
                    <div className="flex-grow-1 overflow-hidden" style={{ width: '215px' }}>
                      <h5 className="mt-0 mb-1">{user.name} {user.lastname}</h5>
                      <p className="text-muted mb-2 font-13 text-truncate">{user.email}</p>
                    </div>
                    <div>
                      <div className="btn-group">
                        <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                          {role.name} <i className="mdi mdi-chevron-down"></i>
                        </button>
                        <div className="dropdown-menu" >
                          {
                            roles.map((role, i) => {
                              return <Tippy content={`Asignar rol ${role.name}`}>
                                <a className="dropdown-item" href="#" onClick={() => onAssignRoleClicked(role, user)}>
                                  <i className='mdi mdi-account-convert me-2'></i>
                                  {role.name}
                                </a>
                              </Tippy>
                            })
                          }
                          <div className="dropdown-divider"></div>
                          <a className="dropdown-item" href="#">
                            <i className='mdi mdi-plus me-2'></i>
                            Nuevo rol
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          })
        }
      </div>
    </div>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Usuarios'>
      <Users {...properties} />
    </Adminto>
  );
})