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

    return (
        <li className={`${fromMe ? 'odd' : ''} ${marginTop || forceAfter ? '' : 'hide-after'}`} style={{ marginBottom: isLast ? '0px' : '24px', marginTop: marginTop ? '12px' : '2px' }}>
            <div className="message-list">
                <div className="conversation-text">{messageCard}</div>
            </div>
        </li>
    )
}

export default MessageCard