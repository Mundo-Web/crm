import { useRef, useState, useEffect } from "react"
import WhatsAppRest from "../../actions/WhatsAppRest"
import LeadsRest from "../../actions/LeadsRest"
import MessagesRest from "../../actions/MessagesRest"
import useWebSocket from "../CustomHooks/useWebSocket"
import '../../../css/chat.css'
import ChatHeader from "./ChatHeader"
import MessageCard from "./MessageCard"
import ChatEmpty from "./ChatEmpty"
import MessageSkeleton from "./MessageSkeleton"
import CameraModal from "./CameraModal"
import wa2html from "../../Utils/wa2html"
import HtmlContent from "../../Utils/HtmlContent"
import Global from "../../Utils/Global"

const whatsAppRest = new WhatsAppRest()
const messagesRest = new MessagesRest()
const leadsRest = new LeadsRest()

const ChatContent = ({ leadId, setLeadId, theme, contactDetails, setContactDetails, defaultMessages }) => {
  const inputMessageRef = useRef()
  const fileInputRef = useRef()
  const audioRef = useRef()
  const mediaRecorderRef = useRef()
  const dropdownRef = useRef()
  const dropdownContainerRef = useRef()
  const containerRef = useRef()

  const [contact, setContact] = useState(null)
  const [contactLoading, setContactLoading] = useState(true)
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [attachment, setAttachment] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [attachmentType, setAttachmentType] = useState(null)

  const { socket } = useWebSocket()

  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [cameraBlob, setCameraBlob] = useState(null)
  const [isOpenCamera, setIsOpenCamera] = useState(false)

  const [isDMOpen, setIsDMOpen] = useState(false)

  // Preview states
  const [previewBlob, setPreviewBlob] = useState(null)
  const [previewType, setPreviewType] = useState(null) // 'image' | 'video' | 'document'
  const [previewName, setPreviewName] = useState('')

  // Prevent auto-scroll when user is scrolling up
  const userIsScrollingUp = useRef(false)

  useEffect(() => {
    // Cleanup audio URL on unmount or when blob changes
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])


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
        markMessagesAsRead(microtime)
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
        setAttachmentType('audio')
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
    if (!text && !audioBlob && !attachment) return

    setIsSending(true)
    if (attachment) {
      switch (attachmentType) {
        case 'audio':
          await whatsAppRest.sendAudio(contact.id, audioBlob);
          break;
        case 'image':
          await whatsAppRest.sendImage(contact.id, attachment, text);
          break;
        default:
          await whatsAppRest.sendDocument(contact.id, attachment, text);
          break;
      }
      setAttachment(null)
      setAttachmentType(null)
    } else {
      await whatsAppRest.send(contact.id, text)
    }
    setMessageText('')
    setIsSending(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const blob = file
    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'document'
    setAttachment(blob)
    setAttachmentType(type)
    e.target.value = ''
  }

  const hasContent = () => messageText.trim() || audioBlob || attachment

  let lastFromMe = false

  const getContact = async () => {
    setContactLoading(true)
    const contactData = await leadsRest.get(leadId)
    setContactLoading(false)
    if (!contactData) {
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

  const markMessagesAsRead = async (sinceMicrotime) => {
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (attachment) {
        setAttachment(null)
      } else {
        setLeadId(null)
        setContactDetails(null)
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attachment]);

  useEffect(() => {
    if (!attachment) return
    const url = URL.createObjectURL(attachment);
    setAttachmentPreview(url);
    return () => {
      URL.revokeObjectURL(url); // Importante: libera la memoria RAM
    };
  }, [attachment])

  if (!contact && !contactLoading) return <ChatEmpty />

  console.log(defaultMessages)

  return <>
    <ChatHeader contact={contact} contactDetails={contactDetails} setContactDetails={setContactDetails} loading={contactLoading} theme={theme} />
    <div className="card-body p-0 position-relative border" style={{
      backgroundColor: theme == 'light' ? 'rgb(245, 241, 235)' : 'rgb(22, 23, 23)',
    }}>
      {
        attachment
          ? <section className="position-relative p-4" style={{ height: 'calc(100vh - 260px)', zIndex: 1 }}>
            <i className="mdi mdi-close mdi-24px position-absolute cursor-pointer" onClick={() => setAttachment(null)} />
            <div className="d-flex flex-column h-100 gap-2">
              <div className="flex-grow-1 d-flex align-items-center justify-content-center overflow-hidden">
                {attachmentType === 'image' ? (
                  <img
                    src={attachmentPreview}
                    alt="Adjunto"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="text-center">
                    <i className="mdi mdi-file-document" style={{ fontSize: '48px' }} />
                    <div className="mt-2">{attachment.name || 'Documento'}</div>
                  </div>
                )}
              </div>
              <form className="pt-0 conversation-input" onSubmit={onMessageSubmit}>
                <label className={`row mx-auto g-0 align-items-end p-1 ${theme === 'dark' ? 'bg-light' : 'bg-white'}`} htmlFor="message-input" style={{
                  borderRadius: '24px',
                  maxWidth: '600px'
                }}>
                  <div className="col mt-0">
                    <textarea
                      ref={inputMessageRef}
                      id="message-input"
                      className="form-control w-100"
                      placeholder="Ingrese su mensaje aquí"
                      rows={1}
                      style={{ minHeight: '38px', maxHeight: '122px', fieldSizing: 'content', resize: 'none', border: 'none', backgroundColor: 'transparent' }}
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
                  </div>
                  <div className="col-auto mt-0">
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
                  </div>
                </label>
              </form>
            </div>
          </section>
          : <>
            <div className="position-absolute" style={{
              top: 0, right: 0, bottom: 0, left: 0,
              backgroundImage: 'url(/assets/img/doodles.png)',
              backgroundRepeat: 'repeat',
              zIndex: 0,
              opacity: theme == 'light' ? 1 : 0.0625
            }} />
            <section className="d-flex flex-column position-relative" style={{ height: 'calc(100vh - 260px)', zIndex: 1 }}>
              <ul
                ref={containerRef}
                className="conversation-list flex-grow-1 px-3 pt-3 scroll-hidden"
                style={{ overflowY: 'auto', scrollBehavior: 'smooth', position: 'relative' }}
              >
                {messagesLoading && messages.length === 0 && <MessageSkeleton theme={theme} />}
                {messages.map((message, idx) => {
                  const fromMe = message.role !== 'Human'
                  const marginTop = lastFromMe !== fromMe
                  lastFromMe = fromMe

                  // Date label logic
                  const messageDate = new Date((message.microtime / 1000) - (5 * 60 * 60 * 1000))
                  const today = new Date()
                  const diffTime = today - messageDate
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                  let dateLabel = null
                  if (diffDays === 0) {
                    dateLabel = 'Hoy'
                  } else if (diffDays === 1) {
                    dateLabel = 'Ayer'
                  } else if (diffDays <= 6) {
                    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                    dateLabel = dayNames[messageDate.getDay()]
                  } else {
                    dateLabel = `${messageDate.getDate()}/${messageDate.getMonth() + 1}/${messageDate.getFullYear()}`
                  }

                  const showDateLabel = idx === 0 ||
                    new Date(messages[idx - 1].microtime / 1000).toDateString() !== messageDate.toDateString()

                  return (
                    <>
                      {showDateLabel && (
                        <li key={`date-${idx}`} className="text-center p-0 mx-auto" style={{
                          position: 'sticky',
                          top: 0, zIndex: 10,
                          width: 'max-content',
                          marginTop: '12px',
                          marginBottom: '12px',
                        }}>
                          <span className="badge" style={{
                            width: '68px',
                            backgroundColor: theme == 'dark' ? 'rgb(36, 38, 38)' : 'rgb(255, 255, 255)',
                            color: theme == 'dark' ? '#fafafa' : '#0a0a0a'
                          }}>{dateLabel}</span>
                        </li>
                      )}
                      <MessageCard
                        key={idx}
                        index={idx}
                        forceAfter={showDateLabel}
                        isLast={idx < messages.length - 1}
                        message={message}
                        fromMe={fromMe}
                        marginTop={marginTop}
                        theme={theme} />
                    </>
                  )
                })}
              </ul>
              <form className="p-2 pt-0 conversation-input position-relative" onSubmit={onMessageSubmit}>
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
                      <div ref={dropdownContainerRef} className="dropdown-menu mb-1">
                        <button className="dropdown-item" href="#" onClick={(e) => {
                          e.preventDefault()
                          fileInputRef.current?.setAttribute('accept', '*')
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
                          setIsOpenCamera(true)
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
                    ) : (
                      <div className="dropup">
                        <div className={`dropdown-menu mb-1 ${isDMOpen ? 'show' : ''}`}
                          data-popper-placement="top-start"
                          style={{
                            position: 'absolute',
                            inset: 'auto auto 0px 0px',
                            margin: '0px',
                            transform: 'translateY(-44px)',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                          {
                            defaultMessages
                              .filter(dm => `/${dm.name}`.toLowerCase().startsWith(messageText.toLowerCase()))
                              .map((message, idx) => {
                                const content = $(`<div>${message.description}</div>`)
                                content.find('.mention').each((_, element) => {
                                  const mention = $(element)
                                  const mentionId = mention.attr('data-id')
                                  mention.removeClass('mention')
                                  mention.text(contact?.[mentionId])
                                })
                                return <div key={idx} className="dropdown-item" type="button" style={{ width: '300px' }} onClick={async () => {
                                  setIsDMOpen(false)
                                  setMessageText('')
                                  setIsSending(true)
                                  if (message.attachments.length > 0) {
                                    const attachment = message.attachments[0]
                                    const attachmentURL = `${Global.APP_URL}/cloud/${attachment.file}`
                                    await whatsAppRest.send(leadId, `/attachment:${attachmentURL}\n${content.html()}`)
                                    setIsSending(false)
                                    return
                                  }
                                  await whatsAppRest.send(leadId, content.html())
                                  setIsSending(false)
                                }}>
                                  <span className="d-block text-truncate">/{message.name}</span>
                                  <small className="d-block text-muted text-truncate">{content.text()}</small>
                                </div>
                              })
                          }
                        </div>
                        <textarea
                          ref={inputMessageRef}
                          id="message-input"
                          className="form-control w-100"
                          placeholder="Ingrese su mensaje aquí"
                          rows={1}
                          style={{ minHeight: '38px', maxHeight: '188px', fieldSizing: 'content', resize: 'none', border: 'none', backgroundColor: 'transparent' }}
                          disabled={isSending || !!audioBlob || !!cameraBlob || !!previewBlob}
                          value={messageText}
                          onChange={(e) => {
                            const newValue = e.target.value
                            if (String(newValue).trim().startsWith('/') && defaultMessages.some(({ name }) => (`/${name}`.toLowerCase()).startsWith(newValue.toLowerCase()))) {
                              setIsDMOpen(true)
                            } else {
                              setIsDMOpen(false)
                            }
                            setMessageText(newValue)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              if (hasContent()) onMessageSubmit(e)
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-auto mt-0">
                    {(cameraBlob || previewBlob) && !isOpenCamera ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm me-1"
                          onClick={() => {
                            setCameraBlob(null)
                            setPreviewBlob(null)
                            setPreviewType(null)
                            setPreviewName('')
                          }}
                          style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                          title="Descartar adjunto"
                        >
                          <i className="mdi mdi-delete"></i>
                        </button>
                        <button
                          type="submit"
                          className="btn btn-success btn-sm"
                          disabled={isSending}
                          style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                          title="Enviar adjunto"
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
          </>
      }

      <CameraModal
        isOpen={isOpenCamera}
        setIsOpen={setIsOpenCamera}
        onTakePhoto={(blob) => {
          setAttachmentType('image')
          setAttachment(blob)
        }}
      />
    </div>
  </>
}

export default ChatContent