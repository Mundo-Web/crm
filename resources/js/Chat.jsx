import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react';
import Global from './Utils/Global.js';
import { useEffect, useRef, useState } from 'react';
import LeadsRest from './actions/LeadsRest.js';
import useWebSocket from './Reutilizables/CustomHooks/useWebSocket.jsx';
import MessagesRest from './actions/MessagesRest.js';
import ChatContent from './Reutilizables/Chat/ChatContent.jsx';

const leadsRest = new LeadsRest()
leadsRest.paginateSufix = null
const messagesRest = new MessagesRest()

const Chat = ({ users }) => {

  const [leads, setLeads] = useState([])
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [selectedUsersId, setSelectedUsersId] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const { socket } = useWebSocket({ lead_id: activeLeadId })
  const messagesContainerRef = useRef()

  const currentLead = leads.find(l => l.id == activeLeadId);
  const filteredMessages = messages.filter(m => m.wa_id == currentLead?.contact_phone);

  const getFirstLeads = async () => {
    setLoadingLeads(true);
    const { data } = await leadsRest.paginate({ limit: 40 });
    setLeads(data ?? []);
    setLoadingLeads(false);
  }

  const getMessages = async () => {
    if (!currentLead) return
    if (loadingMessages) return
    setLoadingMessages(true)
    const lastMessage = messages.sort((a, b) => b.microtime - a.microtime)[0] ?? { microtime: 0 }
    const result = await messagesRest.paginate({
      filter: [
        ["microtime", ">", lastMessage.microtime], "and",
        ["wa_id", "contains", currentLead.contact_phone]
      ],
      sort: [{ selector: 'microtime', desc: false }]
    })
    setMessages(prev => [...prev, ...(result.data ?? [])].sort((a, b) => a.microtime - b.microtime))
    setLoadingMessages(false)
  }

  useEffect(() => {
    getFirstLeads()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveLeadId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!activeLeadId) return;
    setMessages([])
    getMessages()
  }, [activeLeadId]);

  useEffect(() => {
    if (!socket) return
    socket.on('message', (props) => {
      const { wa_id } = props;
      setMessages(prev => {
        const exists = prev.find(m => m.wa_id === wa_id);
        if (exists) {
          return prev.map(m => m.wa_id === wa_id ? { ...m, ...props } : m);
        }
        return [...prev, props].sort((a, b) => a.microtime - b.microtime);
      });
    })
    return () => {
      socket.off('message')
    }
  }, [socket])

  useEffect(() => {
    if (!messagesContainerRef.current) return
    const el = messagesContainerRef.current
    el.scrollTop = el.scrollHeight
  }, [messages])

  return <div className="row">

    <div className="col-xl-3 col-lg-4">
      <div className="card chat-list-card mb-xl-0">
        <div className="card-body p-0">
          <div className="p-2">
            <div className="d-flex w-100 gap-0 align-items-center">
              {users.map(user => (
                <Tippy
                  key={user.id}
                  content={`${user.name} ${user.lastname}`}
                >
                  <div
                    onClick={() => {
                      const newSelectedUsers = [...selectedUsersId];
                      const userServiceId = user.service_user.id;

                      const index = newSelectedUsers.indexOf(userServiceId);
                      if (index > -1) {
                        newSelectedUsers.splice(index, 1);
                      } else {
                        newSelectedUsers.push(userServiceId);
                      }

                      setSelectedUsersId(newSelectedUsers);
                    }}
                    className={`rounded-pill ${selectedUsersId.includes(user.service_user.id) ? 'bg-purple' : ''}`}
                    style={{ cursor: 'pointer', padding: '2px', marginRight: '2px' }}
                  >
                    <img
                      className='avatar-xs rounded-circle'
                      src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                      alt={user.name}
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                  </div>
                </Tippy>
              ))}
              {
                selectedUsersId.length > 0 &&
                <Tippy content="Limpiar filtros">
                  <button
                    className="btn btn-xs btn-soft-danger ms-1 rounded-pill"
                    onClick={() => setSelectedUsersId([])}
                  >
                    <i className="mdi mdi-trash-can-outline"></i>
                  </button>
                </Tippy>
              }
            </div>
            <hr className="my-2" />
            <div className="search-box chat-search-box">
              <input type="text" className="form-control" placeholder="Buscar lead por nombre o número..." />
              <i className="mdi mdi-magnify search-icon"></i>
            </div>
          </div>
          <hr className="my-0" />
          <div style={{ overflowY: 'auto' }}>
            {loadingLeads ? (
              <div className="text-center py-4" style={{ height: 'calc(100vh - 300px)' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading contacts...</span>
                </div>
                <p className="mt-2 mb-0 text-muted">Cargando contactos...</p>
              </div>
            ) : (
              <ul className="list-unstyled chat-list mb-0" style={{ height: 'calc(100vh - 300px)' }}>
                {leads
                  .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
                  .map(lead => {
                    return <li key={lead.id} className={`${lead.unread ? 'unread' : ''} ${activeLeadId == lead.id ? 'bg-light' : ''}`}>
                      <a onClick={(e) => { setActiveLeadId(lead.id); e.stopPropagation() }} className='cursor-pointer' style={{
                        borderLeft: `4px solid ${lead.status.color}`
                      }}>
                        <div className="d-flex">
                          <div className={`flex-shrink-0 chat-user-img ${lead.online ? 'active' : ''} align-self-center me-2`}>
                            {lead.avatar ? (
                              <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${lead.avatar}`}
                                className="rounded-circle avatar-sm" alt={lead.name} />
                            ) : (
                              <span className={`avatar-title rounded-circle bg-soft-${lead.color} text-${lead.color}`}>
                                <i className="mdi mdi-account"></i>
                              </span>
                            )}
                          </div>

                          <div className="flex-grow-1 overflow-hidden">
                            <h5 className="text-truncate font-14 mt-0 mb-1">{lead.name} <small className="text-muted fw-normal">{lead.contact_phone}</small></h5>
                            <p className="text-truncate mb-0">{lead.last_message ?? 'Sin mensaje'}</p>
                          </div>
                          <div className="font-11">{lead.last_time}</div>
                        </div>
                      </a>
                    </li>
                  })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="col-xl-9 col-lg-8">
      <div className="conversation-list-card card">
        {!currentLead ? (
          <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 'calc(100vh - 184px)' }}>
            <div className="text-center">
              <img src="/assets/img/icon.svg" alt={`Logo ${Global.APP_NAME}`} className='mb-2' style={{ width: 60, height: 60, objectFit: 'contain' }} />
              <h4 className="text-muted">Módulo de chat de {Global.APP_NAME}</h4>
              <p className="text-muted">Selecciona un contacto para empezar a interactuar</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card-header">
              <div className="d-flex">
                <div className="flex-grow-1">
                  <h5 className="mt-0 mb-1 text-truncate">{currentLead.name}</h5>
                  <p className="font-13 text-muted mb-0"><i
                    className="mdi mdi-phone me-1 font-11"></i> {currentLead.contact_phone}</p>
                </div>
              </div>
            </div>
            <div className="card-body p-0 position-relative" style={{
              backgroundColor: 'var(--bs-body-bg)',
              backgroundImage: 'url(/assets/img/doodles.png)',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'contain',
              backgroundOpacity: 0.5
            }}>
              {/* {loadingMessages ? ( */}
                <div className="text-center py-4" style={{ height: 'calc(100vh - 345px)' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading messages...</span>
                  </div>
                  <p className="mt-2 mb-0 text-muted">Cargando mensajes...</p>
                </div>
              {/* ) : <ChatContent containerRef={messagesContainerRef} messages={filteredMessages} lead={currentLead}/>} */}
            </div>
          </>
        )}
      </div>
    </div>

  </div >
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Chat' showTitle={false}>
      <Chat {...properties} />
    </Adminto>
  );
})