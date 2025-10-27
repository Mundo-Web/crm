import { useRef, useState, useEffect } from "react"
import HtmlContent from "../../Utils/HtmlContent"
import wa2html from "../../Utils/wa2html"
import WhatsAppRest from "../../actions/WhatsAppRest"
import LeadsRest from "../../actions/LeadsRest"
import MessagesRest from "../../actions/MessagesRest"
import useWebSocket from "../CustomHooks/useWebSocket"
import '../../../css/chat.css'
import Global from "../../Utils/Global"
import ChatHeader from "./ChatHeader"
import MessageCard from "./MessageCard"

const whatsAppRest = new WhatsAppRest()
const messagesRest = new MessagesRest()
const leadsRest = new LeadsRest()

const ChatContent = ({ leadId, theme, contactDetails, setContactDetails }) => {
    const inputMessageRef = useRef()
    const fileInputRef = useRef()
    const audioRef = useRef()
    const mediaRecorderRef = useRef()
    const videoRef = useRef()
    const canvasRef = useRef()
    const dropdownRef = useRef()
    const containerRef = useRef()

    const [contact, setContact] = useState(null)
    const [contactLoading, setContactLoading] = useState(true)
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(true);

    const { socket } = useWebSocket()

    const [isSending, setIsSending] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [cameraStream, setCameraStream] = useState(null)
    const [cameraBlob, setCameraBlob] = useState(null)
    const [showCamera, setShowCamera] = useState(false)
    // Skeleton state
    const [skeletonCount, setSkeletonCount] = useState(3)
    const [skeletonSides, setSkeletonSides] = useState([])

    // Prevent auto-scroll when user is scrolling up
    const userIsScrollingUp = useRef(false)

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
    // Skeleton randomizer
    useEffect(() => {
        if (!messagesLoading) return
        const interval = setInterval(() => {
            const newCount = 3 + Math.floor(Math.random() * 5) // 3-7
            setSkeletonCount(newCount)
            setSkeletonSides(Array.from({ length: newCount }, () => Math.random() > 0.5))
        }, 1500)
        return () => clearInterval(interval)
    }, [messagesLoading])
    // Scroll helpers

    const scrollToBottom = (smooth = true) => {
        const el = containerRef.current
        if (!el) return
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    }

    const isScrolledNearBottom = () => {
        const el = containerRef.current
        if (!el) return true
        return el.scrollTop + el.clientHeight >= el.scrollHeight - 60
    }

    // Initial scroll on first load
    useEffect(() => {
        if (!messagesLoading && messages.length) {
            scrollToBottom(false)
        }
    }, [messagesLoading, messages.length])

    // Scroll on new message
    useEffect(() => {
        if (!socket || !contact) return
        socket.on('message.created', (props) => {
            if (props.wa_id != contact?.contact_phone) return
            const { id, microtime } = props;
            setMessages(prev => {
                const exists = prev.find(m => m.id === id);
                if (exists) {
                    return prev.map(m => m.id === id ? { ...m, ...props } : m);
                }
                const updated = [...prev, props].sort((a, b) => a.microtime - b.microtime);
                return updated;
            });

            // Load newer messages if needed
            const newestMicrotime = messages.reduce((max, m) => Math.max(max, m.microtime), 0)
            if (microtime > newestMicrotime) {
                loadNewerMessages(microtime)
            }

            // Auto-scroll only if near bottom and user is not scrolling up
            if (isScrolledNearBottom() && !userIsScrollingUp.current) {
                setTimeout(() => scrollToBottom(true), 100)
            }
        })
        return () => {
            socket.off('message.created')
        }
    }, [socket, contact, messages])

    // Infinite scroll handler
    useEffect(() => {
        if (messagesLoading) return
        const el = containerRef.current
        if (!el) return

        const handleScroll = () => {
            if (el.scrollTop === 0) {
                userIsScrollingUp.current = true
                loadMessages()
            }
        }

        el.addEventListener('scroll', handleScroll)
        return () => el.removeEventListener('scroll', handleScroll)
    }, [containerRef, messagesLoading])

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
                const blob = new Blob(chunks, { type: 'audio/mp3' })
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
        if (!contact) return
        const text = messageText.trim()
        if (!text && !audioBlob && !cameraBlob) return

        setIsSending(true)
        if (audioBlob) {
            // TODO: implement audio upload
            console.warn('Audio upload not implemented yet')
            console.log(audioBlob)
            await whatsAppRest.sendAudio(contact.id, audioBlob)
        } else if (cameraBlob) {
            // TODO: implement camera image upload
            console.warn('Camera image upload not implemented yet')
        } else {
            await whatsAppRest.send(contact.id, text)
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

    const getContact = async () => {
        setContactLoading(true)
        const contactData = await leadsRest.get(leadId)
        setContactLoading(false)
        if (!contactData) {
            // Show friendly empty state when contact does not exist
            setContact(null)
            setContactDetails(null)
            return
        }
        setContact(contactData)
    }

    const loadMessages = async () => {
        if (!contact || !leadId) return
        const el = containerRef.current
        const prevScrollHeight = el ? el.scrollHeight : 0
        const oldestMessage = messages
            .filter(m => m.wa_id == contact.contact_phone)
            .sort((a, b) => a.microtime - b.microtime)[0] ?? { microtime: (Date.now() + 5 * 60 * 60 * 1000) * 1000 }
        setMessagesLoading(true)
        const result = await messagesRest.paginate({
            summary: {
                'contact_phone': contact.contact_phone
            },
            filter: [
                ["microtime", "<", oldestMessage.microtime], "and",
                ["wa_id", "contains", contact.contact_phone]
            ],
            sort: [{ selector: 'microtime', desc: true }],
            skip: 0,
            take: 40
        })
        setMessagesLoading(false)
        if (result.data?.length > 0) {
            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id))
                const newMessages = (result.data ?? []).filter(m => !existingIds.has(m.id))
                return [...newMessages, ...prev].sort((a, b) => a.microtime - b.microtime)
            })
            // Mantener posición de scroll después de cargar mensajes antiguos
            if (el) {
                const newScrollHeight = el.scrollHeight
                el.scrollTop = newScrollHeight - prevScrollHeight
            }
            // Reset user scroll flag after loading older messages
            userIsScrollingUp.current = false
        }
    }

    const loadNewerMessages = async (sinceMicrotime) => {
        if (!contact) return
        await messagesRest.paginate({
            summary: {
                'contact_phone': contact.contact_phone
            },
            filter: [
                ["microtime", "<=", sinceMicrotime], "and",
                ["wa_id", "contains", contact.contact_phone]
            ],
            sort: [{ selector: 'microtime', desc: true }],
            skip: 0,
            take: 40
        })
    }

    useEffect(() => {
        setContact(null)
        setContactDetails(null)
        setMessages([])
        if (!leadId) return
        getContact()
    }, [leadId])

    useEffect(() => {
        setMessages([])
        if (!leadId && !contact) return
        loadMessages()
    }, [contact, leadId])

    // Render skeletons
    const renderSkeletons = () => (
        <>
            {Array.from({ length: skeletonCount }).map((_, idx) => {
                const lines = 1 + Math.floor(Math.random() * 3) // 1-3 líneas
                return (
                    <li key={idx} className={skeletonSides[idx] ? 'odd' : ''} style={{ marginBottom: idx < skeletonCount - 1 ? '0px' : '24px', marginTop: idx > 0 && skeletonSides[idx] === skeletonSides[idx - 1] ? '3px' : '12px' }}>
                        <div className="message-list">
                            <div className="conversation-text">
                                <div className={`ctext-wrap ${skeletonSides[idx] ? `message-out-${theme}` : `message-in-${theme}`}`} style={{ boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px', padding: '6px 8px', width: `${300 + ((300 * (lines - 1)) / 6)}px` }}>
                                    <div className="placeholder-glow">
                                        {Array.from({ length: lines }).map((_, lIdx) => (
                                            <span key={lIdx} className={`placeholder ${lIdx === lines - 1 ? 'col-6 ms-0' : 'col-12'} `} />
                                        ))}
                                        <span className="placeholder time float-end col-1" style={{ fontSize: '10px', marginLeft: '6px', marginTop: '8px !important' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                )
            })}
        </>
    )

    // Render empty state when contact does not exist
    const renderEmptyContact = () => (
        <div className="d-flex flex-column align-items-center justify-content-center text-center px-4" style={{ height: 'calc(100vh - 260px)' }}>
            <div className="mb-3">
                <i className="mdi mdi-account-off-outline text-muted" style={{ fontSize: '4rem' }}></i>
            </div>
            <h5 className="text-muted mb-2">Este contacto no existe en la empresa seleccionada</h5>
            <p className="text-muted mb-3">
                Por favor, elige otro contacto desde la lista o intenta refrescar la página si crees que debería estar aquí.
            </p>
            <button
                className="btn btn-outline-primary"
                onClick={() => window.location.reload()}
            >
                <i className="mdi mdi-refresh me-1"></i>Refrescar página
            </button>
        </div>
    )

    return <>
        <ChatHeader contact={contact} contactDetails={contactDetails} setContactDetails={setContactDetails} loading={contactLoading} theme={theme} />
        <div className="card-body p-0 position-relative border" style={{
            backgroundColor: theme == 'light' ? 'rgb(245, 241, 235)' : 'rgb(22, 23, 23)',
        }}>
            <div className="position-absolute" style={{
                top: 0, right: 0, bottom: 0, left: 0,
                backgroundImage: 'url(/assets/img/doodles.png)',
                backgroundRepeat: 'repeat',
                zIndex: 0,
                opacity: theme == 'light' ? 1 : 0.0625
            }} />
            <section className="d-flex flex-column position-relative" style={{ height: 'calc(100vh - 260px)', zIndex: 1 }}>
                {!contact && !contactLoading ? (
                    renderEmptyContact()
                ) : (
                    <>
                        <ul
                            ref={containerRef}
                            className="conversation-list flex-grow-1 px-3 pt-3 scroll-hidden"
                            style={{ overflowY: 'auto', scrollBehavior: 'smooth', position: 'relative' }}
                        >
                            {/* Loading overlay at the top */}
                            {/* {messagesLoading && messages.length === 0 && (
                                <li className="text-center py-1 px-2 rounded-pill mx-auto" style={{ position: 'sticky', top: 0, zIndex: 10, width: 'max-content', backgroundColor: 'var(--bs-light)' }}>
                                    <i className="mdi mdi-spin mdi-loading" />
                                    <small className="text-muted ms-2">Cargando mensajes...</small>
                                </li>
                            )} */}
                            {/* Skeletons */}
                            {messagesLoading && messages.length === 0 && renderSkeletons()}
                            {/* Messages */}
                            {messages.map((message, idx) => {
                                const fromMe = message.role !== 'Human'
                                const marginTop = lastFromMe !== fromMe
                                lastFromMe = fromMe
                                return <MessageCard
                                    key={idx}
                                    isLast={idx < messages.length - 1}
                                    message={message}
                                    fromMe={fromMe}
                                    marginTop={marginTop}
                                    theme={theme} />
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
                    </>
                )}
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
    </>

}

export default ChatContent