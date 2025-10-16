import { useRef, useState } from "react"
import HtmlContent from "../../Utils/HtmlContent"
import wa2html from "../../Utils/wa2html"
import WhatsAppRest from "../../actions/WhatsAppRest"

const whatsAppRest = new WhatsAppRest()

const ChatContent = ({ messages, containerRef, lead }) => {
    const inputMessageRef = useRef()

    const [isSending, setIsSending] = useState(false)

    const onMessageSubmit = async (e) => {
        e.preventDefault()
        if (!lead) return
        const message = inputMessageRef.current.value.trim()
        if (!message) return
        setIsSending(true)
        await whatsAppRest.send(lead.id, message)
        inputMessageRef.current.value = ''
        setIsSending(false)
    }

    return <>
        <ul ref={containerRef} className="conversation-list slimscroll" style={{ height: 'calc(100vh - 345px)', overflowY: 'auto', scrollBehavior: 'smooth' }}>
            {messages.map((message, idx) => {
                const fromMe = message.role !== 'Human'
                let content = message.message?.replace(/\{\{.*?\}\}/gs, '') || ''
                let attachment = ''
                if (content.startsWith('/attachment:')) {
                    attachment = content.split('\n')[0]
                    content = content.replace(attachment, '')
                }
                if (message.role == 'Form') {
                    return <li>
                        <div class="chat-day-title" bis_skin_checked="1">
                            <small class="title badge badge-soft-dark rounded-pill">{content}</small>
                        </div>
                    </li>
                }
                return <li key={idx} className={fromMe ? 'odd' : ''}>
                    <div className="message-list">
                        <div className="conversation-text">
                            <div className="ctext-wrap">
                                {attachment && (
                                    <>
                                        <img src={attachment.replace('/attachment:', '')}
                                            className="mb-1"
                                            alt='attachment'
                                            style={{
                                                minWidth: '300px',
                                                width: '100%',
                                                maxWidth: '100%',
                                                minHeight: '200px',
                                                maxHeight: '300px',
                                                borderRadius: '4px',
                                                objectFit: 'cover',
                                            }}
                                            onError={e => $(e.target).remove()}
                                        />
                                        <div className="d-flex justify-content-end">
                                            <a
                                                className="btn btn-xs btn-white mb-1 text-nowrap d-flex text-end"
                                                href={attachment.replace('/attachment:', '')}
                                                target="_blank"
                                                rel="noreferrer"
                                                download
                                            >
                                                <i className="mdi mdi-download me-1"></i>
                                                <span>Descargar adjunto</span>
                                            </a>
                                        </div>
                                    </>
                                )}
                                <HtmlContent className='text-start' html={wa2html(content)} />
                            </div>
                            <span className="time">{moment(message.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                        </div>
                    </div>
                </li>
            })}
        </ul>
        <form className="p-3 conversation-input border-top" onSubmit={onMessageSubmit}>
            <div className="row">
                <div className="col">
                    <textarea
                        ref={inputMessageRef}
                        className="form-control w-100"
                        placeholder="Ingrese su mensaje aquí"
                        rows={1}
                        style={{ minHeight: 27, fieldSizing: 'content' }}
                        disabled={isSending}
                        required
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (inputMessageRef.current.value.trim()) {
                                    onMessageSubmit(e)
                                }
                            }
                        }}
                    />
                </div>
                <div className="col-auto">
                    <button type="submit"
                        className="btn btn-primary chat-send width-md waves-effect waves-light"
                        disabled={isSending}>
                        {isSending
                            ? <i className="mdi mdi-spin mdi-loading"></i>
                            : <i className="mdi mdi-send"></i>}
                    </button>
                </div>
            </div>
        </form>
    </>
}

export default ChatContent