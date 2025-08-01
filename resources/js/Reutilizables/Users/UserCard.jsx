
import { useState } from "react"
import Global from "../../Utils/Global"
import Tippy from "@tippyjs/react"

const UserCard = ({ roles, match, ...user }) => {
    const [sending, setSending] = useState(false)

    const onResendInvitation = async () => {
        setSending(true)
        const result = await atalayaUsersRest.invite({ match, email: user.email })
        setSending(false)
        console.log(result)
        // if (!status) return toast(result?.message ?? 'Ocurrió un error inesperado', { icon: <i className='mdi mdi-alert text-danger' /> })
    }

    const role = user.service_user?.roles?.[0] ?? {
        name: user.is_owner ? 'Owner' : 'Sin rol',
        description: 'El usuario no tiene un rol asignado'
    }
    return <div key={`user-${user.id}`} className="card mb-0" style={{ width: '360px' }}>
        <div className="card-body widget-user">
            <div className="d-flex align-items-center gap-2 w-100">
                <div className="flex-shrink-0 avatar-lg">
                    <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`} className="img-fluid rounded-circle" alt="user" />
                </div>
                <div className='flex-grow-1'>
                    <div className="overflow-hidden" style={{ width: '228px' }}>
                        <h5 className="mt-0 mb-1 text-truncate">{user.name} {user.lastname}</h5>
                        <p className="d-inline-block text-muted mb-2 font-13 text-truncate w-100">{user.email}</p>
                    </div>
                    <div className='d-flex gap-1'>
                        {user.is_owner ? (
                            <div className="btn btn-white btn-sm">
                                <i className="mdi mdi-crown me-1 text-blue"></i>
                                Owner
                            </div>
                        ) : (
                            <div className="btn-group">
                                <button className="btn btn-white btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    {role.name} <i className="mdi mdi-chevron-down"></i>
                                </button>
                                <div className="dropdown-menu">
                                    {roles.map((role, i) => (
                                        <Tippy key={i} content={`Asignar rol ${role.name}`}>
                                            <a className="dropdown-item" href="#" onClick={() => onAssignRoleClicked(role, user)}>
                                                <i className='mdi mdi-account-convert me-2'></i>
                                                {role.name}
                                            </a>
                                        </Tippy>
                                    ))}
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" href="#">
                                        <i className='mdi mdi-plus me-2'></i>
                                        Nuevo rol
                                    </a>
                                </div>
                            </div>
                        )}
                        {
                            !user.invitation_accepted &&
                            <Tippy content="Reenviar invitación">
                                <button className='btn btn-sm btn-white rounded-pill' onClick={() => onResendInvitation(user)} disabled={sending}>
                                    {
                                        sending
                                            ? <i className="mdi mdi-loading mdi-spin" />
                                            : <i className='mdi mdi-email-send text-primary'></i>
                                    }
                                </button>
                            </Tippy>
                        }
                        {
                            !user.is_owner &&
                            <Tippy content="Eliminar usuario">
                                <button className='btn btn-sm btn-white rounded-pill' onClick={() => onDeleteClicked(user)}>
                                    <i className='mdi mdi-delete text-danger'></i>
                                </button>
                            </Tippy>
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
}
export default UserCard