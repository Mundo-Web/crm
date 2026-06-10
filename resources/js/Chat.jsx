import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import LeadAvatar from './components/LeadAvatar.jsx'
import Tippy from '@tippyjs/react';
import Global from './Utils/Global.js';
import { useEffect, useRef, useState } from 'react';
import LeadsRest from './actions/LeadsRest.js';
import Swal from 'sweetalert2';
import useWebSocket from './Reutilizables/CustomHooks/useWebSocket.jsx';
import ChatContent from './Reutilizables/Chat/ChatContent.jsx';
import ArrayJoin from './Utils/ArrayJoin.js';
import LaravelSession from './Utils/LaravelSession.js';
import useCrossTabSelectedUsers from './Reutilizables/CustomHooks/useCrossTabSelectedUsers.jsx';
import ContactDetails from './Reutilizables/Chat/ContactDetails.jsx';
import getTextFromReactNode from './Utils/getTextFromReactNode.js';
import DetailLeadModal from './Reutilizables/Leads/DetailLeadModal.jsx';
import TasksRest from './actions/TasksRest.js';
import { Local } from 'sode-extend-react';
import Modal from './components/Modal.jsx';
import InputFormGroup from './components/form/InputFormGroup.jsx';
import SelectAPIFormGroup from './components/form/SelectAPIFormGroup.jsx';
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx';
import SetSelectValue from './Utils/SetSelectValue.jsx';

const tasksRest = new TasksRest();

const leadsRest = new LeadsRest()
leadsRest.paginateSufix = null

