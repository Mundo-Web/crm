import React, { useEffect, useRef, useState } from "react"
import MessagesRest from "../actions/MessagesRest"
import LaravelSession from "../Utils/LaravelSession"
import Global from "../Utils/Global"
import WhatsAppRest from "../actions/WhatsAppRest"
import Modal from "./Modal"
import Tippy from "@tippyjs/react"
import UsersRest from "../actions/UsersRest"
import HtmlContent from "../Utils/HtmlContent"
import '../../css/whatsapp.css'
import wa2html from "../Utils/wa2html"
import ArrayJoin from "../Utils/ArrayJoin"
import MetaRest from "../actions/MetaRest"

const messagesRest = new MessagesRest()
const whatsAppRest = new WhatsAppRest()
const usersRest = new UsersRest()
const metaRest = new MetaRest()

const OffCanvas = ({ offCanvasRef, dataLoaded, setDataLoaded, defaultMessages, signs, onOpenModal = () => { }, onLeadClicked = () => { }, waPhone }) => {

  if (!offCanvasRef) offCanvasRef = useRef()
  const inputMessageRef = useRef()
  const defaultMessagesRef = useRef()
  const defaultMessagesButtonRef = useRef()
  const signsModalRef = useRef()
  const templatesModalRef = useRef()
  const messagesContainerRef = useRef()

  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ttl, setTtl] = useState(500)
  const [defaultMessagesVisible, setDefaultMessagesVisible] = useState(false)
  const [defaultSign, setDefaultSign] = useState(LaravelSession.service_user.whatsapp_sign)

  let medio = ['messenger', 'instagram'].includes(dataLoaded?.integration?.meta_service) ? dataLoaded?.integration?.meta_service : 'whatsapp';

  const getMessages = async () => {
    const lastMessage = await getLastMessage()

    const filter = [['microtime', '>', lastMessage.microtime]]

    switch (dataLoaded?.integration?.meta_service) {
      case 'messenger':
        filter.push(['wa_id', '=', dataLoaded?.integration_user_id])
        break;

      case 'instagram':
        filter.push(['wa_id', '=', dataLoaded?.integration_user_id])
        break;
      default:
        if (dataLoaded?.contact_phone)
          filter.push(['wa_id', 'contains', dataLoaded?.contact_phone])
        break;
    }

    setIsLoading(true)
    const { data } = await messagesRest.paginate({
      isLoadingAll: true,
      filter: ArrayJoin(filter, 'and'),
      sort: [{
        selector: 'microtime',
        desc: false
      }]
    })
    setIsLoading(false)

    if (!data || !dataLoaded.id) return

    if (data.length > 0) setTtl(500)
    else setTtl(2500)

    const newMessages = await getCacheMessages()
    newMessages.push(...data)
    setMessages(newMessages.sort((a, b) => b.microtime - a.microtime))
  }

  const getCacheMessages = async () => {
    const cache = await caches.open('messages');
    const chat = await cache.match(`${LaravelSession.business_uuid}/${dataLoaded.id}`)
    if (!chat) return []
    const messages = await chat.json()
    return messages ?? []
  }

  const getLastMessage = async () => {
    const messages = await getCacheMessages()
    return messages.sort((a, b) => b.microtime - a.microtime)[0] ?? { microtime: 0 }
  }

  const onMessageSubmit = async (e) => {
    e.preventDefault()

    const message = inputMessageRef.current.value
    const client_id = dataLoaded.id
    setIsSending(true)
    let result = null
    if (medio == 'whatsapp') {
      result = await whatsAppRest.send(client_id, message)
    } else {
      result = await metaRest.send(client_id, message)
    }
    setIsSending(false)

    if (!result) return
    inputMessageRef.current.value = ''
    // obtener nuevos mensajes
  }

  const onDefaultSignChanged = async (e) => {
    const signId = e.target.value
    const result = await usersRest.setDefaultSign({
      type: 'whatsapp',
      sign: signId
    })
    if (!result) return
    setDefaultSign(signId)
  }

  const onModalSignatureClicked = () => {
    $(signsModalRef.current).modal('show')
  }

  const sendSignature = async () => {
    const sign = signs.find(sign => sign.id == defaultSign)
    const signature = `${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/repository/signs/${sign.sign}`
    setIsSending(true)
    await whatsAppRest.send(dataLoaded?.id, `/signature:${signature}`)
    setIsSending(false)
  }

  useEffect(() => {
    if (!dataLoaded?.id) return
    caches.open('messages').then(cache => {
      cache.put(`${LaravelSession.business_uuid}/${dataLoaded.id}`, new Response(JSON.stringify(messages)))
    })

    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      const parent = $(element).parent()[0];
      // Only auto-scroll if already at bottom
      // Check if scrolled to bottom or top
      const isAtBottom = parent.scrollHeight - parent.scrollTop === parent.clientHeight;
      const isAtTop = parent.scrollTop === 0;

      // Auto-scroll if at bottom
      if (isAtBottom || isAtTop) {
        parent.scrollTop = element.scrollHeight;
      }
    }
  }, [messages])

  useEffect(() => {
    if (!dataLoaded?.contact_phone) return
    getCacheMessages().then(messages => {
      setMessages(messages)
      getMessages();
    })
  }, [dataLoaded])

  useEffect(() => {
    if (!dataLoaded?.id) return
    const interval = setInterval(async () => {
      if (!isLoading) {
        await getMessages()
      }
    }, ttl);
    return () => clearInterval(interval);
  }, [dataLoaded, isLoading, ttl])

  useEffect(() => {
    offCanvasRef.current.addEventListener('hidden.bs.offcanvas', () => {
      setDataLoaded(null)
      setMessages([]);
    });
    document.addEventListener('click', (e) => {
      if (!defaultMessagesRef.current?.contains(e.target) && (defaultMessagesButtonRef.current != e.target || !defaultMessagesButtonRef.current?.contains(e.target))) {
        setDefaultMessagesVisible(false)
      }
    })
  }, [null]);

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
      const clientName = dataLoaded?.contact_name || ''
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
    const clientId = dataLoaded?.id
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
      getMessages()
    }
  }

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
    if (!dataLoaded?.campaign_id) return false;
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

  const finalDefaultMessages = defaultMessages.filter(({ type }) => type === 'whatsapp')

  return <>
    <form ref={offCanvasRef} className="offcanvas offcanvas-end" tabIndex="-1" aria-labelledby="offcanvasRightLabel" style={{
      visibility: 'hidden',
      width: '95%',
      maxWidth: '600px',
      zIndex: 1041
    }}
      aria-hidden="true"
      onSubmit={onMessageSubmit}>
      <div className="offcanvas-header border-bottom gap-2">
        <div className="d-flex gap-2 align-items-center w-100" onClick={() => onLeadClicked(dataLoaded)} style={{ cursor: 'pointer' }}>
          <img
            className="avatar-sm rounded-circle border"
            src={`/api/whatsapp/profile/${dataLoaded?.integration_user_id || dataLoaded?.contact_phone}`}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = `//${Global.APP_DOMAIN}/api/profile/thumbnail/undefined`;
            }} alt={dataLoaded?.contact_name} />
          <div>
            <h5 className="my-0">{dataLoaded?.contact_name}</h5>
            {
              medio == 'whatsapp'
                ? <small className="text-muted">+{dataLoaded?.contact_phone}</small>
                : <small className="text-muted">{dataLoaded?.integration_user_id}</small>
            }
          </div>
        </div>
        <div className="d-flex gap-1 align-items-center">
          <div className="dropdown">
            <i className="mdi  mdi-18px mdi-dots-vertical dropdown-toggle" type="button" id="offcanvas-options" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" />
            <div className="dropdown-menu" aria-labelledby="offcanvas-options">
              <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onOpenModal(dataLoaded)}>
                <i className="mdi mdi-eye me-1" style={{ width: '20px' }}></i>
                Editar datos del lead
              </span>
              <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={onModalSignatureClicked}>
                <i className="fa fa-signature me-1" style={{ width: '20px' }}></i>
                Ver firmas disponibles
              </span>
              <span className="dropdown-item" style={{ cursor: 'pointer' }} data-bs-dismiss="offcanvas">
                <i className="mdi mdi-close me-1" style={{ width: '20px' }}></i>
                Cerrar chat
              </span>
            </div>
          </div>
          <i className="mdi  mdi-18px mdi-close" data-bs-dismiss="offcanvas" style={{ cursor: 'pointer' }}></i>
        </div>
      </div>

      <div className="offcanvas-body">
        <ul ref={messagesContainerRef} className="conversation-list slimscroll w-100 align-items-bottom"
          data-simplebar>
          {
            messages.sort((a, b) => a.microtime - b.microtime).map((message, i) => {
              const content = message.message.replace(/\{\{.*?\}\}/gs, '')
              const fromMe = message.role !== 'Human'
              let attachment = ''
              if (content.startsWith('/attachment:')) {
                attachment = content.split('\n')[0]
              }
              if (message.role == 'Form') {
                return <li>
                  <div class="chat-day-title" bis_skin_checked="1">
                    <small class="title badge badge-soft-dark rounded-pill">{content}</small>
                  </div>
                </li>
              }
              return <li key={i} className={message.role == 'Human' ? '' : 'odd'}>
                <div className="message-list">
                  <div className="chat-avatar">
                    <img
                      className="border"
                      style={{ aspectRatio: 1 }}
                      src={fromMe
                        ? `/api/whatsapp/profile/${waPhone}`
                        : `/api/whatsapp/profile/${message.wa_id}`}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `//${Global.APP_DOMAIN}/api/profile/thumbnail/undefined`;
                      }} alt={dataLoaded?.contact_name} />
                  </div>
                  <div className="conversation-text">
                    <div className="ctext-wrap" onDoubleClick={() => {
                      if (message.prompt) console.log(message.prompt)
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
                      {/* <span className="user-name">{message.role == 'Human' ? dataLoaded?.contact_name : ''}</span> */}
                      {
                        content.startsWith('/signature:')
                          ? <img src={content.replace('/signature:', '')} alt={`${LaravelSession.service_user.fullname} signature`}
                            style={{
                              minWidth: '300px',
                              maxWidth: '100%',
                              minHeight: '200px',
                              maxHeight: '300px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                            }}
                            onError={e => {
                              e.target.onerror = null
                              e.target.src = `//placehold.co/500x200?text=404`;
                            }}
                          />
                          : <>
                            {
                              attachment && <>
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
                                  onError={e => {
                                    $(e.target).remove()
                                  }}
                                />
                                <div className="d-flex justify-content-end">
                                  <a
                                    className="btn btn-xs btn-white mb-1 text-nowrap d-flex text-end"
                                    href={attachment.replace('/attachment:', '')}
                                    target="_blank"
                                    download
                                  >
                                    <i className="mdi mdi-download me-1"></i>
                                    <span>Descargar adjunto</span>
                                  </a>
                                </div>
                              </>
                            }
                            {/* <p>{content.replace(attachment, '')}</p> */}
                            <HtmlContent className='text-start' html={wa2html(content.replace(attachment, ''))} />
                            {/* Campaign preview box */}
                          </>
                      }
                    </div>
                    <span className="time">{moment(message.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                  </div>
                </div>
              </li>
            })
          }
        </ul>
      </div>

      <div className="offcanvas-footer">
        {medio === 'whatsapp' && !is24HourWindowOpen() ? (
          <div className="alert m-2 text-start small border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: 'rgba(240, 173, 78, 0.1)', color: '#d9534f', borderLeft: '4px solid #f0ad4e', padding: '16px' }}>
            <div className="d-flex align-items-center mb-2">
              <i className="mdi mdi-alert-circle-outline font-18 me-2 text-warning"></i>
              <h6 className="alert-heading fw-bold mb-0 text-warning" style={{ fontSize: '13px' }}>
                Ventana de conversación cerrada (24h expiradas)
              </h6>
            </div>
            <p className="mb-0 text-muted small" style={{ lineHeight: '1.5' }}>
              Para reiniciar la comunicación y poder chatear libremente, Meta exige el uso de una <strong>Plantilla de WhatsApp autorizada</strong>. 
              Una vez que envíes la plantilla y el cliente responda, se reactivará una nueva ventana gratuita de conversación libre de cargos.
            </p>
            {isWithin72HourCampaignWindow() && (
              <div className="mt-2 p-2 rounded border d-flex align-items-center" style={{ backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)', fontSize: '11px', textAlign: 'left' }}>
                <i className="mdi mdi-gift-outline font-16 me-2"></i>
                <span>
                  <strong>Beneficio de Anuncio:</strong> Este cliente proviene de un anuncio y está dentro de las 72h de gracia (te quedan <strong>{getRemaining72HourTime()}</strong>). El envío de esta plantilla será <strong>100% gratuito</strong> en tu facturación de Meta.
                </span>
              </div>
            )}
            <div className="mt-3 text-end">
              <button type="button" className="btn btn-xs btn-warning px-3 rounded-pill" onClick={openTemplatesModal}>
                <i className="mdi mdi-whatsapp me-1"></i> Seleccionar plantilla
              </button>
            </div>
          </div>
        ) : (
          <>
            <div ref={defaultMessagesRef} className="p-2" onClick={(e) => e.stopPropagation()} hidden={!defaultMessagesVisible} style={{
              transition: 'all .125s'
            }}>
              <div className="d-flex gap-2">
                {
                  finalDefaultMessages.map((message, i) => {
                    return <span key={i}
                      className="badge bg-light text-dark"
                      style={{ cursor: 'pointer' }}
                      onClick={async () => {
                        setDefaultMessagesVisible(false)
                        setIsSending(true)
                        if (message.attachments.length > 0) {
                          const attachment = message.attachments[0]
                          const attachmentURL = `${Global.APP_URL}/cloud/${attachment.file}`

                          const content = $(`<div>${message.description}</div>`)
                          content.find('.mention').each((_, element) => {
                            const mention = $(element)
                            const mentionId = mention.attr('data-id')
                            mention.removeClass('mention')
                            mention.text(dataLoaded[mentionId])
                          })

                          await whatsAppRest.send(dataLoaded?.id, `/attachment:${attachmentURL}\n${content.html()}`)
                          setIsSending(false)
                          return
                        }
                        await whatsAppRest.send(dataLoaded?.id, message.description)
                        setIsSending(false)
                        // setDefaultMessagesVisible(false)
                        // inputMessageRef.current.value = message.description
                      }}
                      title={message.description}>
                      {message.name}
                    </span>
                  })
                }
              </div>
            </div>
            <div className="d-flex gap-2 p-2 align-items-end">
              <textarea ref={inputMessageRef}
                className='form-control w-100'
                placeholder='Ingrese su mensaje aqui'
                rows={1}
                style={{ minHeight: 27, fieldSizing: 'content' }}
                disabled={isSending}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputMessageRef.current.value.trim()) {
                      onMessageSubmit(e);
                    }
                  }
                }}
              />
              <div className="d-flex gap-1">

                <div className="dropdown">
                  <button className="btn btn-white dropdown-toggle px-1" type="button" id="message-options" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i className="mdi mdi-plus"></i>
                  </button>
                  <div className="dropdown-menu" aria-labelledby="message-options">
                    {
                      defaultSign
                        ? <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={sendSignature}>
                          <i className="fa fa-signature me-1" style={{ width: '20px' }}></i>
                          Enviar firma
                        </span>
                        : <Tippy content="Selecciona una firma por defecto">
                          <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={onModalSignatureClicked}>
                            <i className="fa fa-signature me-1" style={{ width: '20px' }}></i>
                            Enviar firma
                          </span>
                        </Tippy>
                    }
                    {
                      finalDefaultMessages?.length > 0 &&
                      <span ref={defaultMessagesButtonRef} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => setDefaultMessagesVisible(true)}>
                        <i className="mdi mdi-message-bulleted me-1" style={{ width: '20px' }}></i>
                        Mensajes predeterminados
                      </span>
                    }
                    {
                      medio === 'whatsapp' &&
                      <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={openTemplatesModal}>
                        <i className="mdi mdi-whatsapp me-1" style={{ width: '20px' }}></i>
                        Plantilla de WhatsApp
                      </span>
                    }
                  </div>
                </div>
                <button className="btn btn-dark waves-effect waves-light" type="submit" disabled={isSending}>
                  {
                    isSending
                      ? <i className="mdi mdi-spin mdi-loading"></i>
                      : <i className="mdi mdi-arrow-top-right"></i>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </form>
    <Modal modalRef={signsModalRef} title="Tus firmas" hideFooter>
      <b className="d-block">¿Desea seleccionar una de sus firmas disponibles como predeterminado?</b>
      <div className="row mt-2">
        {signs.map((sign, index) => (
          <div key={index} className="col-md-6">
            <Tippy content='Marcar como predeterminado'>
              <label className="card border" style={{ cursor: 'pointer' }}>
                <div className="card-header d-flex gap-1 align-items-center py-1 px-2">
                  <input
                    type="radio"
                    name="sign"
                    className="form-check-input my-0"
                    id={`sign-${sign.id}`}
                    checked={sign.id == defaultSign}
                    onChange={onDefaultSignChanged}
                    value={sign.id}
                  />
                  <b className="d-block my-0 w-100 text-truncate">{sign.name || 'Sin nombre'}</b>
                </div>
                <div className="card-body p-0">
                  <img
                    src={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/repository/signs/${sign.sign}`}
                    alt={sign.name}
                    className="img-fluid w-100"
                    style={{
                      objectFit: 'cover',
                      aspectRatio: 5 / 2
                    }}
                  />
                </div>
              </label>
            </Tippy>
          </div>
        ))}
      </div>
    </Modal>

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
            <select className="form-select" onChange={handleTemplateChange} defaultValue="" required>
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
  </>
}

export default OffCanvas