import { useEffect, useState } from "react";
import Global from "../../Utils/Global";
import LeadAvatar from "../../components/LeadAvatar.jsx";
import ClientNotesCard from "../ClientNotes/ClientNotesCard";
import ClientNotesRest from "../../actions/ClientNotesRest";
import LaravelSession from "../../Utils/LaravelSession";
import Tippy from "@tippyjs/react";

const clientNotesRest = new ClientNotesRest()

const ContactDetails = ({ users = [], onAssign = () => { }, onOpenDetails = () => { }, chatStatuses = [], onLeadUpdate = () => {}, ...contact }) => {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(false)

    const getNotes = async () => {
        setLoading(true)
        const newNotes = await clientNotesRest.byClient(contact?.id);
        setNotes(newNotes ?? [])
        setLoading(false)
    }

    useEffect(() => {
        if (contact?.id) getNotes()
    }, [contact?.id])

    return <>
        <div className="contact-details d-flex flex-column gap-2 flex-md-row flex-xl-row align-items-center  rounded-4 shadow-sm mb-2 overflow-hidden">
            <LeadAvatar
                lead={contact}
                className="avatar-lg mb-3 mb-md-0 mb-xl-0 flex-shrink-0 me-md-2"
            />
            <div className="text-center text-md-start text-xl-start w-100">
                <div className="fw-bold fs-5 text-dark text-truncat">{contact.contact_name}</div>
                <div className="text-muted text-truncate">{contact.name}</div>
                <div className="text-muted small text-truncate">{contact.contact_email}</div>
                <div className="text-muted small text-truncate">{contact.contact_phone}</div>
            </div>
        </div>

        <div className="d-grid gap-2 mb-2">
            <button className="btn btn-primary btn-sm rounded-pill shadow-sm" onClick={() => onOpenDetails(contact)}>
                <i className="mdi mdi-eye me-1"></i> Ver detalles del lead
            </button>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-around mb-2">
            <div className="text-center flex-grow-1">
                <b className="d-block small text-muted">Estado de gestión</b>
                <button className="btn btn-sm w-100" style={{ backgroundColor: contact.status?.color || '#6c757d', color: '#fff', cursor: 'default' }}>
                    {contact.status?.name || 'Sin estado'}
                </button>
            </div>
            <div className="text-center flex-grow-1">
                <b className="d-block small text-muted">Etiqueta</b>
                <button className="btn btn-sm w-100" style={{ backgroundColor: contact.manage_status?.color || '#6c757d', color: '#fff', cursor: 'default' }}>
                    {contact.manage_status?.name || 'Sin estado'}
                </button>
            </div>
        </div>

        <div className="mb-2">
            <b className="d-block small text-muted mb-1 text-center">Calificación de Chat</b>
            <div className="dropdown w-100">
                <button 
                    className="btn btn-sm w-100 dropdown-toggle d-flex align-items-center justify-content-center gap-1 shadow-sm border text-truncate"
                    type="button"
                    data-bs-toggle="dropdown"
                    style={{ 
                        backgroundColor: contact.chat_status?.color || '#f8f9fa', 
                        color: contact.chat_status ? '#fff' : '#495057'
                    }}
                >
                    {contact.chat_status?.icon && (
                        <i className={`mdi ${contact.chat_status.icon.startsWith('mdi-') ? contact.chat_status.icon : `mdi-${contact.chat_status.icon}`}`}></i>
                    )}
                    <span>{contact.chat_status?.name || 'Calificar chat...'}</span>
                </button>
                <div className="dropdown-menu w-100 text-center scroll-hidden" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <button 
                        className="dropdown-item d-flex align-items-center justify-content-center gap-1"
                        onClick={() => onLeadUpdate(contact.id, null, 'chat_status')}
                    >
                        <i className="mdi mdi-close-circle-outline"></i>
                        <span>Sin calificar</span>
                    </button>
                    {chatStatuses.map(status => (
                        <button 
                            key={status.id}
                            className="dropdown-item d-flex align-items-center justify-content-center gap-1"
                            onClick={() => onLeadUpdate(contact.id, status.id, 'chat_status')}
                            style={{ borderLeft: `4px solid ${status.color}` }}
                        >
                            {status.icon && (
                                <i className={`mdi ${status.icon.startsWith('mdi-') ? status.icon : `mdi-${status.icon}`}`} style={{ color: status.color }}></i>
                            )}
                            <span>{status.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-2 bg-light rounded mb-2 border">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mt-0 mb-0 font-14">Atendido por:</h5>
                <div className="dropdown">
                    <button className="btn btn-xs btn-soft-primary rounded-pill dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        {contact.assigned_to ? 'Reasignar' : 'Asignar'} <i className="mdi mdi-chevron-down"></i>
                    </button>
                    <div className="dropdown-menu dropdown-menu-end scroll-hidden" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {users.map(user => (
                            <button
                                key={user.id}
                                className={`dropdown-item d-flex align-items-center gap-2 ${contact.assigned_to === user.service_user.id ? 'active' : ''}`}
                                onClick={() => onAssign(contact.id, user.service_user.id)}
                            >
                                <img
                                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                                    className="rounded-circle"
                                    width="20"
                                    height="20"
                                    onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                                />
                                <span>{user.name} {user.lastname}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {contact.assigned_to ? (
                <div className="d-flex align-items-start">
                    <img className="d-flex me-2 rounded-circle"
                        src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${contact.assigned?.relative_id}`}
                        onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                        alt={contact.assigned?.fullname} height="32" />
                    <div className="w-100 overflow-hidden">
                        <h5 className="m-0 font-14 text-truncate">{contact.assigned?.fullname}</h5>
                        <span className="font-12 mb-0 text-truncate d-block text-muted">{contact.assigned?.email}</span>
                    </div>
                </div>
            ) : (
                <div className="text-center py-1">
                    <i className="text-muted small">Sin asignar</i>
                </div>
            )}
        </div>

        <hr className="mt-0 mb-2" />
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="my-0">Actividad reciente</h5>
        </div>
        {loading ? (
            <div className="placeholder-glow" >
                <div className="placeholder mb-2 w-100 rounded" style={{ height: 70 }}></div>
                <div className="placeholder mb-2 w-100 rounded" style={{ height: 140 }}></div>
            </div>
        ) : (
            notes.length > 0 ? (
                notes.sort((a, b) => b.created_at > a.created_at ? 1 : -1).slice(0, 5).map((note, i) => {
                    return <ClientNotesCard key={`note-${i}`} {...note} showOptions={false} extended={false} />
                })
            ) : (
                <div className="text-center py-3">
                    <i className="mdi mdi-note-text-outline mdi-24px text-muted d-block"></i>
                    <span className="text-muted small">Sin notas registradas</span>
                </div>
            )
        )}
    </>
}
export default ContactDetails