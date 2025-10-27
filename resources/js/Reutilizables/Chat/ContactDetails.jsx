import { useEffect, useState } from "react";
import Global from "../../Utils/Global";
import ClientNotesCard from "../ClientNotes/ClientNotesCard";
import ClientNotesRest from "../../actions/ClientNotesRest";
import LaravelSession from "../../Utils/LaravelSession";
import Tippy from "@tippyjs/react";

const clientNotesRest = new ClientNotesRest()

const ContactDetails = (contact) => {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(false)

    const getNotes = async () => {
        setLoading(true)
        const newNotes = await clientNotesRest.byClient(contact?.id);
        setNotes(newNotes ?? [])
        setLoading(false)
    }

    useEffect(() => {
        if (contact) getNotes()
    }, [contact])

    return <>
        <div className="contact-details d-flex flex-column gap-2 flex-md-row flex-xl-row align-items-center  rounded-4 shadow-sm mb-2 overflow-hidden">
            <img
                src={`/api/whatsapp/profile/${contact.contact_phone}`}
                className="rounded-circle avatar-lg bg-light border-0 mb-3 mb-md-0 mb-xl-0 flex-shrink-0"
                alt={contact.name}
                style={{ objectFit: 'cover' }}
                onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
            />
            <div className="text-center text-md-start text-xl-start w-100">
                <div className="fw-bold fs-5 text-dark text-truncat">{contact.contact_name}</div>
                <div className="text-muted text-truncate">{contact.name}</div>
                <div className="text-muted small text-truncate">{contact.contact_email}</div>
                <div className="text-muted small text-truncate">{contact.contact_phone}</div>
            </div>
            {/* Historial de actividades se mostrará aquí */}
        </div>
        <div className="d-flex flex-wrap gap-2 justify-content-around mb-2">
            <div className="text-center">
                <b className="d-block">Estado de gestión</b>
                <button className="btn" style={{ backgroundColor: contact.status?.color || '#6c757d', color: '#fff', cursor: 'default' }}>
                    {contact.status?.name || 'Sin estado'}
                </button>
            </div>
            <div className="text-center">
                <b className="d-block">Estado del lead</b>
                <button className="btn" style={{ backgroundColor: contact.manage_status?.color || '#6c757d', color: '#fff', cursor: 'default' }}>
                    {contact.manage_status?.name || 'Sin estado'}
                </button>
            </div>
        </div>
        {
            contact.assigned_to && <div className="p-2 bg-light rounded mb-2">
                <h5 className="mt-0 mb-2">Atendido por:</h5>
                <div className="d-flex align-items-start" bis_skin_checked="1">
                    <img className="d-flex me-2 rounded-circle"
                        src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${contact.assigned.relative_id}`}
                        onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                        alt={contact.assigned.fullname} height="32" />
                    <div className="w-100 overflow-hidden" bis_skin_checked="1">
                        <h5 className="m-0 font-14 text-truncate">{contact.assigned.fullname}</h5>
                        <span className="font-12 mb-0 text-truncate d-block">{contact.assigned.email}</span>
                    </div>
                </div>
            </div>
        }
        <hr className="mt-0 mb-2" />
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="my-0">Actividad</h5>
            <Tippy content='Ver más'>
                <a href={`/leads/${contact.id}`} className="text-decoration-none">
                    <i className="mdi mdi-arrow-top-right"></i>
                </a>
            </Tippy>
        </div>
        {loading ? (
            <div className="placeholder-glow" >
                <div className="placeholder mb-2 w-100 rounded" style={{ height: 70 }}></div>
                <div className="placeholder mb-2 w-100 rounded" style={{ height: 140 }}></div>
            </div>
        ) : (
            notes.sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                return <ClientNotesCard key={`note-${i}`} {...note} showOptions={false} extended={false} />
            })
        )}
    </>
}
export default ContactDetails