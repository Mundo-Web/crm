import Global from "../../Utils/Global"
import HtmlContent from "../../Utils/HtmlContent"
import wa2html from "../../Utils/wa2html"
import AudioMessage from "../Messages/AudioMessage"
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
    }

    return (
        <li className={`${fromMe ? 'odd' : ''} ${marginTop || forceAfter ? '' : 'hide-after'}`} style={{ marginBottom: isLast ? '0px' : '24px', marginTop: marginTop ? '12px' : '2px' }}>
            <div className="message-list">
                <div className="conversation-text">
                    {
                        messageCard ?? <div className={`ctext-wrap ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`} style={{
                            boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px',
                            padding: '6px 8px'
                        }}>
                            {message.campaign && (
                                <div className="rounded p-2 mb-2" style={{ backgroundColor: 'rgba(240, 240, 240, 0.125)', cursor: message.campaign.link ? 'pointer' : 'default', maxWidth: '240px' }}
                                    onClick={() => {
                                        if (message.campaign.link) window.open(message.campaign.link, '_blank')
                                    }}>
                                    <div className="d-flex gap-1" style={{ maxWidth: '100%' }}>
                                        <div className="fw-bold">{message.campaign.code}</div>
                                        <div className="small text-truncate">{message.campaign.title}</div>
                                    </div>
                                    <small className="d-block text-truncate" style={{ maxWidth: 300 }}>{message.campaign.link}</small>
                                </div>
                            )}
                            {attachment && (
                                <>
                                    <img src={attachment.replace('/attachment:', '')} className="mb-1" alt="attachment"
                                        style={{
                                            minWidth: '300px',
                                            width: '100%',
                                            maxWidth: '100%',
                                            minHeight: '200px',
                                            maxHeight: '300px',
                                            borderRadius: '4px',
                                            objectFit: 'cover',
                                        }}
                                        onError={e => {
                                            const img = e.target
                                            if (img && img.parentNode) {
                                                img.style.display = 'none'
                                            }
                                        }} />
                                    <div className="d-flex justify-content-end">
                                        <a className="btn btn-xs btn-light mb-1 text-nowrap d-flex text-end" href={attachment.replace('/attachment:', '')} target="_blank" rel="noreferrer" download>
                                            <i className="mdi mdi-download me-1"></i>
                                            <span>Descargar adjunto</span>
                                        </a>
                                    </div>
                                    {
                                        !content.trim() &&
                                        <span className="time mt-0 float-end" style={{ fontSize: '10px', marginLeft: '6px', marginTop: '8px !important' }}>{moment(message.created_at).subtract(5, 'hours').format('HH:mm')}</span>
                                    }
                                </>
                            )}
                            {
                                content.trim() &&
                                <HtmlContent className="text-start font-14" html={wa2html(content + `<span class="time mt-0 float-end" style="font-size: 10px; margin-left: 6px; margin-top: 8px !important">${moment(message.created_at).subtract(5, 'hours').format('HH:mm')}</span>`)} />
                            }
                        </div>
                    }
                </div>
            </div>
        </li>
    )
}

export default MessageCard