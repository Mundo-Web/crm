import React, { useRef, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import UsersRest from './actions/UsersRest.js'
import AtalayaUsersRest from './actions/Atalaya/UsersRest.js'
import Adminto from './components/Adminto'
import Tippy from '@tippyjs/react'
import Modal from './components/Modal.jsx'
import { toast } from 'sonner'

const atalayaUsersRest = new AtalayaUsersRest()
const usersRest = new UsersRest()

const Users = (properties) => {
  const { users, roles, APP_DOMAIN } = properties

  // Referencias de elementos
  const modalRef = useRef()
  const searchTimeoutRef = useRef(null)

  // Variables de estados
  const [found, setFound] = useState([])
  const [search, setSearch] = useState('')
  const [emailValid, setEmailValid] = useState(null);
  const [searching, setSearching] = useState(false)

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

  const handleSearch = async (value) => {
    const { data, summary } = await atalayaUsersRest.paginate({
      searchValue: value
    })
    setSearching(false)
    setFound(data)
    setEmailValid(summary?.isValid ?? null)
  }

  const onSearch = (e) => {
    const value = e.target.value
    setSearch(value)
    if (searchTimeoutRef.current) {
      atalayaUsersRest.controller.abort('Nothing')
      clearTimeout(searchTimeoutRef.current)
    }
    setFound([])
    setSearching(false)
    if (!value || value.length < 3) return
    setSearching(true)
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  const onInviteClicked = async (email) => {
    const { status, message } = await atalayaUsersRest.invite(email)
    if (!status) return toast(message, { icon: <i className='mdi mdi-alert text-danger' /> })
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (<>
    <Adminto {...properties} title='Usuarios' floatEnd={<button className='btn btn-sm btn-primary' onClick={() => $(modalRef.current).modal('show')}>
      <i className='mdi mdi-account-plus me-1'></i>
      Invitar
    </button>}>
      <div className='d-flex flex-wrap align-items-center justify-content-center' style={{ minHeight: 'calc(100vh - 135px)', maxHeight: 'max-content' }}>
        <div className='d-flex flex-wrap align-items-center justify-content-center gap-2'>
          {
            users.map((user, i) => {
              const role = user.service_user?.roles?.[0] ?? {
                name: user.is_owner ? 'Owner' : 'Sin rol',
                description: 'El usuario no tiene un rol asignado'
              }
              return <div key={`user-${i}`} className="card mb-0" style={{ width: '360px' }}>
                <div className="card-body widget-user">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0 avatar-lg me-2">
                      <img src={`//${APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`} className="img-fluid rounded-circle" alt="user" />
                    </div>
                    <div>
                      <div className="flex-grow-1 overflow-hidden" style={{ width: '215px' }}>
                        <h5 className="mt-0 mb-1 text-truncate">{user.name} {user.lastname}</h5>
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
      <Modal modalRef={modalRef} title='Invita usuarios' hideFooter onSubmit={(e) => e.preventDefault()} onClose={() => setSearch('')}>
        <input
          type="text"
          className='form-control'
          placeholder='Ingresa nombre o correo'
          value={search}
          onChange={onSearch}
        />
        {
          search.length < 3 ? <div className="text-center text-muted p-2 mt-2">
            Ingresa al menos 3 caracteres
          </div>
            : <>
              {searching ? (
                <div className="text-center p-2 mt-2">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted mb-0">Buscando usuarios...</p>
                </div>
              ) : found.length > 0 || emailValid ? (
                <div className='d-flex flex-column gap-2 mt-2'>
                  {found.map((user, i) => (
                    <div key={`found-${i}`} className="card border mb-0">
                      <div className="card-body p-2 d-flex align-items-center gap-2">
                        <img
                          src={`//${APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                          className="rounded-circle"
                          alt={user.name}
                          width="40"
                          height="40"
                        />
                        <div className="flex-grow-1">
                          <h5 className="mt-0 mb-1">{user.fullname}</h5>
                          <div className="text-muted">{user.email}</div>
                        </div>
                        <button className="btn btn-white btn-sm rounded-pill" onClick={() => onInviteClicked(user.email)}>
                          <i className="mdi mdi-account-plus"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {
                    emailValid === true && <div key={`found-${search}`} className="card border mb-0">
                      <div className="card-body p-2 d-flex align-items-center gap-2">
                        <img
                          src={`//${APP_DOMAIN}/api/profile/thumbnail/undefined`}
                          className="rounded-circle"
                          width="40"
                          height="40"
                        />
                        <div className="flex-grow-1">
                          <h5 className="mt-0 mb-1">{search.split('@')[0]}</h5>
                          <div className="text-muted">{search}</div>
                        </div>
                        <Tippy content='Invitar usuario a Atalaya'>
                          <button className="btn btn-white btn-sm rounded-pill" onClick={() => onInviteClicked(search)}>
                            <i className="mdi mdi-email-send"></i>
                          </button>
                        </Tippy>
                      </div>
                    </div>
                  }
                </div>
              ) : (
                search && (
                  <div className="card card-body p-2 mt-2 text-center mb-0">
                    No se encontraron resultados
                  </div>
                )
              )}
            </>
        }
      </Modal>
    </Adminto>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Users {...properties} />);
})