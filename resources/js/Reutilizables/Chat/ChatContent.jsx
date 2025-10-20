import { useRef, useState, useEffect } from "react"
import HtmlContent from "../../Utils/HtmlContent"
import wa2html from "../../Utils/wa2html"
import WhatsAppRest from "../../actions/WhatsAppRest"
import '../../../css/chat.css'

const whatsAppRest = new WhatsAppRest()

const ChatContent = ({ messages, containerRef, lead, loading, getMessages, theme }) => {

    const inputMessageRef = useRef()
    const fileInputRef = useRef()
    const audioRef = useRef()
    const mediaRecorderRef = useRef()
    const videoRef = useRef()
    const canvasRef = useRef()
    const dropdownRef = useRef()

    const [isSending, setIsSending] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [cameraStream, setCameraStream] = useState(null)
    const [cameraBlob, setCameraBlob] = useState(null)
    const [showCamera, setShowCamera] = useState(false)

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

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [cameraStream])

    // Infinite scroll handler
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const handleScroll = () => {
            if (el.scrollTop === 0 && !loading && getMessages) {
                getMessages()
            }
        }

        el.addEventListener('scroll', handleScroll)
        return () => el.removeEventListener('scroll', handleScroll)
    }, [containerRef, loading, getMessages])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Attach camera stream to video element
    useEffect(() => {
        if (showCamera && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream
        }
    }, [showCamera, cameraStream])

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
            mediaRecorderRef.current = mediaRecorder
            setIsRecording(true)
        } catch (err) {
            console.error('Error accessing microphone:', err)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
    }

    const discardAudio = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
        setAudioBlob(null)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
    }

    const onMessageSubmit = async (e) => {
        e.preventDefault()
        if (!lead) return
        const text = messageText.trim()
        if (!text && !audioBlob && !cameraBlob) return

        setIsSending(true)
        if (audioBlob) {
            // TODO: implement audio upload
            console.warn('Audio upload not implemented yet')
        } else if (cameraBlob) {
            // TODO: implement camera image upload
            console.warn('Camera image upload not implemented yet')
        } else {
            await whatsAppRest.send(lead.id, text)
        }
        setMessageText('')
        setAudioBlob(null)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
        setCameraBlob(null)
        setShowCamera(false)
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

    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            setCameraStream(stream)
            setShowCamera(true)
            setIsDropdownOpen(false)
        } catch (err) {
            console.error('Error accessing camera:', err)
        }
    }

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setShowCamera(false)
        setCameraBlob(null)
    }

    const takePhoto = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
            setCameraBlob(blob)
            closeCamera()
        }, 'image/jpeg', 0.95)
    }

    const hasContent = () => messageText.trim() || audioBlob || cameraBlob

    let lastFromMe = false

    return (
        <div className="card-body p-0 position-relative border" style={{
            backgroundColor: theme == 'light' ? 'rgb(245, 241, 235)' : 'rgb(22, 23, 23)',
        }}>
            <div className="position-absolute" style={{
                top: 0, right: 0, bottom: 0, left: 0,
                backgroundImage: 'url(/assets/img/doodles.png)',
                backgroundRepeat: 'repeat',
                // backgroundPosition: 'contain',
                zIndex: 0,
                opacity: theme == 'light' ? 1 : 0.0625
            }} />
            <section className="d-flex flex-column position-relative" style={{ height: 'calc(100vh - 260px)', zIndex: 1 }}>
                <ul
                    ref={containerRef}
                    className="conversation-list slimscroll flex-grow-1 px-3 pt-3"
                    style={{ overflowY: 'auto', scrollBehavior: 'smooth', position: 'relative' }}
                >
                    {/* Loading overlay at the top */}
                    {loading && (
                        <li className="text-center py-1 px-2 rounded-pill mx-auto" style={{ position: 'sticky', top: 0, zIndex: 10, width: 'max-content', backgroundColor: 'var(--bs-light)' }}>
                            <i className="mdi mdi-spin mdi-loading" />
                            <small className="text-muted ms-2">Cargando mensajes...</small>
                        </li>
                    )}
                    {messages.map((message, idx) => {
                        const fromMe = message.role !== 'Human'
                        const marginTop = lastFromMe === fromMe ? '3px' : '12px'
                        lastFromMe = fromMe

                        let content = message.message?.replace(/\{\{.*?\}\}/gs, '') || ''
                        let attachment = ''
                        if (content.startsWith('/attachment:')) {
                            attachment = content.split('\n')[0]
                            content = content.replace(attachment, '')
                        }
                        if (message.role == 'Form') {
                            return (
                                <li key={idx}>
                                    <div className="chat-day-title mt-3 mb-0">
                                        <small className="title badge badge-soft-dark rounded-pill">{content}</small>
                                    </div>
                                </li>
                            )
                        }
                        return (
                            <li key={idx} className={fromMe ? 'odd' : ''} style={{ marginBottom: idx < messages.length - 1 ? '0px' : '24px', marginTop }}>
                                <div className="message-list">
                                    <div className="conversation-text">
                                        <div className={`ctext-wrap ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`} style={{
                                            boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px'
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
                                                        onError={e => $(e.target).remove()} />
                                                    <div className="d-flex justify-content-end">
                                                        <a className="btn btn-xs btn-light mb-1 text-nowrap d-flex text-end" href={attachment.replace('/attachment:', '')} target="_blank" rel="noreferrer" download>
                                                            <i className="mdi mdi-download me-1"></i>
                                                            <span>Descargar adjunto</span>
                                                        </a>
                                                    </div>
                                                    {
                                                        !content.trim() &&
                                                        <span className="time mt-0 float-end" style={{ fontSize: '8px', marginLeft: '6px', marginTop: '6px !important' }}>{moment(message.created_at).format('HH:mm')}</span>
                                                    }
                                                </>
                                            )}
                                            {
                                                content.trim() &&
                                                <HtmlContent className="text-start font-13" html={wa2html(content + `<span class="time mt-0 float-end" style="font-size: 8px; margin-left: 6px; margin-top: 6px !important">${moment(message.created_at).format('HH:mm')}</span>`)} />
                                            }
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <form className="p-2 pt-0 conversation-input" onSubmit={onMessageSubmit}>
                    <label className={`row g-0 align-items-end p-1 ${theme == 'dark' ? 'bg-light' : 'bg-white'}`} htmlFor="message-input" style={{
                        borderRadius: '24px'
                    }}>
                        <div className="col-auto mt-0">
                            <div className="dropup" ref={dropdownRef}>
                                <button
                                    type="button"
                                    className="btn btn-light btn-sm dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded={isDropdownOpen}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    disabled={isSending || isRecording}
                                    title="Adjuntar archivo"
                                    style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                >
                                    <i className={`mdi ${isDropdownOpen ? 'mdi-close' : 'mdi-plus'}`}></i>
                                </button>
                                <div className="dropdown-menu mb-1">
                                    <button className="dropdown-item" href="#" onClick={(e) => {
                                        e.preventDefault()
                                        fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx')
                                        fileInputRef.current?.click()
                                    }}>
                                        <i className="mdi mdi-file-document me-2" style={{ color: '#7F66FF' }} />
                                        Documentos
                                    </button>
                                    <button className="dropdown-item" href="#" onClick={(e) => {
                                        e.preventDefault()
                                        fileInputRef.current?.setAttribute('accept', 'image/*,video/*')
                                        fileInputRef.current?.click()
                                    }}>
                                        <i className="mdi mdi-image me-2" style={{ color: '#007BFC' }} />
                                        Fotos y videos
                                    </button>
                                    <button className="dropdown-item" href="#" onClick={(e) => {
                                        e.preventDefault()
                                        openCamera()
                                    }}>
                                        <i className="mdi mdi-camera me-2" style={{ color: '#FF2E74' }} />
                                        Cámara
                                    </button>
                                    <button className="dropdown-item" href="#" onClick={(e) => {
                                        e.preventDefault()
                                        fileInputRef.current?.setAttribute('accept', 'audio/*')
                                        fileInputRef.current?.click()
                                    }}>
                                        <i className="mdi mdi-headphones me-2" style={{ color: '#FB6533' }} />
                                        Audio
                                    </button>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="d-none"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="col mt-0">
                            {isRecording ? (
                                <div className="d-flex align-items-center justify-content-center bg-light rounded-pill" style={{ minHeight: '38px' }}>
                                    <span className="text-danger me-2">●</span> Grabando...
                                </div>
                            ) : audioBlob ? (
                                <div className="d-flex align-items-center bg-light rounded-pill px-2" style={{ minHeight: '38px' }}>
                                    <audio ref={audioRef} src={audioUrl} className="me-2" controls controlsList="nodownload" style={{ height: '30px' }} />
                                </div>
                            ) : cameraBlob ? (
                                <div className="d-flex align-items-center bg-light rounded-pill px-2" style={{ minHeight: '38px' }}>
                                    <span className="me-2">📷 Foto capturada</span>
                                </div>
                            ) : (
                                <textarea
                                    ref={inputMessageRef}
                                    id="message-input"
                                    className="form-control w-100"
                                    placeholder="Ingrese su mensaje aquí"
                                    rows={1}
                                    style={{ minHeight: '38px', maxHeight: '188px', fieldSizing: 'content', resize: 'none', border: 'none', backgroundColor: 'transparent' }}
                                    disabled={isSending || !!audioBlob || !!cameraBlob}
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
                        <div className="col-auto mt-0">
                            {cameraBlob && !showCamera ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm me-1"
                                        onClick={() => setCameraBlob(null)}
                                        style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        title="Descartar foto"
                                    >
                                        <i className="mdi mdi-delete"></i>
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success btn-sm"
                                        disabled={isSending}
                                        style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        title="Enviar foto"
                                    >
                                        <i className="mdi mdi-send"></i>
                                    </button>
                                </>
                            ) : audioBlob && !isRecording ? (
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
                                <>
                                    {messageText.trim() ? (
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-sm"
                                            disabled={isSending}
                                            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                        >
                                            {isSending ? (
                                                <i className="mdi mdi-spin mdi-loading"></i>
                                            ) : (
                                                <i className="mdi mdi-send"></i>
                                            )}
                                        </button>
                                    ) : (
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
                                    )}
                                </>
                            )}
                        </div>
                    </label>
                </form>
            </section>

            {/* Camera Modal */}
            {showCamera && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Cámara</h5>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeCamera}>
                                <i className="mdi mdi-close"></i>
                            </button>
                        </div>
                        <div className="card-body p-0">
                            <video ref={videoRef} autoPlay playsInline muted className="w-100" style={{ maxHeight: '400px' }} />
                            <canvas ref={canvasRef} className="d-none" />
                        </div>
                        <div className="card-footer d-flex justify-content-center">
                            <button type="button" className="btn btn-primary btn-lg rounded-pill" onClick={takePhoto}>
                                <i className="mdi mdi-camera me-2"></i>Tomar foto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    )
}

export default ChatContent