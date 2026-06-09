import AnyMessage from "../Messages/AnyMessage"
import AudioMessage from "../Messages/AudioMessage"
import DocumentMessage from "../Messages/DocumentMessage"
import ImageMessage from "../Messages/ImageMessage"

const MessageCard = ({ index, forceAfter, message, isLast = false, fromMe, marginTop, theme }) => {
    let content = message.message?.replace(/\{\{.*?\}\}/gs, '') || ''
    let attachment = ''
    if (content.startsWith('/attachment:')) {
        attachment = content.split('\n')[0]
        content = content.replace(attachment, '')
    }
    if (message.role == 'Form') {
        return (
            <li key={index}>
                <div className="chat-day-title mt-3 mb-0">
                    <small className="title badge badge-soft-dark rounded-pill">{content}</small>
                </div>
            </li>
        )
    }

    let messageCard = null
    if (content.startsWith('/audio:')) {
        messageCard = <AudioMessage
            fromMe={fromMe}
            theme={theme}
            url={content.replace('/audio:', `/storage/images/whatsapp/`)}
            time={moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
        />
    } else if (content.startsWith('/image:')) {
        messageCard = <ImageMessage
            fromMe={fromMe}
            theme={theme}
            url={content.replace('/image:', `/storage/images/whatsapp/`).split('\n')[0]}
            caption={content.split('\n').slice(1).join('\n') || ''}
            time={moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
        />
    } else if (content.startsWith('/sticker:')) {
        messageCard = (
            <div style={{ padding: '4px', position: 'relative' }}>
                <img
                    src={content.replace('/sticker:', `/storage/images/whatsapp/`)}
                    alt="Sticker"
                    style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'contain'
                    }}
                />
                <span className="time mt-0 d-block text-muted" style={{ fontSize: '10px', textAlign: 'right', marginTop: '4px' }}>
                    {moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
                </span>
            </div>
        )
    } else if (content.startsWith('/location:')) {
        const parts = content.replace('/location:', '').split(',');
        const latitude = parts[0] || '';
        const longitude = parts[1] || '';
        const label = parts.slice(2).join(',') || 'Ubicación compartida';
        
        messageCard = (
            <div className={`ctext-wrap d-flex flex-column ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`} style={{ minWidth: '240px', maxWidth: '320px', padding: '10px', borderRadius: '8px', boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px' }}>
                <div className="d-flex align-items-center mb-2">
                    <span className="badge rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#ea5455', width: '36px', height: '36px', flexShrink: 0 }}>
                        <i className="mdi mdi-map-marker text-white" style={{ fontSize: '18px' }}></i>
                    </span>
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <h6 className="my-0 fw-bold text-truncate" style={{ fontSize: '13px', color: theme === 'dark' ? '#fff' : '#495057' }}>Ubicación</h6>
                        <small className="text-muted text-truncate d-block" style={{ fontSize: '11px' }}>{label}</small>
                    </div>
                </div>
                <a 
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-xs btn-outline-danger w-100 rounded-pill d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '11px', padding: '4px 0' }}
                >
                    <i className="mdi mdi-google-maps"></i> Ver en Google Maps
                </a>
                <span className="time mt-2 d-block text-muted text-end" style={{ fontSize: '10px' }}>
                    {moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
                </span>
            </div>
        );
    } else if (content.startsWith('/contact:')) {
        const parts = content.replace('/contact:', '').split(',');
        const name = parts[0] || 'Contacto';
        const phone = parts.slice(1).join(',') || '';
        
        messageCard = (
            <div className={`ctext-wrap d-flex flex-column ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`} style={{ minWidth: '240px', maxWidth: '320px', padding: '10px', borderRadius: '8px', boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px' }}>
                <div className="d-flex align-items-center mb-2">
                    <span className="badge rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#7F66FF', width: '36px', height: '36px', flexShrink: 0 }}>
                        <i className="mdi mdi-account text-white" style={{ fontSize: '18px' }}></i>
                    </span>
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <h6 className="my-0 fw-bold text-truncate" style={{ fontSize: '13px', color: theme === 'dark' ? '#fff' : '#495057' }}>{name}</h6>
                        <small className="text-muted text-truncate d-block" style={{ fontSize: '11px' }}>{phone}</small>
                    </div>
                </div>
                <a 
                    href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-xs btn-outline-primary w-100 rounded-pill d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '11px', padding: '4px 0' }}
                >
                    <i className="mdi mdi-whatsapp"></i> Chatear por WhatsApp
                </a>
                <span className="time mt-2 d-block text-muted text-end" style={{ fontSize: '10px' }}>
                    {moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
                </span>
            </div>
        );
    } else if (content.startsWith('/document:')) {
        messageCard = <DocumentMessage
            fromMe={fromMe}
            theme={theme}
            url={content.replace('/document:', `/storage/images/whatsapp/`).split('\n')[0]}
            mask={message.mask}
            caption={content.split('\n').slice(1).join('\n') || ''}
            time={moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
        />
    } else if (content.startsWith('/unsupported:') || content.startsWith('[Media no soportada:') || content.startsWith('[Media recibida: unsupported')) {
        let details = '';
        if (content.startsWith('/unsupported:')) {
            details = content.replace('/unsupported:', '');
        } else if (content.startsWith('[Media no soportada:')) {
            details = content.replace('[Media no soportada:', '').replace(/\]$/, '');
        } else {
            details = content.replace('[Media recibida:', '').replace(/\]$/, '');
        }
        
        messageCard = (
            <div className={`ctext-wrap d-flex align-items-center gap-2 ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`} 
                 style={{ 
                     boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px',
                     padding: '8px 12px',
                     minWidth: '240px'
                 }}
                 title={details || 'Mensaje no soportado por Meta'}
            >
                <i className="mdi mdi-information-outline text-warning" style={{ fontSize: '18px', flexShrink: 0 }}></i>
                <div style={{ flexGrow: 1, textAlign: 'left', lineHeight: '1.4', fontStyle: 'italic', fontSize: '13px' }}>
                    <span>Mensaje y/o archivo no soportado por Meta!</span>
                </div>
                <span className="time ms-2 text-muted" style={{ fontSize: '10px', alignSelf: 'flex-end', marginLeft: 'auto', flexShrink: 0 }}>
                    {moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
                </span>
            </div>
        );
    } else {
        messageCard = <AnyMessage
            fromMe={fromMe}
            theme={theme}
            content={content}
            attachment={attachment}
            time={moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
            campaign={message.campaign}
        />
    }

    let errorData = null
    if (message.prompt) {
        try {
            const parsed = JSON.parse(message.prompt)
            if (parsed && parsed.status === 'failed') {
                errorData = parsed
            }
        } catch (e) {
            // Ignorar si no es JSON
        }
    }

    return (
        <li className={`${fromMe ? 'odd' : ''} ${marginTop || forceAfter ? '' : 'hide-after'}`} style={{ marginBottom: isLast ? '0px' : '24px', marginTop: marginTop ? '12px' : '2px' }}>
            <div className="message-list">
                <div className="conversation-text">{messageCard}</div>
            </div>
            {errorData && (
                <div className="text-danger small mt-1 d-flex flex-column align-items-end" style={{ fontSize: '11px', lineHeight: '1.3', paddingRight: fromMe ? '12px' : '0' }}>
                    <div className="d-flex align-items-center gap-1">
                        <i className="mdi mdi-alert-circle font-14"></i>
                        <span>No enviado: {Number(errorData.error_code) === 131042 ? 'Falta método de pago en Meta' : errorData.error_message}</span>
                    </div>
                    {errorData.href && (
                        <a href={errorData.href} target="_blank" rel="noopener noreferrer" className="text-decoration-underline text-danger mt-1 fw-bold" style={{ fontSize: '10px' }}>
                            <i className="mdi mdi-credit-card-outline me-1"></i>Configurar pago en Meta
                        </a>
                    )}
                </div>
            )}
        </li>
    )
}

export default MessageCard