import { useRef, useState, useEffect } from "react"
import HtmlContent from "../../Utils/HtmlContent"
import wa2html from "../../Utils/wa2html"
import WhatsAppRest from "../../actions/WhatsAppRest"

const whatsAppRest = new WhatsAppRest()

const ChatContent = ({ messages, containerRef, lead, loading }) => {
    const inputMessageRef = useRef()
    const fileInputRef = useRef()
    const audioRef = useRef()

    const [isSending, setIsSending] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)
    const [messageText, setMessageText] = useState('')

    useEffect(() => {
        if (inputMessageRef.current) {
            inputMessageRef.current.value = messageText
        }
    }, [messageText])

    useEffect(() => {
        // Cleanup audio URL on unmount or when blob changes
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            const chunks = []
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                stream.getTracks().forEach(track => track.stop())
            }
            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error('Error accessing microphone:', err)
        }
    }

    const stopRecording = () => {
        setIsRecording(false)
    }

    const discardAudio = () => {
        setAudioBlob(null)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
    }

    const onMessageSubmit = async (e) => {
        e.preventDefault()
        if (!lead) return
        const text = messageText.trim()
        if (!text && !audioBlob) return

        setIsSending(true)
        if (audioBlob) {
            // TODO: implement audio upload
            console.warn('Audio upload not implemented yet')
        } else {
            await whatsAppRest.send(lead.id, text)
        }
        setMessageText('')
        setAudioBlob(null)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
        setIsSending(false)
    }

    const handleAttach = () => fileInputRef.current?.click()

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        // TODO: implement file upload
        console.warn('File upload not implemented yet')
        e.target.value = ''
    }

    const hasContent = () => messageText.trim() || audioBlob

    return (
        <div className="card-body p-0 position-relative border" style={{
            backgroundColor: 'var(--bs-body-bg)',
            backgroundImage: 'url(/assets/img/doodles.png)',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'contain',
            backgroundOpacity: 0.5
        }}>
            {loading ? (
                <div className="text-center py-4" style={{ height: 'calc(100vh - 260px)' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading messages...</span>
                    </div>
                    <p className="mt-2 mb-0 text-muted">Cargando mensajes...</p>
                </div>
            ) : <section className="d-flex flex-column" style={{ height: 'calc(100vh - 260px)' }}>
                <ul
                    ref={containerRef}
                    className="conversation-list slimscroll flex-grow-1 px-3 pt-3"
                    style={{ overflowY: 'auto', scrollBehavior: 'smooth' }}
                >
                    {messages.map((message, idx) => {
                        const fromMe = message.role !== 'Human'
                        let content = message.message?.replace(/\{\{.*?\}\}/gs, '') || ''
                        let attachment = ''
                        if (content.startsWith('/attachment:')) {
                            attachment = content.split('\n')[0]
                            content = content.replace(attachment, '')
                        }
                        if (message.role == 'Form') {
                            return (
                                <li key={idx}>
                                    <div className="chat-day-title">
                                        <small className="title badge badge-soft-dark rounded-pill">{content}</small>
                                    </div>
                                </li>
                            )
                        }
                        return (
                            <li key={idx} className={fromMe ? 'odd' : ''}>
                                <div className="message-list">
                                    <div className="conversation-text">
                                        <div className="ctext-wrap">
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
                                                        onError={e => $(e.target).remove()}/>
                                                    <div className="d-flex justify-content-end">
                                                        <a className="btn btn-xs btn-white mb-1 text-nowrap d-flex text-end" href={attachment.replace('/attachment:', '')} target="_blank" rel="noreferrer" download>
                                                            <i className="mdi mdi-download me-1"></i>
                                                            <span>Descargar adjunto</span>
                                                        </a>
                                                    </div>
                                                </>
                                            )}
                                            <HtmlContent className="text-start" html={wa2html(content)} />
                                        </div>
                                        <span className="time">{moment(message.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <form className="p-3 pt-0 conversation-input" onSubmit={onMessageSubmit}>
                    <div className="row g-2 align-items-end">
                        <div className="col-auto">
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleAttach}
                                disabled={isSending || isRecording}
                                title="Adjuntar archivo"
                                style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                            >
                                <i className="mdi mdi-paperclip"></i>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="d-none"
                                accept="image/*,video/*,.pdf,.doc,.docx"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="col">
                            {isRecording ? (
                                <div className="d-flex align-items-center justify-content-center bg-light rounded-pill" style={{ minHeight: '38px' }}>
                                    <span className="text-danger me-2">●</span> Grabando...
                                </div>
                            ) : audioBlob ? (
                                <div className="d-flex align-items-center bg-light rounded-pill px-2" style={{ minHeight: '38px' }}>
                                    <audio ref={audioRef} src={audioUrl} className="me-2" controls style={{ height: '30px' }} />
                                </div>
                            ) : (
                                <textarea
                                    ref={inputMessageRef}
                                    className="form-control w-100"
                                    placeholder="Ingrese su mensaje aquí"
                                    rows={1}
                                    style={{ minHeight: '38px', fieldSizing: 'content', borderRadius: '1rem', resize: 'none' }}
                                    disabled={isSending || !!audioBlob}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            if (hasContent()) onMessageSubmit(e)
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <div className="col-auto">
                            {audioBlob && !isRecording ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm me-1"
                                        onClick={discardAudio}
                                        style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        title="Descartar audio"
                                    >
                                        <i className="mdi mdi-delete"></i>
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success btn-sm"
                                        disabled={isSending}
                                        style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        title="Enviar audio"
                                    >
                                        <i className="mdi mdi-send"></i>
                                    </button>
                                </>
                            ) : isRecording ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-warning btn-sm me-1"
                                        onClick={stopRecording}
                                        style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        title="Pausar grabación"
                                    >
                                        <i className="mdi mdi-pause"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={discardAudio}
                                        style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        title="Descartar grabación"
                                    >
                                        <i className="mdi mdi-delete"></i>
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={isSending || !hasContent()}
                                    style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                >
                                    {isSending ? (
                                        <i className="mdi mdi-spin mdi-loading"></i>
                                    ) : (
                                        <i className="mdi mdi-send"></i>
                                    )}
                                </button>
                            )}
                        </div>
                        {!isRecording && !audioBlob && (
                            <div className="col-auto">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={startRecording}
                                    disabled={isSending}
                                    style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                    title="Grabar audio"
                                >
                                    <i className="mdi mdi-microphone"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </section>}
        </div>

    )
}

export default ChatContent