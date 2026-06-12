import { useEffect, useState } from "react";
import Global from "../../Utils/Global";
import LeadAvatar from "../../components/LeadAvatar.jsx";

const ChatHeader = ({ contact, contactDetails, setContactDetails, loading, theme, chatStatuses = [], onLeadUpdate = () => {}, onDeleteChat = () => {} }) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!contact) return;
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [contact]);

    return (
        <div
            className={`card-header ${theme == 'light' ? 'bg-white' : 'bg-light'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => contact?.id && setContactDetails(contactDetails ? null : contact)}
        >
            <div className="d-flex align-items-center">
                {/* Avatar */}
                {!loading && contact && (
                    <LeadAvatar lead={contact} className="avatar-sm me-2" />
                )}
                {loading && (
                    <div className="placeholder-glow">
                        <div className="rounded-circle avatar-sm me-2 placeholder" style={{ width: 36, height: 36 }} />
                    </div>
                )}

                <div className={`flex-grow-1 ${loading ? 'placeholder-glow' : ''}`}>
                    <h5 className={`mt-0 mb-1 text-truncate ${loading ? 'placeholder col-3' : ''}`}>
                        {contact?.contact_name}
                    </h5>
                    <p className={`d-block font-13 text-muted mb-0 ${loading ? 'placeholder col-2' : ''}`}>
                        <i className="mdi mdi-phone me-1 font-11"></i>
                        {contact?.contact_phone}
                    </p>
                </div>

                {/* Badge and Arrow icon */}
                {!loading && contact && (
                    <div className="d-flex align-items-center gap-2 ms-2">
                        <button 
                            className="btn btn-sm btn-icon btn-light shadow-sm border"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat();
                            }}
                            title="Eliminar conversación"
                        >
                            <i className="mdi mdi-delete text-danger"></i>
                        </button>
                        <button 
                            className={`btn btn-sm btn-icon ${contact.is_pinned ? 'btn-primary' : 'btn-light'} shadow-sm border`}
                            style={{ transition: 'all 0.2s ease-in-out' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const icon = e.currentTarget.querySelector('i');
                                icon.style.transform = 'scale(0.5)';
                                setTimeout(() => {
                                    icon.style.transform = contact.is_pinned ? 'scale(1)' : 'scale(1.2)';
                                    setTimeout(() => icon.style.transform = 'scale(1)', 150);
                                }, 150);
                                onLeadUpdate(contact.id, !contact.is_pinned, 'is_pinned');
                            }}
                            title={contact.is_pinned ? "Desanclar chat" : "Anclar chat"}
                        >
                            <i 
                              className={`mdi mdi-pin${contact.is_pinned ? '-off' : ''}`}
                              style={{ transition: 'transform 0.15s ease-in-out', display: 'inline-block' }}
                            ></i>
                        </button>
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                            <button 
                                className="btn btn-sm dropdown-toggle d-flex align-items-center justify-content-center gap-1 shadow-sm border text-truncate"
                                type="button"
                                data-bs-toggle="dropdown"
                                style={{ 
                                    backgroundColor: contact.chat_status?.color || '#f8f9fa', 
                                    color: contact.chat_status ? '#fff' : '#495057',
                                    minWidth: '130px'
                                }}
                            >
                                {contact.chat_status?.icon && (
                                    <i className={`mdi ${contact.chat_status.icon.startsWith('mdi-') ? contact.chat_status.icon : `mdi-${contact.chat_status.icon}`}`}></i>
                                )}
                                <span>{contact.chat_status?.name || 'Calificar chat...'}</span>
                            </button>
                            <div className="dropdown-menu scroll-hidden" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <button 
                                    className="dropdown-item d-flex align-items-center gap-2"
                                    onClick={() => onLeadUpdate(contact.id, null, 'chat_status')}
                                >
                                    <i className="mdi mdi-close-circle-outline"></i>
                                    <span>Sin calificar</span>
                                </button>
                                {chatStatuses.map(status => (
                                    <button 
                                        key={status.id}
                                        className="dropdown-item d-flex align-items-center gap-2"
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

                        {(() => {
                            const service = contact.integration?.meta_service || contact.origin?.toLowerCase();
                            const isWhatsApp = service !== 'messenger' && service !== 'instagram';
                            
                            if (!isWhatsApp) return null;

                            const lastHumanMicro = contact.last_human_message_microtime;
                            let lastHumanMs = lastHumanMicro ? Math.floor(lastHumanMicro / 1000) : 0;
                            
                            if (lastHumanMs === 0) {
                                return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(234, 84, 85, 0.12)', color: '#ea5455', borderColor: 'rgba(234, 84, 85, 0.24)' }}>
                                        <i className="mdi mdi-alert-circle-outline me-1"></i>Si inicia conversación se cobrará
                                    </span>
                                );
                            }
                            
                            const msInWindow = 24 * 60 * 60 * 1000;
                            const expiresAt = lastHumanMs + msInWindow;
                            const remainingMs = expiresAt - now;
                            
                            if (remainingMs > 0) {
                                const hours = Math.floor(remainingMs / (3600 * 1000));
                                const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
                                const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
                                const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                                
                                return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)' }}>
                                        <><i className="mdi mdi-clock-outline me-1"></i>24h: {formattedTime}</>
                                    </span>
                                );
                            } else {
                                const isCampaign = !!contact.campaign_id;
                                const msIn72hWindow = 72 * 60 * 60 * 1000;
                                const expiresAt72h = lastHumanMs + msIn72hWindow;
                                const remaining72hMs = expiresAt72h - now;

                                if (isCampaign && remaining72hMs > 0) {
                                    const hours = Math.floor(remaining72hMs / (3600 * 1000));
                                    const minutes = Math.floor((remaining72hMs % (3600 * 1000)) / (60 * 1000));
                                    return (
                                        <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)' }}>
                                            <i className="mdi mdi-gift-outline me-1"></i>Plantilla gratis ({hours}h {minutes}m)
                                        </span>
                                    );
                                }

                                return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(234, 84, 85, 0.12)', color: '#ea5455', borderColor: 'rgba(234, 84, 85, 0.24)' }}>
                                        <i className="mdi mdi-alert-circle-outline me-1"></i>Si inicia conversación se cobrará
                                    </span>
                                );
                            }
                        })()}
                        <i className={`mdi mdi-24px mdi-chevron-double-${contactDetails ? 'right' : 'left'} text-muted`} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;