import { useEffect, useState } from "react";
import Global from "../../Utils/Global";
import ClientNotesCard from "../ClientNotes/ClientNotesCard";
import ClientNotesRest from "../../actions/ClientNotesRest";
import LaravelSession from "../../Utils/LaravelSession";
import Tippy from "@tippyjs/react";

const clientNotesRest = new ClientNotesRest()

const ContactDetails = ({ users = [], onAssign = () => { }, onOpenDetails = () => { }, ...contact }) => {
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
            <img
                src={`/api/whatsapp/profile/${contact.integration_user_id || contact.contact_phone}`}
                className="rounded-circle avatar-lg bg-light border-0 mb-3 mb-md-0 mb-xl-0 flex-shrink-0"
                alt={contact.contact_name}
                style={{ objectFit: 'cover' }}
                onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
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