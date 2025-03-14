import React, { useEffect, useRef, useState } from "react"
import MessagesRest from "../actions/MessagesRest"
import LaravelSession from "../Utils/LaravelSession"
import Global from "../Utils/Global"
import WhatsAppRest from "../actions/WhatsAppRest"
import Modal from "./Modal"

const messagesRest = new MessagesRest()
const whatsAppRest = new WhatsAppRest()

const OffCanvas = ({ offCanvasRef, dataLoaded, setDataLoaded, defaultMessages, onOpenModal = () => { }, onLeadClicked = () => { } }) => {

  if (!offCanvasRef) offCanvasRef = useRef()
  const inputMessageRef = useRef()
  const defaultMessagesRef = useRef()
  const defaultMessagesButtonRef = useRef()
  const signsModalRef = useRef()

  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ttl, setTtl] = useState(500)
  const [defaultMessagesVisible, setDefaultMessagesVisible] = useState(false)

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

  const getMessages = async () => {
    const lastMessage = await getLastMessage()
    setIsLoading(true)
    const { data } = await messagesRest.paginate({
      isLoadingAll: true,
      filter: [
        ['wa_id', 'contains', dataLoaded?.contact_phone],
        'and',
        ['microtime', '>', lastMessage.microtime]
      ],
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
    const result = await whatsAppRest.send(client_id, message)
    setIsSending(false)

    if (!result) return
    inputMessageRef.current.value = ''
    // obtener nuevos mensajes
  }

  useEffect(() => {
    if (!dataLoaded?.id) return
    caches.open('messages').then(cache => {
      cache.put(`${LaravelSession.business_uuid}/${dataLoaded.id}`, new Response(JSON.stringify(messages)))
    })
  }, [messages])

  useEffect(() => {
    offCanvasRef.current.addEventListener('hidden.bs.offcanvas', () => {
      setDataLoaded(null)
      setMessages([]);
    });
    document.addEventListener('click', (e) => {
      if (!defaultMessagesRef.current.contains(e.target) && (defaultMessagesButtonRef.current != e.target || !defaultMessagesButtonRef.current.contains(e.target))) {
        setDefaultMessagesVisible(false)
      }
    })
  }, [null]);

  return <>
    <form ref={offCanvasRef} className="offcanvas offcanvas-end" tabIndex="-1" aria-labelledby="offcanvasRightLabel" style={{
      visibility: 'hidden',
      width: '95%',
      maxWidth: '600px'
    }}
      aria-hidden="true"
      onSubmit={onMessageSubmit}>
      <div className="offcanvas-header border-bottom">
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
            <small className="text-muted">+{dataLoaded?.contact_phone}</small>
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
              <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => $(signsModalRef.current).modal('show')}>
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
        <ul className="conversation-list slimscroll w-100 align-items-bottom"
          data-simplebar>
          {
            messages.sort((a, b) => a.microtime - b.microtime).map((message, i) => {
              const content = message.message.replace(/\{\{.*?\}\}/gs, '')
              const fromMe = message.role !== 'Human'
              return <li key={i} className={message.role == 'Human' ? '' : 'odd'}>
                <div className="message-list">
                  <div className="chat-avatar">
                    <img
                      className="border"
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
                              maxHeight: '200px',
                              borderRadius: '4px'
                            }}
                            onError={e => {
                              e.target.onerror = null
                              e.target.src = `//placehold.co/500x200?text=404`;
                            }}
                          />
                          : <p>{content}</p>
                      }
                      {/* <p>
                      {content}
                    </p> */}
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
              defaultMessages.map((message, i) => {
                return <span key={i}
                  className="badge bg-light text-dark"
                  style={{ cursor: 'pointer' }}
                  onClick={async () => {
                    // setDefaultMessagesVisible(false)
                    // setIsSending(true)
                    // await whatsAppRest.send(dataLoaded?.id, message.description)
                    // setIsSending(false)
                    setDefaultMessagesVisible(false)
                    inputMessageRef.current.value = message.description
                  }}
                  title={message.description}>
                  {message.name}
                </span>
              })
            }
          </div>
        </div>
        <div className="d-flex gap-2 p-2 align-items-bottom">
          <textarea ref={inputMessageRef}
            className='form-control w-100'
            placeholder='Ingrese su mensaje aqui'
            rows={1}
            style={{ minHeight: 27, fieldSizing: 'content' }}
            disabled={isSending}
            required />
          <div className="d-flex gap-1">
            {
              (LaravelSession.service_user.mailing_sign || defaultMessages?.length > 0) &&
              <div className="dropdown">
                <button className="btn btn-light dropdown-toggle px-1" type="button" id="message-options" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <i className="mdi mdi-plus"></i>
                </button>
                <div className="dropdown-menu" aria-labelledby="message-options">
                  {
                    LaravelSession.service_user.mailing_sign &&
                    <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={async () => {
                      const mailing_sign = LaravelSession.service_user.mailing_sign
                      const signature = `${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/repository/signs/${mailing_sign}`
                      setIsSending(true)
                      await whatsAppRest.send(dataLoaded?.id, `/signature:${signature}`)
                      setIsSending(false)
                    }}>
                      <i className="fa fa-signature me-1" style={{ width: '20px' }}></i>
                      Enviar firma
                    </span>
                  }
                  {
                    defaultMessages?.length > 0 &&
                    <span ref={defaultMessagesButtonRef} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => setDefaultMessagesVisible(true)}>
                      <i className="mdi mdi-message-bulleted me-1" style={{ width: '20px' }}></i>
                      Mensajes predeterminados
                    </span>
                  }
                </div>
              </div>
            }
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
    <Modal modalRef={signsModalRef} title="Tus firmas">
      <b className="d-block">¿Desea seleccionar una de sus firmas disponibles como predeterminado?</b>
      <div>

      </div>
    </Modal>
  </>
}

export default OffCanvas