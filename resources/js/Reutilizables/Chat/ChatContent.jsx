import { useRef, useState, useEffect } from "react"
import WhatsAppRest from "../../actions/WhatsAppRest"
import MetaRest from "../../actions/MetaRest"
import TikTokRest from "../../actions/TikTokRest"
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
import Modal from "../../components/Modal"
import Swal from "sweetalert2"

const whatsAppRest = new WhatsAppRest()
const metaRest = new MetaRest()
const tiktokRest = new TikTokRest()
const messagesRest = new MessagesRest()
const leadsRest = new LeadsRest()

const ChatContent = ({ leadId, setLeadId, theme, contactDetails, setContactDetails, defaultMessages, can, chatStatuses = [], onLeadUpdate = () => {} }) => {
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

  const templatesModalRef = useRef()
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateParams, setTemplateParams] = useState({})
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false)
  const [isSendingTemplate, setIsSendingTemplate] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true)

  const openTemplatesModal = async () => {
    setIsTemplatesLoading(true)
    $(templatesModalRef.current).modal('show')
    const [templatesData, billingData] = await Promise.all([
      whatsAppRest.getTemplates(),
      whatsAppRest.verifyBilling()
    ])
    setTemplates(templatesData || [])
    setHasPaymentMethod(billingData?.has_payment_method ?? true)
    setIsTemplatesLoading(false)
  }

  const handleTemplateChange = (e) => {
    const templateName = e.target.value
    const template = templates.find(t => t.name === templateName)
    setSelectedTemplate(template)

    if (template) {
      const bodyComponent = template.components?.find(c => c.type === 'BODY')
      const bodyText = bodyComponent?.text || ''
      const matches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)]
      const paramsCount = matches.length

      const initialParams = {}
      const clientName = contact?.contact_name || ''
      if (paramsCount >= 1) {
        initialParams['1'] = clientName
      }
      for (let i = 2; i <= paramsCount; i++) {
        initialParams[String(i)] = ''
      }
      setTemplateParams(initialParams)
    } else {
      setTemplateParams({})
    }
  }

  const getReplacedTemplateText = () => {
    if (!selectedTemplate) return ''
    const bodyComponent = selectedTemplate.components?.find(c => c.type === 'BODY')
    let text = bodyComponent?.text || ''
    Object.keys(templateParams).forEach(key => {
      text = text.replaceAll(`{{${key}}}`, templateParams[key] || `{{${key}}}`)
    })
    return text
  }

  const onSendTemplateSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setIsSendingTemplate(true)
    const clientId = contact?.id
    const templateName = selectedTemplate.name
    const languageCode = selectedTemplate.language?.code || selectedTemplate.language || 'es'
    const parameters = Object.keys(templateParams)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => templateParams[key])
    const templateText = getReplacedTemplateText()

    const result = await whatsAppRest.sendTemplate(
      clientId,
      templateName,
      languageCode,
      parameters,
      templateText
    )

    setIsSendingTemplate(false)
    if (result) {
      $(templatesModalRef.current).modal('hide')
      setSelectedTemplate(null)
      setTemplateParams({})
      loadMessages()
    }
  }

  const service = contact?.integration?.meta_service || contact?.origin?.toLowerCase();
  const isWhatsApp = service === 'whatsapp' || 
                     service === 'forms' || 
                     (!['messenger', 'instagram', 'tiktok'].includes(contact?.integration?.meta_service) && contact?.contact_phone);
  const isMetaIntegration = !isWhatsApp && (service === 'messenger' || service === 'instagram');
  const isTikTokIntegration = !isWhatsApp && service === 'tiktok';
  const chatIdentifier = isWhatsApp ? contact?.contact_phone : (contact?.integration_user_id || contact?.contact_phone);

  const is24HourWindowOpen = () => {
    if (!messages || messages.length === 0) return false;
    const humanMessages = messages.filter(m => m.role === 'Human');
    if (humanMessages.length === 0) return false;

    const maxMicrotime = Math.max(...humanMessages.map(m => Number(m.microtime)));
    const latestTimestamp = maxMicrotime / 1000;
    const currentTimestamp = Date.now();

    const diffHours = (currentTimestamp - latestTimestamp) / (1000 * 60 * 60);
    const windowHours = 24;
    return diffHours < windowHours;
  };

  const isWithin72HourCampaignWindow = () => {
    if (!contact?.campaign_id) return false;
    if (!messages || messages.length === 0) return false;
    const humanMessages = messages.filter(m => m.role === 'Human');
    if (humanMessages.length === 0) return false;

    const maxMicrotime = Math.max(...humanMessages.map(m => Number(m.microtime)));
    const latestTimestamp = maxMicrotime / 1000;
    const currentTimestamp = Date.now();

    const diffHours = (currentTimestamp - latestTimestamp) / (1000 * 60 * 60);
    return diffHours < 72;
  };

  const getRemaining72HourTime = () => {
    if (!messages || messages.length === 0) return '';
    const humanMessages = messages.filter(m => m.role === 'Human');
    if (humanMessages.length === 0) return '';

    const maxMicrotime = Math.max(...humanMessages.map(m => Number(m.microtime)));
    const latestTimestamp = maxMicrotime / 1000;
    const currentTimestamp = Date.now();

    const diffMs = (latestTimestamp + (72 * 60 * 60 * 1000)) - currentTimestamp;
    if (diffMs <= 0) return '';

    const hours = Math.floor(diffMs / (3600 * 1000));
    const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    return `${hours}h y ${minutes}m`;
  };

  useEffect(() => {
    if (contact && isWhatsApp) {
      whatsAppRest.getTemplates().then(data => {
        setTemplates(data || [])
      }).catch(err => {
        console.error('Error fetching templates: ', err)
      })
    } else {
      setTemplates([])
    }
  }, [contact?.id, isWhatsApp])

  const getSlashSuggestions = (queryVal = messageText) => {
    const query = queryVal.toLowerCase();
    if (!query.startsWith('/')) return [];

    const searchStr = query.slice(1);

    // 1. Meta templates (only for WhatsApp)
    const metaSuggestions = isWhatsApp
      ? (templates || [])
          .filter(t => t.name.toLowerCase().includes(searchStr))
          .map(t => {
            const bodyComp = t.components?.find(c => c.type === 'BODY');
            const text = bodyComp?.text || '';
            return {
              type: 'meta',
              name: t.name,
              description: text,
              original: t
            };
          })
      : [];

    // 2. Local templates (only if NOT WhatsApp, OR if WhatsApp window is open)
    const localSuggestions = (!isWhatsApp || is24HourWindowOpen())
      ? (defaultMessages || [])
          .filter(dm => dm.name.toLowerCase().includes(searchStr))
          .map(dm => {
            const content = $(`<div>${dm.description}</div>`);
            content.find('.mention').each((_, element) => {
              const mention = $(element);
              const mentionId = mention.attr('data-id');
              mention.removeClass('mention');
              mention.text(contact?.[mentionId]);
            });
            return {
              type: 'local',
              name: dm.name,
              description: content.text(),
              html: content.html(),
              original: dm
            };
          })
      : [];

    return [...localSuggestions, ...metaSuggestions].sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    if (messageText.startsWith('/')) {
      const suggestions = getSlashSuggestions(messageText);
      if (suggestions.length > 0) {
        setIsDMOpen(true);
      } else {
        setIsDMOpen(false);
      }
    } else {
      setIsDMOpen(false);
    }
  }, [messageText, templates, defaultMessages, messages, contact, isWhatsApp]);

  const handleSuggestionClick = async (item) => {
    setIsDMOpen(false);
    setMessageText('');

    if (item.type === 'meta') {
      // Open Meta templates modal and select this template
      setSelectedTemplate(item.original);
      // Initialize parameters
      const bodyComponent = item.original.components?.find(c => c.type === 'BODY');
      const bodyText = bodyComponent?.text || '';
      const matches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)];
      const paramsCount = matches.length;

      const initialParams = {};
      const clientName = contact?.contact_name || '';
      if (paramsCount >= 1) {
        initialParams['1'] = clientName;
      }
      for (let i = 2; i <= paramsCount; i++) {
        initialParams[String(i)] = '';
      }
      setTemplateParams(initialParams);
      $(templatesModalRef.current).modal('show');
    } else {
      // Send local template
      setIsSending(true);
      const dmRest = isTikTokIntegration ? tiktokRest : (isMetaIntegration ? metaRest : whatsAppRest);
      if (item.original.attachments.length > 0) {
        const attachment = item.original.attachments[0];
        const attachmentURL = `${Global.APP_URL}/cloud/${attachment.file}`;
        const content = $(`<div>${item.original.description}</div>`);
        content.find('.mention').each((_, element) => {
          const mention = $(element);
          const mentionId = mention.attr('data-id');
          mention.removeClass('mention');
          mention.text(contact?.[mentionId]);
        });
        await dmRest.send(leadId, `/attachment:${attachmentURL}\n${content.html()}`);
        setIsSending(false);
        return;
      }
      const content = $(`<div>${item.original.description}</div>`);
      content.find('.mention').each((_, element) => {
        const mention = $(element);
        const mentionId = mention.attr('data-id');
        mention.removeClass('mention');
        mention.text(contact?.[mentionId]);
      });
      await dmRest.send(leadId, content.html());
      setIsSending(false);
    }
  };

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
      if (props.wa_id != chatIdentifier) return
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

    socket.on('message.updated', (props) => {
      if (props.wa_id != chatIdentifier) return
      const { id } = props;
      setMessages(prev => {
        return prev.map(m => m.id === id ? { ...m, ...props } : m);
      });
    })

    return () => {
      socket.off('message.created')
      socket.off('message.updated')
    }
  }, [socket, contact, messages, chatIdentifier])

  // Infinite scroll handler
  // useEffect(() => {
  //   if (messagesLoading) return
  //   const el = containerRef.current
  //   if (!el) return

  //   const handleScroll = () => {
  //     if (el.scrollTop === 0) {
  //       userIsScrollingUp.current = true
  //       loadMessages()
  //     }
  //   }

  //   el.addEventListener('scroll', handleScroll)
  //   return () => el.removeEventListener('scroll', handleScroll)
  // }, [containerRef, messagesLoading])

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

    if (isWhatsApp && !is24HourWindowOpen()) {
      Swal.fire({
        icon: 'warning',
        title: 'Ventana Expirada',
        text: 'La ventana de 24h ha expirado. Debes usar una Plantilla de WhatsApp autorizada escribiendo "/".',
        confirmButtonColor: '#f0ad4e'
      })
      return
    }

    const text = messageText.trim()
    if (!text && !audioBlob && !attachment) return

    setIsSending(true)

    const activeRest = isTikTokIntegration ? tiktokRest : (isMetaIntegration ? metaRest : whatsAppRest);

    if (attachment) {
      switch (attachmentType) {
        case 'audio':
          await activeRest.sendAudio(contact.id, audioBlob);
          break;
        case 'image':
          await activeRest.sendImage(contact.id, attachment, text);
          break;
        default:
          await activeRest.sendDocument(contact.id, attachment, text);
          break;
      }
      setAttachment(null)
      setAttachmentType(null)
    } else {
      await activeRest.send(contact.id, text)
    }
    setMessageText('')
    setIsSending(false)

    // Focus the input again so the user can type a new message
    setTimeout(() => {
      inputMessageRef.current?.focus()
    }, 100)
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
      .filter(m => m.wa_id == chatIdentifier)
      .sort((a, b) => a.microtime - b.microtime)[0] ?? { microtime: (Date.now() + 5 * 60 * 60 * 1000) * 1000 }
    setMessagesLoading(true)
    const result = await messagesRest.paginate({
      summary: {
        'contact_phone': chatIdentifier
      },
      filter: [
        ["microtime", "<", oldestMessage.microtime], "and",
        ["wa_id", "contains", chatIdentifier]
      ],
      sort: [{ selector: 'microtime', desc: true }],
      skip: 0,
      take: 60
    })
    setMessagesLoading(false)
    if (result?.data?.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newMessages = (result?.data ?? []).filter(m => !existingIds.has(m.id))
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
        'contact_phone': chatIdentifier
      },
      filter: [
        ["microtime", "<=", sinceMicrotime], "and",
        ["wa_id", "contains", chatIdentifier]
      ],
      sort: [{ selector: 'microtime', desc: true }],
      skip: 0,
      take: 60
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
  }, [contact?.id, leadId])

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

  const handleLeadUpdate = async (id, value, type) => {
    // Optimistic update locally in ChatContent
    if (type === 'is_pinned' || type === 'chat_status') {
      setContact(prev => prev ? { ...prev, [type === 'is_pinned' ? 'is_pinned' : 'chat_status_id']: value, chat_status: type === 'chat_status' ? (chatStatuses.find(s => s.id === value) || null) : prev.chat_status } : prev);
    }
    // Call parent onLeadUpdate
    await onLeadUpdate(id, value, type);
  }

  const handleDeleteChat = async () => {
    if (!contact) return;
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar conversación?',
      text: "Se borrarán los mensajes de esta conversación y se ocultará de la lista de chats. El lead permanecerá en el CRM.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ea5455',
      cancelButtonColor: '#82868b'
    });
    if (!isConfirmed) return;

    setIsSending(true);
    const result = await leadsRest.deleteChat(contact.id);
    setIsSending(false);

    if (result) {
      setLeadId(null);
      setContactDetails(null);
      onLeadUpdate(contact.id, null, 'chat_deleted');
    }
  };

  return <>
    <ChatHeader contact={contact} contactDetails={contactDetails} setContactDetails={setContactDetails} loading={contactLoading} theme={theme} chatStatuses={chatStatuses} onLeadUpdate={handleLeadUpdate} onDeleteChat={handleDeleteChat} />
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
              {
                can('chats', 'create') && (
                  <>
                    {/* Warning Banners above the message input */}
                    {isWhatsApp && !is24HourWindowOpen() && (
                      isWithin72HourCampaignWindow() ? (
                        <div className="mx-3 mb-2 p-2 rounded border d-flex align-items-center animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)', fontSize: '11px', textAlign: 'left', zIndex: 2 }}>
                          <i className="mdi mdi-gift-outline font-16 me-2 animate__animated animate__bounceIn"></i>
                          <span>
                            <strong>Beneficio de Anuncio:</strong> Plantilla <strong>gratuita</strong> (te quedan <strong>{getRemaining72HourTime()}</strong>). Escribe <strong>"/"</strong> para seleccionar.
                          </span>
                        </div>
                      ) : (
                        <div className="mx-3 mb-2 p-2 rounded border d-flex align-items-center animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(240, 173, 78, 0.1)', color: '#d9534f', borderLeft: '4px solid #f0ad4e', fontSize: '11px', textAlign: 'left', zIndex: 2 }}>
                          <i className="mdi mdi-alert-circle-outline font-16 me-2 text-warning animate__animated animate__flash"></i>
                          <span>
                            La ventana de 24h ha expirado. Escribe <strong>"/"</strong> para seleccionar una plantilla autorizada.
                          </span>
                        </div>
                      )
                    )}

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
                              <button className={`dropdown-item ${isWhatsApp && !is24HourWindowOpen() ? 'text-muted opacity-50' : ''}`} style={{ cursor: isWhatsApp && !is24HourWindowOpen() ? 'not-allowed' : 'pointer' }} disabled={isWhatsApp && !is24HourWindowOpen()} onClick={(e) => {
                                e.preventDefault()
                                if (isWhatsApp && !is24HourWindowOpen()) return;
                                fileInputRef.current?.setAttribute('accept', '*')
                                fileInputRef.current?.click()
                              }}>
                                <i className="mdi mdi-file-document me-2" style={{ color: '#7F66FF' }} />
                                Documentos
                              </button>
                              <button className={`dropdown-item ${isWhatsApp && !is24HourWindowOpen() ? 'text-muted opacity-50' : ''}`} style={{ cursor: isWhatsApp && !is24HourWindowOpen() ? 'not-allowed' : 'pointer' }} disabled={isWhatsApp && !is24HourWindowOpen()} onClick={(e) => {
                                e.preventDefault()
                                if (isWhatsApp && !is24HourWindowOpen()) return;
                                fileInputRef.current?.setAttribute('accept', 'image/*,video/*')
                                fileInputRef.current?.click()
                              }}>
                                <i className="mdi mdi-image me-2" style={{ color: '#007BFC' }} />
                                Fotos y videos
                              </button>
                              <button className={`dropdown-item ${isWhatsApp && !is24HourWindowOpen() ? 'text-muted opacity-50' : ''}`} style={{ cursor: isWhatsApp && !is24HourWindowOpen() ? 'not-allowed' : 'pointer' }} disabled={isWhatsApp && !is24HourWindowOpen()} onClick={(e) => {
                                e.preventDefault()
                                if (isWhatsApp && !is24HourWindowOpen()) return;
                                setIsOpenCamera(true)
                              }}>
                                <i className="mdi mdi-camera me-2" style={{ color: '#FF2E74' }} />
                                Cámara
                              </button>
                              <button className={`dropdown-item ${isWhatsApp && !is24HourWindowOpen() ? 'text-muted opacity-50' : ''}`} style={{ cursor: isWhatsApp && !is24HourWindowOpen() ? 'not-allowed' : 'pointer' }} disabled={isWhatsApp && !is24HourWindowOpen()} onClick={(e) => {
                                e.preventDefault()
                                if (isWhatsApp && !is24HourWindowOpen()) return;
                                fileInputRef.current?.setAttribute('accept', 'audio/*')
                                fileInputRef.current?.click()
                              }}>
                                <i className="mdi mdi-headphones me-2" style={{ color: '#FB6533' }} />
                                Audio
                              </button>
                              {isWhatsApp && (
                                <button className="dropdown-item" href="#" onClick={(e) => {
                                  e.preventDefault()
                                  openTemplatesModal()
                                }}>
                                  <i className="mdi mdi-whatsapp me-2" style={{ color: '#25D366' }} />
                                  Plantilla WhatsApp
                                </button>
                              )}
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
                                  getSlashSuggestions(messageText).map((item, idx) => {
                                    return (
                                      <div key={idx} className="dropdown-item d-flex align-items-center justify-content-between py-2 border-bottom" type="button" style={{ width: '320px', whiteSpace: 'normal', cursor: 'pointer' }} onClick={() => handleSuggestionClick(item)}>
                                        <div style={{ maxWidth: '220px' }}>
                                          <span className="d-block text-truncate fw-bold font-12" style={{ color: item.type === 'meta' ? '#28c76f' : '#7F66FF' }}>/{item.name}</span>
                                          <small className="d-block text-muted text-truncate" style={{ fontSize: '10px' }}>{item.description}</small>
                                        </div>
                                        <div>
                                          {item.type === 'meta' ? (
                                            <span className="badge border" style={{ fontSize: '9px', padding: '2px 4px', backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)' }}>Meta</span>
                                          ) : (
                                            <span className="badge border" style={{ fontSize: '9px', padding: '2px 4px', backgroundColor: 'rgba(127, 102, 255, 0.12)', color: '#7F66FF', borderColor: 'rgba(127, 102, 255, 0.24)' }}>Local</span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                }
                              </div>
                              <textarea
                                ref={inputMessageRef}
                                id="message-input"
                                className="form-control w-100"
                                placeholder={isWhatsApp && !is24HourWindowOpen() ? "Escribe '/' para enviar plantilla..." : "Ingrese su mensaje aquí"}
                                rows={1}
                                style={{ minHeight: '38px', maxHeight: '188px', fieldSizing: 'content', resize: 'none', border: 'none', backgroundColor: 'transparent' }}
                                disabled={isSending || !!audioBlob || !!cameraBlob || !!previewBlob}
                                value={messageText}
                                onChange={(e) => {
                                  let newValue = e.target.value
                                  if (isWhatsApp && !is24HourWindowOpen()) {
                                    if (newValue.length > 0 && !newValue.startsWith('/')) {
                                      newValue = '/' + newValue
                                    }
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
                                  disabled={isSending || (isWhatsApp && !is24HourWindowOpen())}
                                  style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
                                  title={isWhatsApp && !is24HourWindowOpen() ? "Grabación deshabilitada (ventana expirada)" : "Grabar audio"}
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
                )
              }
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

      <Modal modalRef={templatesModalRef} title="Enviar Plantilla de WhatsApp" hideFooter zIndex={1055}>
        {isTemplatesLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando plantillas...</span>
            </div>
            <div className="mt-2 text-muted">Obteniendo plantillas autorizadas desde Meta...</div>
          </div>
        ) : (Array.isArray(templates) && templates.length === 0) ? (
          <div className="text-center py-4">
            <div className="text-warning mb-3">
              <i className="mdi mdi-alert-circle-outline" style={{ fontSize: '32px' }}></i>
            </div>
            <h5 className="fw-bold">No hay plantillas de Meta aprobadas</h5>
            <p className="text-muted small px-3">
              No se han encontrado plantillas creadas y aprobadas en tu cuenta de WhatsApp Business. 
              Puedes crear y registrar una plantilla nueva directamente desde la sección de 
              <strong> Mensajes Predeterminados</strong> en el panel de administración.
            </p>
            <div className="mt-3">
              <a href="/default-messages" className="btn btn-sm btn-primary rounded-pill px-3">
                <i className="mdi mdi-plus-circle-outline me-1"></i>Crear Plantilla
              </a>
            </div>
          </div>
        ) : (
          <div className="text-start">
            {!hasPaymentMethod && (
              <div className="alert alert-danger mb-3 text-start small border-0 shadow-sm" style={{ borderRadius: '8px', backgroundColor: 'rgba(220, 53, 69, 0.08)', color: '#dc3545', borderLeft: '4px solid #dc3545' }}>
                <i className="mdi mdi-credit-card-off-outline me-1"></i>
                <strong>Sin método de pago en Meta:</strong> No se detectó un método de pago válido en tu cuenta de WhatsApp Business. Los envíos de plantillas fallarán. Configura una tarjeta en el panel de Meta.
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-bold">Seleccionar Plantilla</label>
              <select className="form-select" onChange={handleTemplateChange} value={selectedTemplate?.name || ""} required>
                <option value="" disabled>-- Seleccione una plantilla --</option>
                {(Array.isArray(templates) ? templates : []).map((tpl, i) => (
                  <option key={i} value={tpl.name}>{tpl.name} ({tpl.language})</option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <>
                {/* Variable inputs */}
                {Object.keys(templateParams).length > 0 && (
                  <div className="mb-3 p-3 bg-light rounded">
                    <h6 className="fw-bold mb-2">Variables de la plantilla:</h6>
                    {Object.keys(templateParams).map((key) => (
                      <div className="mb-2" key={key}>
                        <label className="form-label small mb-1">Variable {'{{' + key + '}}'}</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={templateParams[key]}
                          onChange={(e) => {
                            setTemplateParams(prev => ({ ...prev, [key]: e.target.value }))
                          }}
                          placeholder={`Valor para {{${key}}}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Template Preview */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Vista previa del mensaje:</label>
                  <div className="p-3 border rounded bg-white font-13" style={{ whiteSpace: 'pre-wrap', borderLeft: '4px solid #25D366' }}>
                    {getReplacedTemplateText()}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button type="button" className="btn btn-sm btn-danger" data-bs-dismiss="modal">Cancelar</button>
                  <button type="button" className="btn btn-sm btn-success" onClick={onSendTemplateSubmit} disabled={isSendingTemplate}>
                    {isSendingTemplate ? (
                      <><i className="mdi mdi-spin mdi-loading me-1"></i>Enviando...</>
                    ) : (
                      <><i className="mdi mdi-send me-1"></i>Enviar plantilla</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  </>
}

export default ChatContent