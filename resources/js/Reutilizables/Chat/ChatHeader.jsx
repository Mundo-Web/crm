import { useEffect, useState } from "react";
import Global from "../../Utils/Global";

const ChatHeader = ({ contact, contactDetails, setContactDetails, loading, theme }) => {
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
                    <img
                        src={`/api/whatsapp/profile/${contact.integration_user_id || contact.contact_phone}`}
                        className="rounded-circle avatar-sm bg-light me-2"
                        alt={contact.contact_name}
                        style={{ padding: 0, border: 'none' }}
                        onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                    />
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
                        {(() => {
                            const service = contact.integration?.meta_service || contact.origin?.toLowerCase();
                            const isWhatsApp = service !== 'messenger' && service !== 'instagram';
                            
                            if (!isWhatsApp) return null;

                            const lastHumanMicro = contact.last_human_message_microtime;
                            const lastHumanMs = lastHumanMicro ? Math.floor(lastHumanMicro / 1000) : 0;
                            
                            if (lastHumanMs === 0) {
                                return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(234, 84, 85, 0.12)', color: '#ea5455', borderColor: 'rgba(234, 84, 85, 0.24)' }}>
                                        <i className="mdi mdi-alert-circle-outline me-1"></i>Si inicia conversación se cobrará
                                    </span>
                                );
                            }
                            
                            const isCampaign = !!contact.campaign_id;
                            const msInWindow = isCampaign ? 72 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                            const expiresAt = lastHumanMs + msInWindow;
                            const remainingMs = expiresAt - now;
                            
                            if (remainingMs > 0) {
                                const hours = Math.floor(remainingMs / (3600 * 1000));
                                const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
                                const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
                                const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                                
                                return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)' }}>
                                        {isCampaign ? (
                                            <><i className="mdi mdi-bullhorn-outline me-1"></i>Anuncio 72h: {formattedTime}</>
                                        ) : (
                                            <><i className="mdi mdi-clock-outline me-1"></i>24h: {formattedTime}</>
                                        )}
                                    </span>
                                );
                            } else {
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