const Chat = ({ users = [], defaultMessages = [], activeLeadId: activeLeadIdDB, statuses = [], manageStatuses = [], chatStatuses = [], noteTypes = [], processes = [], session = {}, signs = [], projectTypes = [], products = [], convertedLeadStatus, defaultClientStatus, ...properties }) => {
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [chatStatusFilter, setChatStatusFilter] = useState('');
  const [now, setNow] = useState(Date.now());
  const [hoveredLeadId, setHoveredLeadId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onOpenModal = (data = {}) => {
    if (idRef.current) idRef.current.value = data?.id ?? "";
    if (contactNameRef.current) contactNameRef.current.value = data?.contact_name ?? "";
    if (contactEmailRef.current) contactEmailRef.current.value = data?.contact_email ?? "";
    if (contactPhoneRef.current) contactPhoneRef.current.value = data?.contact_phone ?? "";
    if (nameRef.current) nameRef.current.value = data?.name ?? "";
    if (rucRef.current) rucRef.current.value = data?.ruc ?? "";
    if (workersRef.current) workersRef.current.value = data?.workers ?? "";
    if (webUrlRef.current) webUrlRef.current.value = data?.web_url ?? "";
    if (sectorRef.current) SetSelectValue(sectorRef.current, data?.business_sector_id ?? "");
    if (messageRef.current) messageRef.current.value = data?.message ?? "";

    $(newLeadModalRef.current).modal("show");
  };

  const onModalSubmit = async (e) => {
    e.preventDefault();
    const request = {
      id: idRef.current.value,
      contact_name: contactNameRef.current.value || "Lead anonimo",
      contact_email: contactEmailRef.current.value,
      contact_phone: contactPhoneRef.current.value.replace(/[^0-9]/g, ""),
      name: nameRef.current.value || "Lead anonimo",
      ruc: rucRef.current.value,
      workers: workersRef.current.value,
      web_url: webUrlRef.current.value,
      business_sector_id: sectorRef.current.value,
      message: messageRef.current.value || "Sin mensaje",
    };

    const result = await leadsRest.save(request);
    if (!result) return;

    if (detailLead?.id == result.id) setDetailLead(result);
    $(newLeadModalRef.current).modal("hide");
    getLeads();
  };

  const { socket } = useWebSocket()
  const messagesContainerRef = useRef()
  const leadsContainerRef = useRef()
  const usersContainerRef = useRef()
  const detailModalRef = useRef()
  const newLeadModalRef = useRef()

  const idRef = useRef()
  const contactNameRef = useRef()
  const contactEmailRef = useRef()
  const contactPhoneRef = useRef()
  const nameRef = useRef()
  const webUrlRef = useRef()
  const messageRef = useRef()
  const rucRef = useRef()
  const workersRef = useRef()
  const sectorRef = useRef()

  const scrollUsers = (direction) => {
    if (usersContainerRef.current) {
      const scrollAmount = 150;
      usersContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  const getLeads = async (loadMore = false) => {
    if (loading) return;
    setLoading(true);

    const request = {
      fields: ['clients.id', 'clients.contact_name', 'clients.contact_phone', 'clients.last_message', 'clients.last_message_microtime', 'clients.assigned_to', 'clients.status_id', 'clients.manage_status_id', 'clients.chat_status_id', 'clients.integration_user_id', 'clients.integration_id', 'clients.origin', 'clients.campaign_id', 'clients.is_pinned', 'clients.created_at'],
      withCount: ['unSeenMessages'],
      with: ['assigned', 'status', 'manageStatus', 'chatStatus', 'integration'],
      sort: [{ selector: 'is_pinned', desc: true }, { selector: 'last_message_microtime', desc: true }],
      skip: 0,
      take: 40,
      requireTotalCount: true
    };

    const filter = [["clients.last_message_microtime", "isnotnull"]];

    if (selectedUsersId.length) {
      filter.push(ArrayJoin(selectedUsersId.map(id => (['clients.assigned_to', '=', id])), 'or'));
    }

    if (chatStatusFilter) {
      filter.push(['clients.chat_status_id', '=', chatStatusFilter]);
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
      // Need a more sophisticated loadMore logic with is_pinned but let's keep it simple for now
      filter.push(['clients.last_message_microtime', '<', oldestMicrotime]);
    }

    request.filter = ArrayJoin(filter, 'and');

    const result = await leadsRest.paginate(request);
    if (!result) {
      setLoading(false);
      return;
    }
    const { data, totalCount: newTotalCount } = result;

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
  }, [selectedUsersId, chatStatusFilter]);

  useEffect(() => {
    if (!socket) return
    socket.on('client.updated', (client) => {
      setLeads(prev => {
        const idx = prev.findIndex(l => l.id === client.id);
        let updatedList = [...prev];

        if (idx !== -1) {
          // If the backend says notify=true (new incoming message), ensure count >= 1
          // This handles the race condition where ClientStatusObserver fires before the message
          // is committed to DB (count=0), followed by MessageObserver with notify=true (count=1)
          const incomingCount = client.un_seen_messages_count ?? updatedList[idx].un_seen_messages_count;
          const finalCount = client.notify ? Math.max(incomingCount, 1) : incomingCount;
          updatedList[idx] = { ...updatedList[idx], ...client, un_seen_messages_count: finalCount };
        } else {
          // New lead not in list yet — only add if it passes the user filter
          if (!selectedUsersId.length || selectedUsersId.includes(client.assigned_to)) {
            // Force at least 1 unseen since a message just arrived
            if (!client.un_seen_messages_count) {
              client.un_seen_messages_count = 1;
            }
            updatedList.push(client);
          } else {
            return prev;
          }
        }

        // Sort by is_pinned first, then by last_message_microtime descending
        updatedList.sort((a, b) => {
          const pinA = a.is_pinned ? 1 : 0;
          const pinB = b.is_pinned ? 1 : 0;
          if (pinA !== pinB) return pinB - pinA;
          const timeA = Number(a.last_message_microtime || 0);
          const timeB = Number(b.last_message_microtime || 0);
          return timeB - timeA;
        });

        return updatedList;
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
  }, [leads, loading, selectedUsersId, chatStatusFilter, totalCount, searchTerm]);

  const onAssignLead = async (leadId, userId) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El lead será asignado a otro usuario.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    const success = await leadsRest.massiveAssign({ leadsId: [leadId], userId });
    if (success) {
      getLeads(false);
      const updatedContact = await leadsRest.get(leadId);
      if (contactDetails && contactDetails.id === leadId) {
        setContactDetails(updatedContact);
      }
      if (detailLead && detailLead.id === leadId) {
        setDetailLead(updatedContact);
      }
    }
  };

  const onOpenDetails = (contact) => {
    setDetailLead(contact);
    $(detailModalRef.current).modal('show');
  };

  const onLeadUpdate = async (leadId, value, type) => {
    let success = false;
    const targetLeadId = leadId || detailLead?.id;

    // Optimistic UI Update
    if (type === 'is_pinned' || type === 'chat_status') {
      setLeads(prev => prev.map(l => l.id === targetLeadId ? { ...l, [type === 'is_pinned' ? 'is_pinned' : 'chat_status_id']: value, chat_status: type === 'chat_status' ? (chatStatuses.find(s => s.id === value) || null) : l.chat_status } : l));
      if (contactDetails && contactDetails.id === targetLeadId) {
        setContactDetails(prev => ({ ...prev, [type === 'is_pinned' ? 'is_pinned' : 'chat_status_id']: value, chat_status: type === 'chat_status' ? (chatStatuses.find(s => s.id === value) || null) : prev.chat_status }));
      }
    }

    if (type === 'status') {
      success = await leadsRest.leadStatus({ lead: targetLeadId, status: value });
    } else if (type === 'manage_status') {
      success = await leadsRest.manageStatus({ lead: targetLeadId, status: value });
    } else if (type === 'chat_status') {
      success = await leadsRest.chatStatus({ lead: targetLeadId, status: value });
    } else if (type === 'is_pinned') {
      success = await leadsRest.togglePin({ lead: targetLeadId, is_pinned: value });
    } else {
      // General update (e.g. after saving a note)
      success = true;
    }

    if (success && type !== 'is_pinned' && type !== 'chat_status') {
      const updated = await leadsRest.get(targetLeadId);
      if (detailLead && detailLead.id === targetLeadId) setDetailLead(updated);
      if (contactDetails && contactDetails.id === targetLeadId) setContactDetails(updated);
      getLeads(false);
    }
  };


  useEffect(() => {
    if (activeLeadId) {
      history.pushState({}, '', `/chat/${activeLeadId}`);
    } else {
      history.pushState({}, '', '/chat');
    }
  }, [activeLeadId])

  return <Adminto {...properties} session={session} title='Chat' showTitle={false} setThemeParent={setTheme}>
    <div className="row">
      <div className="col-xl-3 col-lg-4">
        <div className="card chat-list-card mb-xl-0">
          <div className="card-body p-0">
            <div className="p-2 position-relative">
              <button
                className="btn btn-xs btn-white position-absolute start-0 top-50 translate-middle-y z-1 shadow-sm border-0 rounded-circle"
                style={{ marginLeft: '4px' }}
                onClick={() => scrollUsers('left')}
              >
                <i className="mdi mdi-chevron-left"></i>
              </button>
              <div ref={usersContainerRef} className="d-flex w-100 gap-0 align-items-center scroll-hidden" style={{ overflowX: 'auto', padding: '0 25px' }}>
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
                        onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
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
              <button
                className="btn btn-xs btn-white position-absolute end-0 top-50 translate-middle-y z-1 shadow-sm border-0 rounded-circle"
                style={{ marginRight: '4px' }}
                onClick={() => scrollUsers('right')}
              >
                <i className="mdi mdi-chevron-right"></i>
              </button>
            </div>
            <div className='p-2 border-top'>
              <div className="d-flex gap-2">
                <div className="search-box chat-search-box flex-grow-1">
                  <input
                    type="text"
                    className="form-control rounded-pill"
                    placeholder="Buscar lead..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <i className="mdi mdi-magnify search-icon"></i>
                </div>
                <select
                  className="form-select rounded-pill"
                  style={{ width: 'auto', minWidth: '130px' }}
                  value={chatStatusFilter}
                  onChange={(e) => setChatStatusFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {chatStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div ref={leadsContainerRef} className='scroll-hidden' style={{ overflowY: 'auto', height: 'calc(100vh - 300px)' }}>
              <ul className="list-unstyled chat-list mb-0">
                {leads
                  .sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.last_message_microtime) - new Date(a.last_message_microtime);
                  })
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

                    let last_message_raw = lead.last_message
                    let last_message = null;
                    if (last_message_raw) {
                      if (last_message_raw.startsWith('/audio:')) {
                        last_message = <><i className='mdi mdi-microphone' /> Audio</>
                      } else if (last_message_raw.startsWith('/image:')) {
                        const content = String(last_message_raw.split('\n').slice(1).join('\n') || '').trim()
                        last_message = <><i className='mdi mdi-image' /> {content || 'Foto'}</>
                      } else if (last_message_raw.startsWith('/sticker:')) {
                        last_message = <><i className='mdi mdi-sticker-emoji' /> Sticker</>
                      } else if (last_message_raw.startsWith('/location:')) {
                        last_message = <><i className='mdi mdi-map-marker' /> Ubicación</>
                      } else if (last_message_raw.startsWith('/contact:')) {
                        last_message = <><i className='mdi mdi-account' /> Contacto</>
                      } else if (last_message_raw.startsWith('/document:')) {
                        const content = String(last_message_raw.split('\n').slice(1).join('\n') || '').trim()
                        last_message = <><i className='mdi mdi-file-document' /> {content || 'Documento'}</>
                      } else if (last_message_raw.startsWith('/unsupported:') || last_message_raw.startsWith('[Media no soportada:') || last_message_raw.startsWith('[Media recibida: unsupported')) {
                        last_message = <><i className='mdi mdi-information-outline' /> Mensaje no soportado</>
                      } else {
                        last_message = last_message_raw
                      }
                    }


                    const statusColor = lead.chat_status?.color;
                    const isActive = activeLeadId == lead.id;
                    const isHovered = hoveredLeadId == lead.id;
                    const liStyle = {};

                    if (statusColor) {
                      let opacity = '0a'; // ~4% opacity for default
                      if (isActive) {
                        opacity = '25'; // ~14.5% opacity for active
                      } else if (isHovered) {
                        opacity = '18'; // ~9% opacity for hover
                      }
                      liStyle.background = `linear-gradient(90deg, ${statusColor}${opacity} 0%, transparent 100%)`;
                      liStyle.borderLeft = `4px solid ${statusColor}`;
                      liStyle.transition = 'all 0.2s ease-in-out';
                    }

                    return <li
                      key={lead.id}
                      className={`${lead.unread ? 'unread' : ''} ${activeLeadId == lead.id && !statusColor ? 'bg-light' : ''}`}
                      style={liStyle}
                      onMouseEnter={() => setHoveredLeadId(lead.id)}
                      onMouseLeave={() => setHoveredLeadId(null)}
                    >
                      <a onClick={(e) => { setActiveLeadId(lead.id); e.stopPropagation() }} style={{ cursor: 'pointer' }}>
                        <div className="d-flex">
                          <div className={`position-relative flex-shrink-0 chat-user-img ${lead.online ? 'active' : ''} align-self-center me-2`}>
                            {/* Origin badge aligned to the top-left of the avatar */}
                            <div className="position-absolute" style={{ left: '-4px', top: '-4px', zIndex: 2 }}>
                              {(() => {
                                const service = lead.integration?.meta_service || lead.origin?.toLowerCase();
                                const isWhatsApp = service === 'whatsapp' ||
                                  service === 'forms' ||
                                  (!['messenger', 'instagram', 'tiktok'].includes(lead.integration?.meta_service) && lead.contact_phone);

                                if (!isWhatsApp && service === 'messenger') {
                                  return (
                                    <span className="badge rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0084FF', width: '18px', height: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                                      <i className="mdi mdi-facebook-messenger text-white" style={{ fontSize: '10px' }}></i>
                                    </span>
                                  );
                                } else if (!isWhatsApp && service === 'instagram') {
                                  return (
                                    <span className="badge rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E1306C', width: '18px', height: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                                      <i className="mdi mdi-instagram text-white" style={{ fontSize: '10px' }}></i>
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="badge rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#25D366', width: '18px', height: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                                      <i className="mdi mdi-whatsapp text-white" style={{ fontSize: '10px' }}></i>
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                            <LeadAvatar lead={lead} className="avatar-sm" />
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
                                  onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
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
                            <h5 className={`text-truncate font-14 mt-0 mb-0 ${lead.un_seen_messages_count > 0 ? 'fw-bold' : ''}`}>
                              {lead.contact_name}
                            </h5>
                            <p className={`text-truncate mb-0 ${lead.un_seen_messages_count > 0 ? 'fw-bold' : ''}`} title={getTextFromReactNode(last_message) ?? undefined}
                              style={{
                                color: lead.un_seen_messages_count > 0 ? (theme == 'light' ? '#343a40' : '#f7f7f7') : undefined,
                              }}>{last_message ?? <i className='text-muted'>Sin mensaje</i>}</p>
                            <div className='d-flex gap-1 mt-1 align-items-center flex-wrap' >
                              {lead.chat_status && (
                                <span className="badge  border d-inline-flex align-items-center d-none" style={{ backgroundColor: 'transparent', color: lead.chat_status?.color ?? '#6c757d', borderColor: lead.chat_status?.color ?? '#6c757d' }}>
                                  {lead.chat_status?.icon && (
                                    <i className={`mdi ${lead.chat_status.icon.startsWith('mdi-') ? lead.chat_status.icon : `mdi-${lead.chat_status.icon}`} me-1`} />
                                  )}
                                  {/*lead.chat_status?.name*/}
                                </span>
                              )}
                              <Tippy
                                content={
                                  <div className="d-flex flex-column gap-1 p-1">
                                    <span className="badge w-100" style={{ backgroundColor: lead.status?.color ?? '#6c757d' }}>{lead.status?.name ?? 'Sin estado'}</span>
                                    <span className="badge w-100" style={{ backgroundColor: lead.manage_status?.color ?? '#6c757d' }}>{lead.manage_status?.name ?? 'Sin estado'}</span>
                                  </div>
                                }
                                allowHTML={true}
                                placement="top"
                              >
                                <span className="badge bg-light text-muted border" style={{ cursor: 'pointer', padding: '4px 6px' }}>
                                  <i className="mdi mdi-dots-horizontal"></i>
                                </span>
                              </Tippy>
                              {(() => {
                                const service = lead.integration?.meta_service || lead.origin?.toLowerCase();
                                const isWhatsApp = service === 'whatsapp' ||
                                  service === 'forms' ||
                                  (!['messenger', 'instagram', 'tiktok'].includes(lead.integration?.meta_service) && lead.contact_phone);

                                if (!isWhatsApp) return null;

                                const lastHumanMicro = lead.last_human_message_microtime;
                                let lastHumanMs = lastHumanMicro ? Math.floor(lastHumanMicro / 1000) : 0;
                                if (lastHumanMs === 0 && lead.created_at) {
                                  lastHumanMs = new Date(lead.created_at).getTime();
                                }

                                if (lastHumanMs === 0) {
                                  return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(234, 84, 85, 0.12)', color: '#ea5455', borderColor: 'rgba(234, 84, 85, 0.24)' }}>
                                      <i className="mdi mdi-alert-circle-outline me-1"></i>Si inicia conversación se cobrará
                                    </span>
                                  );
                                }

                                const isCampaign = !!lead.campaign_id;
                                const msInWindow = isCampaign ? 72 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                                const expiresAt = lastHumanMs + msInWindow;
                                const remainingMs = expiresAt - now;

                                if (remainingMs > 0) {
                                  const hours = Math.floor(remainingMs / (3600 * 1000));
                                  const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
                                  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
                                  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

                                  return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(40, 199, 111, 0.12)', color: '#28c76f', borderColor: 'rgba(40, 199, 111, 0.24)' }}>
                                      {isCampaign ? (
                                        <><i className="mdi mdi-bullhorn-outline me-1"></i>Anuncio 72h: {formattedTime}</>
                                      ) : (
                                        <><i className="mdi mdi-clock-outline me-1"></i>24h: {formattedTime}</>
                                      )}
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="badge border d-inline-flex align-items-center" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(234, 84, 85, 0.12)', color: '#ea5455', borderColor: 'rgba(234, 84, 85, 0.24)' }}>
                                      <i className="mdi mdi-alert-circle-outline me-1"></i>Si inicia conversación se cobrará
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                          <div className="d-flex flex-column align-items-end flex-shrink-0 ms-2">
                            <div className={`font-11 ${lead.un_seen_messages_count > 0 ? 'text-success' : ''}`}>{dateLabel}</div>
                            <div className="d-flex align-items-center gap-1 mt-1">
                              {Boolean(lead.is_pinned) && (
                                <i className="mdi mdi-pin text-primary font-16" title="Anclado" style={{ transform: 'rotate(45deg)', display: 'inline-block' }}></i>
                              )}
                              {lead.un_seen_messages_count > 0 && (
                                <span className="badge bg-success rounded-pill">{lead.un_seen_messages_count}</span>
                              )}
                            </div>
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
              <ChatContent leadId={activeLeadId} setLeadId={setActiveLeadId} containerRef={messagesContainerRef} theme={theme} contactDetails={contactDetails} setContactDetails={setContactDetails} defaultMessages={defaultMessages} can={properties.can} chatStatuses={chatStatuses} onLeadUpdate={onLeadUpdate} />
            </>
          )}
        </div>
      </div>
      {contactDetails && (
        <div className="col-xl-3 col-lg-12">
          <div className="card contact-details-card mb-xl-0">
            <div className="card-body scroll-hidden" style={{ height: 'calc(100vh - 186px)', overflowY: 'auto' }}>
              <ContactDetails {...contactDetails} users={users} onAssign={onAssignLead} onOpenDetails={onOpenDetails} chatStatuses={chatStatuses} onLeadUpdate={onLeadUpdate} />
            </div>
          </div>
        </div>
      )}
    </div >
    <DetailLeadModal
      modalRef={detailModalRef}
      lead={detailLead}
      statuses={statuses}
      manageStatuses={manageStatuses}
      noteTypes={noteTypes}
      users={users}
      processes={processes}
      session={session}
      onLeadUpdate={onLeadUpdate}
      onOpenEditModal={onOpenModal}
      defaultMessages={defaultMessages}
      signs={signs}
      projectTypes={projectTypes}
      convertedLeadStatus={convertedLeadStatus}
      defaultClientStatus={defaultClientStatus}
      products={products}
    />

    <Modal
      modalRef={newLeadModalRef}
      title="Editar lead"
      btnSubmitText="Guardar"
      onSubmit={onModalSubmit}
      zIndex={1060}
    >
      <div className="row mb-0">
        <input ref={idRef} type="hidden" />
        <InputFormGroup eRef={contactNameRef} label="Nombre completo" />
        <InputFormGroup eRef={contactEmailRef} label="Correo electronico" type="email" col="col-md-6" />
        <InputFormGroup eRef={contactPhoneRef} label="Telefono" type="tel" col="col-md-6" required />
        <InputFormGroup eRef={nameRef} label="Razón Social" col="col-md-6" />
        <InputFormGroup eRef={webUrlRef} label="Link de WEB" col="col-md-6" />
        <InputFormGroup eRef={rucRef} label="RUC" col="col-md-6" />
        <InputFormGroup eRef={workersRef} label="N° Trabajadores" col="col-md-6" />
        <SelectAPIFormGroup
          eRef={sectorRef}
          label="Rubro de Negocio"
          col="col-md-12"
          searchAPI="/api/business-sectors/paginate"
          searchBy="name"
          dropdownParent={newLeadModalRef.current}
        />
        <TextareaFormGroup eRef={messageRef} label="Mensaje" placeholder="Ingresa tu mensaje" rows={4} />
      </div>
    </Modal>
  </Adminto>
};

CreateReactScript((el, properties) => {
  if (!properties.can('chats', 'list')) return location.href = '/';
  createRoot(el).render(<Chat {...properties} />);
})