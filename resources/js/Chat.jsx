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
import ArrayJoin from './Utils/ArrayJoin.js';
import LaravelSession from './Utils/LaravelSession.js';

const leadsRest = new LeadsRest()
leadsRest.paginateSufix = null
const messagesRest = new MessagesRest()

const audio = new Audio('/assets/sounds/notification.wav');

const Chat = ({ users, ...properties }) => {
  const settings = Local.get('adminto_settings') ?? {}
  const [theme, setTheme] = useState(settings.theme ?? 'light');

  const [leads, setLeads] = useState([])
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [selectedUsersId, setSelectedUsersId] = useState([LaravelSession.service_user.id]);
  const [messages, setMessages] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreLeads, setLoadingMoreLeads] = useState(false);

  const { socket } = useWebSocket()
  const messagesContainerRef = useRef()
  const leadsContainerRef = useRef()

  const currentLead = leads.find(l => l.id == activeLeadId);
  const filteredMessages = messages.filter(m => m.wa_id == currentLead?.contact_phone);

  const getFirstLeads = async () => {
    setLoadingLeads(true);
    const filters = {
      fields: ['clients.id', 'clients.contact_name', 'clients.contact_phone', 'clients.last_message', 'clients.last_message_microtime', 'clients.assigned_to'],
      withCount: ['unSeenMessages'],
      with: ['assigned'],
      sort: [{ selector: 'last_message_microtime', desc: true }],
      limit: 40
    };
    if (selectedUsersId.length) {
      filters.filter = ArrayJoin(selectedUsersId.map(id => (['assigned_to', '=', id])), 'OR');
    }
    const { data } = await leadsRest.paginate(filters);
    setLeads(data ?? []);
    setLoadingLeads(false);
  }

  const loadMoreLeads = async () => {
    if (loadingMoreLeads || loadingLeads) return;
    setLoadingMoreLeads(true);
    const oldestMicrotime = Math.min(...leads.map(l => l.last_message_microtime ?? Date.now() * 1000));
    const filters = {
      fields: ['clients.id', 'clients.contact_name', 'clients.contact_phone', 'clients.last_message', 'clients.last_message_microtime', 'clients.assigned_to'],
      withCount: ['unSeenMessages'],
      with: ['assigned'],
      sort: [{ selector: 'last_message_microtime', desc: true }],
      limit: 40,
      filter: [
        ['last_message_microtime', '<', oldestMicrotime]
      ]
    };
    if (selectedUsersId.length) {
      filters.filter = [
        ArrayJoin(selectedUsersId.map(id => (['assigned_to', '=', id])), 'OR'),
        'and',
        filters.filter
      ];
    }
    const { data } = await leadsRest.paginate(filters);
    if (data && data.length) {
      setLeads(prev => [...prev, ...data]);
    }
    setLoadingMoreLeads(false);
  };

  const getMessages = async () => {
    if (!currentLead) return
    if (loadingMessages) return
    setLoadingMessages(true)
    const lastMessage = messages
      .filter(m => m.wa_id == currentLead.contact_phone)
      .sort((a, b) => b.microtime - a.microtime)[0] ?? { microtime: (Date.now() + 5 * 60 * 60 * 1000) * 1000 }
    const result = await messagesRest.paginate({
      summary: {
        'contact_phone': currentLead.contact_phone
      },
      filter: [
        ["microtime", "<=", lastMessage.microtime], "and",
        ["wa_id", "contains", currentLead.contact_phone]
      ],
      sort: [{ selector: 'microtime', desc: true }],
      skip: 0,
      take: 40
    })
    setMessages(prev => [...prev, ...(result.data ?? [])].sort((a, b) => a.microtime - b.microtime))
    setLoadingMessages(false)
  }

  // Fetch messages newer than the last one we have for the active lead
  const fetchNewerMessages = async () => {
    if (!currentLead) return
    const lastMessage = messages
      .filter(m => m.wa_id === currentLead.contact_phone)
      .sort((a, b) => b.microtime - a.microtime)[0]
    if (!lastMessage) return
    const result = await messagesRest.paginate({
      summary: { 'contact_phone': currentLead.contact_phone },
      filter: [
        ["microtime", ">", lastMessage.microtime], "and",
        ["wa_id", "contains", currentLead.contact_phone]
      ],
      sort: [{ selector: 'microtime', desc: false }],
      skip: 0,
      take: 100
    })
    if (result.data && result.data.length) {
      setMessages(prev => [...prev, ...result.data].sort((a, b) => a.microtime - b.microtime))
    }
  }

  // New helper to fetch messages when no last_message exists
  const fetchMessagesIfEmpty = async () => {
    if (!currentLead) return
    // const hasLastMessage = currentLead.last_message
    const hasMessages = filteredMessages.length > 0
    if (!hasMessages) {
      await getMessages()
    }
  }

  useEffect(() => {
    getFirstLeads()
  }, [selectedUsersId])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveLeadId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!activeLeadId) return;
    fetchMessagesIfEmpty()
    fetchNewerMessages()
  }, [activeLeadId]);

  useEffect(() => {
    if (!socket) return
    socket.on('message.created', (props) => {
      if (props.role == 'Human') audio.play()
      // Only add the message if the lead is currently selected
      if (props.wa_id !== currentLead?.contact_phone) return
      const { id } = props;
      setMessages(prev => {
        const exists = prev.find(m => m.id === id);
        if (exists) {
          return prev.map(m => m.id === id ? { ...m, ...props } : m);
        }
        return [...prev, props].sort((a, b) => a.microtime - b.microtime);
      });
    })

    socket.on('client.updated', (client) => {
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === client.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...client };
          return updated;
        }
        return [...prev, client];
      });
    })
    return () => {
      // socket.off('message')
    }
  }, [socket, activeLeadId, currentLead])

  useEffect(() => {
    if (!messagesContainerRef.current) return
    const el = messagesContainerRef.current
    el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    const el = leadsContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        loadMoreLeads();
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [leads, loadingLeads, loadingMoreLeads, selectedUsersId]);

  return <Adminto {...properties} title='Chat' showTitle={false} setThemeParent={setTheme}>
    <div className="row">
      <div className="col-xl-3 col-lg-4">
        <div className="card chat-list-card mb-xl-0">
          <div className="card-body p-0">
            <div className="p-2">
              <div className="d-flex w-100 gap-0 align-items-center" style={{ overflowX: 'auto' }}>
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
            <div ref={leadsContainerRef} style={{ overflowY: 'auto', height: 'calc(100vh - 300px)' }}>
              {loadingLeads ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading contacts...</span>
                  </div>
                  <p className="mt-2 mb-0 text-muted">Cargando contactos...</p>
                </div>
              ) : (
                <ul className="list-unstyled chat-list mb-0">
                  {leads
                    .sort((a, b) => new Date(b.last_message_microtime) - new Date(a.last_message_microtime))
                    .map(lead => {
                      // Build a friendly date string
                      const messageDate = new Date((lead.last_message_microtime ?? 0) / 1000);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);

                      let dateLabel;
                      if (messageDate >= today) {
                        dateLabel = messageDate.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      } else if (messageDate >= yesterday) {
                        dateLabel = 'Ayer';
                      } else {
                        const currentYear = new Date().getFullYear();
                        const messageYear = messageDate.getFullYear();
                        if (messageYear === currentYear) {
                          dateLabel = messageDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                        } else {
                          dateLabel = messageDate.toLocaleDateString('es-ES', { month: '2-digit', year: 'numeric' });
                        }
                      }

                      return <li key={lead.id} className={`${lead.unread ? 'unread' : ''} ${activeLeadId == lead.id ? 'bg-light' : ''}`}>
                        <a onClick={(e) => { setActiveLeadId(lead.id); e.stopPropagation() }} style={{ cursor: 'pointer' }}>
                          <div className="d-flex">
                            <div className={`position-relative flex-shrink-0 chat-user-img ${lead.online ? 'active' : ''} align-self-center me-2`}>
                              <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${lead.avatar}`}
                                className="rounded-circle avatar-sm bg-light" alt={lead.name} style={{ padding: 0, border: 'none' }} />
                              {
                                lead.assigned_to && lead.assigned?.relative_id &&
                                // Only show if no filters are applied OR if the assigned user is NOT the only selected one
                                (selectedUsersId.length === 0 ||
                                  (selectedUsersId.length > 1 || selectedUsersId[0] !== LaravelSession.service_user.id)) &&
                                <Tippy
                                  key={lead.assigned.id}
                                  content={`${lead.assigned.name} ${lead.assigned.lastname}`}
                                >
                                  <img
                                    className="position-absolute rounded-pill"
                                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${lead.assigned.relative_id}`}
                                    alt={lead.assigned.fullname}
                                    style={{
                                      right: '-4px', bottom: '-4px',
                                      objectFit: 'cover', objectPosition: 'center',
                                      padding: 0, border: `2px solid ${theme == 'light' ? '#ffffff' : '#313844'}`,
                                      width: '18px', aspectRatio: 1
                                    }}
                                  />
                                </Tippy>
                              }
                            </div>

                            <div className="flex-grow-1 overflow-hidden">
                              <h5 className={`text-truncate font-14 mt-0 mb-1 ${lead.un_seen_messages_count > 0 ? 'fw-bold' : ''}`}>{lead.contact_name}</h5>
                              <p className="text-truncate mb-0" title={lead.last_message ?? undefined}>{lead.last_message ?? <i className='text-muted'>Sin mensaje</i>}</p>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                              <div className={`font-11 ${lead.un_seen_messages_count > 0 ? 'text-success' : ''}`}>{dateLabel}</div>
                              {lead.un_seen_messages_count > 0 && (
                                <span className="badge bg-success rounded-pill mt-1">{lead.un_seen_messages_count}</span>
                              )}
                            </div>
                          </div>
                        </a>
                      </li>
                    })}
                  {loadingMoreLeads && (
                    <li className="text-center py-2">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading more...</span>
                      </div>
                    </li>
                  )}
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
              <div className={`card-header ${theme == 'light' ? 'bg-white' : 'bg-light'}`}>
                <div className="d-flex">
                  <div className="flex-grow-1">
                    <h5 className="my-0 text-truncate">{currentLead.contact_name}</h5>
                    <p className="font-13 text-muted mb-0"><i
                      className="mdi mdi-phone me-1 font-11"></i> {currentLead.contact_phone}</p>
                  </div>
                </div>
              </div>
              <ChatContent containerRef={messagesContainerRef} messages={filteredMessages} lead={currentLead} loading={loadingMessages} theme={theme} />
            </>
          )}
        </div>
      </div>
    </div >
  </Adminto>
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Chat {...properties} />);
})