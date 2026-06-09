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
    } else if (content.startsWith('/document:')) {
        messageCard = <DocumentMessage
            fromMe={fromMe}
            theme={theme}
            url={content.replace('/document:', `/storage/images/whatsapp/`).split('\n')[0]}
            mask={message.mask}
            caption={content.split('\n').slice(1).join('\n') || ''}
            time={moment(message.created_at).subtract(5, 'hours').format('HH:mm')}
        />
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
                {errorData && (
                    <div className="text-danger small mt-1 d-flex flex-column align-items-end" style={{ fontSize: '11px', lineHeight: '1.3' }}>
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
            </div>
        </li>
    )
}

export default MessageCard