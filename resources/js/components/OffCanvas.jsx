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

const OffCanvas = ({ offCanvasRef, dataLoaded, setDataLoaded, defaultMessages, signs, onOpenModal = () => { }, onLeadClicked = () => { } }) => {

  if (!offCanvasRef) offCanvasRef = useRef()
  const inputMessageRef = useRef()
  const defaultMessagesRef = useRef()
  const defaultMessagesButtonRef = useRef()
  const signsModalRef = useRef()
  const messagesContainerRef = useRef()

  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ttl, setTtl] = useState(500)
  const [defaultMessagesVisible, setDefaultMessagesVisible] = useState(false)
  const [defaultSign, setDefaultSign] = useState(LaravelSession.service_user.whatsapp_sign)

  let medio = dataLoaded?.integration ? dataLoaded?.integration?.meta_service : 'whatsapp';

  console.log(medio)

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
            src={`${Global.WA_URL}/api/profile/${LaravelSession.business_uuid}/${dataLoaded?.contact_phone}`}
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
              return <li key={i} className={message.role == 'Human' ? '' : 'odd'}>
                <div className="message-list">
                  <div className="chat-avatar">
                    <img
                      className="border"
                      style={{ aspectRatio: 1 }}
                      src={fromMe
                        ? `//${Global.APP_DOMAIN}/api/profile/thumbnail/${LaravelSession.relative_id}`
                        : `${Global.WA_URL}/api/profile/${LaravelSession.business_uuid}/${message.wa_id}`}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `//${Global.APP_DOMAIN}/api/profile/thumbnail/undefined`;
                      }} alt={dataLoaded?.contact_name} />
                  </div>
                  <div className="conversation-text">
                    <div className="ctext-wrap">
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
            required />
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
              </div>
            </div>
            <button className="btn btn-dark waves-effect waves-light" type="submit" disabled={isSending}>
              {
                isSending
                  ? <i className="mdi mdi-spinner mdi-loading"></i>
                  : <i className="mdi mdi-arrow-top-right"></i>
              }
            </button>
          </div>
        </div>
        {/* <div className="form-group p-2">
        <div className="input-group">
          <input ref={inputMessageRef} type="text" className="form-control" placeholder="Ingrese su mensaje aqui" required disabled={isSending} />
          <button className="btn input-group-text btn-dark waves-effect waves-light" type="submit" disabled={isSending}>
            {
              isSending
                ? <i className="mdi mdi-spinner "></i>
                : <i className="mdi mdi-arrow-top-right"></i>
            }
          </button>
        </div>
      </div> */}
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
  </>
}

export default OffCanvas