import React, { useRef, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import UsersRest from './actions/UsersRest.js'
import AtalayaUsersRest from './actions/Atalaya/UsersRest.js'
import Adminto from './components/Adminto'
import Tippy from '@tippyjs/react'
import Modal from './components/Modal.jsx'
import { toast } from 'sonner'
import { Cookies, Fetch } from 'sode-extend-react'
import Global from './Utils/Global.js'
import Swal from 'sweetalert2'
import InviteUserCard from './Reutilizables/Users/InviteUserCard.jsx'
import UserCard from './Reutilizables/Users/UserCard.jsx'

const atalayaUsersRest = new AtalayaUsersRest()
const usersRest = new UsersRest()

const Users = (properties) => {
  const { users, roles, APP_DOMAIN, match } = properties

  // Referencias de elementos
  const modalRef = useRef()
  const searchTimeoutRef = useRef(null)

  // Variables de estados
  const [found, setFound] = useState([])
  const [search, setSearch] = useState('')
  const [emailValid, setEmailValid] = useState(null);
  const [searching, setSearching] = useState(false)
  const onDeleteClicked = async (user) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: `${user.name} será eliminado de la gestión de ${Global.APP_NAME}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '¡Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    })

    if (!isConfirmed) return

    const result = await usersRest.delete(user.id)
    if (!result) return

    Swal.fire(
      '¡Eliminado!',
      'El usuario ha sido eliminado exitosamente.',
      'success'
    )

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
      <div className='d-flex flex-wrap align-items-center justify-content-center' style={{ minHeight: 'calc(100vh - 235px)', maxHeight: 'max-content' }}>
        <div className='d-flex flex-wrap align-items-center justify-content-center gap-2'>
          {
            users.map((user, i) => <UserCard key={`user-${i}`} {...user} roles={roles} match={match} />)
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
                  {found.map((user, i) => <InviteUserCard key={`found-${i}`} {...user} match={match} />)}
                  {
                    emailValid === true && <>
                    <InviteUserCard key={`found-${search}`} fullname={search.split('@')[0]} email={search} match={match} />
                    {/* <div key={`found-${search}`} className="card border mb-0">
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
                    </div> */}
                    </>
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