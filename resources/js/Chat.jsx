import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react';
import Global from './Utils/Global.js';
import { useEffect, useRef, useState } from 'react';
import LeadsRest from './actions/LeadsRest.js';
import useWebSocket from './Reutilizables/CustomHooks/useWebSocket.jsx';
import ChatContent from './Reutilizables/Chat/ChatContent.jsx';
import ArrayJoin from './Utils/ArrayJoin.js';
import LaravelSession from './Utils/LaravelSession.js';
import useCrossTabSelectedUsers from './Reutilizables/CustomHooks/useCrossTabSelectedUsers.jsx';
import ContactDetails from './Reutilizables/Chat/ContactDetails.jsx';

const leadsRest = new LeadsRest()
leadsRest.paginateSufix = null

const Chat = ({ users, activeLeadId: activeLeadIdDB, ...properties }) => {
  const settings = Local.get('adminto_settings') ?? {}
  const [theme, setTheme] = useState(settings.theme ?? 'light');

  const [leads, setLeads] = useState([])
  const [activeLeadId, setActiveLeadId] = useState(activeLeadIdDB);
  const [selectedUsersId, setSelectedUsersId] = useCrossTabSelectedUsers(LaravelSession.business_id, [LaravelSession.service_user.id]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [contactDetails, setContactDetails] = useState(null);

  const { socket } = useWebSocket()
  const messagesContainerRef = useRef()
  const leadsContainerRef = useRef()

  const getLeads = async (loadMore = false) => {
    if (loading) return;
    setLoading(true);

    const request = {
      fields: ['clients.id', 'clients.contact_name', 'clients.contact_phone', 'clients.last_message', 'clients.last_message_microtime', 'clients.assigned_to'],
      withCount: ['unSeenMessages'],
      with: ['assigned'],
      sort: [{ selector: 'last_message_microtime', desc: true }],
      skip: 0,
      take: 40,
      requireTotalCount: true
    };

    const filter = [["clients.last_message_microtime", "isnotnull"]];

    if (selectedUsersId.length) {
      filter.push(ArrayJoin(selectedUsersId.map(id => (['clients.assigned_to', '=', id])), 'or'));
    }

    if (searchTerm) {
      const searchFilters = [
        ['clients.contact_name', '=', searchTerm],
        ['clients.contact_name', 'contains', searchTerm],
        ['clients.contact_phone', 'contains', searchTerm]
      ];
      filter.push(ArrayJoin(searchFilters, 'or'));
    }

    if (loadMore && leads.length > 0) {
      const oldestMicrotime = Math.min(...leads.map(l => l.last_message_microtime));
      filter.push(['clients.last_message_microtime', '<', oldestMicrotime]);
    }

    request.filter = ArrayJoin(filter, 'and');

    const { data, totalCount: newTotalCount } = await leadsRest.paginate(request);

    if (loadMore) {
      setLeads(prev => [...prev, ...(data ?? [])]);
    } else {
      setLeads(data ?? []);
    }

    // newTotalCount is the amount of items already loaded plus remaining, so we add current leads length
    setTotalCount((data?.length ?? 0) + (newTotalCount ?? 0));
    setLoading(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      getLeads(false);
    }, 500));
  };

  useEffect(() => {
    getLeads(false);
  }, [selectedUsersId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveLeadId(null)
        setContactDetails(null)
      };
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!socket) return
    socket.on('client.updated', (client) => {
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === client.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...client };
          return updated;
        }
        // Only add new lead if assigned_to is in selectedUsersId (or if no filter is applied)
        if (!selectedUsersId.length || selectedUsersId.includes(client.assigned_to)) {
          return [...prev, client];
        }
        return prev;
      });
    })
    return () => {
      socket.off('client.updated')
    }
  }, [socket, selectedUsersId])

  useEffect(() => {
    const el = leadsContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        if (leads.length < totalCount) {
          getLeads(true);
        }
      }
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [leads, loading, selectedUsersId, totalCount, searchTerm]);

  useEffect(() => {
    if (activeLeadId) {
      history.pushState({}, '', `/chat/${activeLeadId}`);
    } else {
      history.pushState({}, '', '/chat');
    }
  }, [activeLeadId])

  return <Adminto {...properties} title='Chat' showTitle={false} setThemeParent={setTheme}>
    <div className="row">
      <div className="col-xl-3 col-lg-4">
        <div className="card chat-list-card mb-xl-0">
          <div className="card-body p-0">
            <div className="p-2">
              <div className="d-flex w-100 gap-0 align-items-center scroll-hidden" style={{ overflowX: 'auto' }}>
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
            </div>
            <div className='p-2 border-top'>
              <div className="search-box chat-search-box">
                <input
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Buscar lead por nombre o número..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <i className="mdi mdi-magnify search-icon"></i>
              </div>
            </div>
            <div ref={leadsContainerRef} style={{ overflowY: 'auto', height: 'calc(100vh - 300px)' }}>
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
                      // Build a list of weekday names in Spanish
                      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const now = new Date();
                      const daysDiff = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

                      if (daysDiff <= 6) {
                        // Within the last 7 days (including yesterday handled above)
                        dateLabel = weekdays[messageDate.getDay()];
                      } else {
                        // Older than 7 days: show d/m/yyyy
                        const dd = String(messageDate.getDate()).padStart(2, '0');
                        const mm = String(messageDate.getMonth() + 1).padStart(2, '0');
                        const yyyy = messageDate.getFullYear();
                        dateLabel = `${dd}/${mm}/${yyyy}`;
                      }
                    }

                    return <li key={lead.id} className={`${lead.unread ? 'unread' : ''} ${activeLeadId == lead.id ? 'bg-light' : ''}`}>
                      <a onClick={(e) => { setActiveLeadId(lead.id); e.stopPropagation() }} style={{ cursor: 'pointer' }}>
                        <div className="d-flex">
                          <div className={`position-relative flex-shrink-0 chat-user-img ${lead.online ? 'active' : ''} align-self-center me-2`}>
                            <img src={`/api/whatsapp/profile/${lead.contact_phone}`}
                              className="rounded-circle avatar-sm bg-light" alt={lead.name} style={{ padding: 0, border: 'none' }}
                              onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/api/profile/thumbnail/null`; }} />
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
                            <p className={`text-truncate mb-0 ${lead.un_seen_messages_count > 0 ? 'fw-bold' : ''}`} title={lead.last_message ?? undefined}
                              style={{
                                color: lead.un_seen_messages_count > 0 ? (theme == 'light' ? '#343a40' : '#f7f7f7') : undefined,
                              }}>{lead.last_message ?? <i className='text-muted'>Sin mensaje</i>}</p>
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
              </ul>
              {/* Skeleton always shown below the leads list */}
              <div className="text-center py-2">
                {loading && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading contacts...</span>
                  </div>
                )}
                {!loading && leads.length >= totalCount && leads.length > 0 && (
                  <span className="text-muted">No hay más contactos</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`col-xl-${contactDetails ? 6 : 9} col-lg-${contactDetails ? 8 : 12}`}>
        <div className="conversation-list-card card">
          {!activeLeadId ? (
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 'calc(100vh - 184px)' }}>
              <div className="text-center">
                <img src="/assets/img/icon.svg" alt={`Logo ${Global.APP_NAME}`} className='mb-2' style={{ width: 60, height: 60, objectFit: 'contain' }} />
                <h4 className="text-muted">Módulo de chat de {Global.APP_NAME}</h4>
                <p className="text-muted">Selecciona un contacto para empezar a interactuar</p>
              </div>
            </div>
          ) : (
            <>
              <ChatContent leadId={activeLeadId} containerRef={messagesContainerRef} theme={theme} contactDetails={contactDetails} setContactDetails={setContactDetails} />
            </>
          )}
        </div>
      </div>
      {contactDetails && (
        <div className="col-xl-3 col-lg-12">
          <div className="card contact-details-card mb-xl-0">
            <div className="card-body scroll-hidden" style={{height: 'calc(100vh - 186px)', overflowY: 'auto'}}>
              <ContactDetails {...contactDetails} />
            </div>
          </div>
        </div>
      )}
    </div >
  </Adminto>
};

CreateReactScript((el, properties) => {
  createRoot(el).render(<Chat {...properties} />);
})