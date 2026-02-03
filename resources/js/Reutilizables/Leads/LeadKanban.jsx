import { useContext, useEffect, useRef } from "react"
import Correlative from "../../Utils/Correlative"
import LaravelSession from "../../Utils/LaravelSession";
import LeadsRest from "../../actions/LeadsRest";
import Tippy from "@tippyjs/react";
import Global from "../../Utils/Global";
import TippyButton from "../../components/form/TippyButton";
import { motion, AnimatePresence } from "framer-motion";
import { LeadsContext } from "./LeadsProvider";

const leadsRest = new LeadsRest()

const LeadKanban = ({ statuses, leads, onLeadClicked, onOpenModal, onMakeLeadClient, onArchiveClicked, onDeleteClicked, onAttendClient, users }) => {

  const { setLeads, getLeads, defaultView, refreshLeads, getMoreLeads, leadsCount, statusesLoading, selectedUsersId, setSelectedUsersId } = useContext(LeadsContext)
  const loadingRefs = useRef({});

  useEffect(() => {
    const ids = statuses.map(x => `#status-${Correlative(x.name)}`).join(', ');
    $(ids).sortable({
      connectWith: '.taskList',
      placeholder: 'task-placeholder',
      forcePlaceholderSize: true,
      receive: async function ({ target }, { item }) {
        const ul = target;
        const li = item.get(0);
        const items = $(ul).sortable('toArray');
        if (!items.includes(li.id)) return;
        const result = await leadsRest.leadStatus({ status: ul.getAttribute('data-id'), lead: li.id });
        if (!result) return;
        await refreshLeads();
      },
      update: function (event, ui) {
        if (this === ui.item.parent()[0]) {
          return;
        }
      }
    }).disableSelection();
  }, [defaultView, leads])

  const handleScroll = async (event, statusId) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Check if we're near bottom, not already loading, and infinite scroll is not disabled
    if (scrollHeight - scrollTop <= clientHeight + 100 &&
      !loadingRefs.current[statusId] &&
      loadingRefs.current[`${statusId}_enabled`] !== false) {

      loadingRefs.current[statusId] = true;
      const newLeads = await getMoreLeads(statusId);

      // If no new leads returned, disable infinite scroll for this status
      if (!newLeads || newLeads.length === 0) {
        loadingRefs.current[`${statusId}_enabled`] = false;
      }

      loadingRefs.current[statusId] = false;
    }
  }

  useEffect(() => {
    if (defaultView != 'kanban') return
    setLeads([])
    getLeads()
  }, [selectedUsersId, defaultView])

  return <>
    <div className="d-flex w-100 gap-0 mt-2 align-items-center mb-2">
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
    <div className="d-flex gap-1 mb-3" style={{ overflowX: 'auto', minHeight: 'calc(100vh - 236px)' }}>
      {
        statuses.sort((a, b) => a.order - b.order).map((status, i) => {
          const correlative = Correlative(status.name)
          const leadsCountHere = leadsCount[status.id] ?? 0
          return (<div key={`status-${i}`} style={{ minWidth: '270px', maxWidth: '270px' }}>
            <div className="card mb-0">
              <div className="card-header">
                <span className="float-end">
                  {
                    leadsCountHere > 50 &&
                    <Tippy content={`Tienes ${leadsCountHere} leads en este estado, recuerda que tambien puedes archivar leads.`}>
                      <i className="mdi mdi-alert-outline text-danger me-1"></i>
                    </Tippy>
                  }
                  {leadsCountHere}
                </span>
                <h4 className="header-title my-0" style={{ color: status.color }}>{status.name}</h4>
              </div>
              <div
                className="card-body taskboard-box p-2"
                style={{ minHeight: '200px', height: 'calc(100vh - 302px)', overflow: 'auto' }}
                onScroll={(e) => handleScroll(e, status.id)}
              >
                <ul className="sortable-list list-unstyled taskList" id={`status-${correlative}`} data-id={status.id}>
                  <AnimatePresence>
                    {
                      leads.filter(x => x.status_id == status.id).sort((a, b) => {
                        return a.created_at > b.created_at ? -1 : 1
                      }).sort((a, b) => {
                        return a.assigned_to == LaravelSession.service_user.id ? -1 : 1
                      }).map((lead, i) => {
                        return (
                          <motion.li
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}
                            id={`${lead.id}`}
                            key={`lead-${i}`}
                            style={{ cursor: 'move' }}
                            className={`p-2 ${lead.assigned_to == LaravelSession.service_user.id ? 'border border-primary' : ''}`}
                          >
                            <div className="kanban-box">
                              <div className="kanban-detail ms-0">
                                <div className="dropdown float-end">
                                  <a href="#" className="dropdown-toggle arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="mdi mdi-dots-vertical"></i>
                                  </a>
                                  <div className="dropdown-menu dropdown-menu-end">
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onLeadClicked(lead)}>
                                      <i className='fa fa-eye me-1'></i>
                                      Ver detalles
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onOpenModal(lead)}>
                                      <i className='fa fa-pen me-1'></i>
                                      Editar lead
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onMakeLeadClient(lead)}>
                                      <i className='fa fa-user-plus me-1'></i>
                                      Convertir en cliente
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onArchiveClicked(lead)}>
                                      <i className='mdi mdi-archive me-1'></i>
                                      Archivar lead
                                    </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onDeleteClicked(lead)}>
                                      <i className='fa fa-trash me-1'></i>
                                      Eliminar lead
                                    </a>
                                  </div>
                                </div>
                                <h5 className="mt-0 text-truncate">
                                  <Tippy content='Ver detalles'>
                                    <a href="#" onClick={() => onLeadClicked(lead)}
                                      className="text-dark">
                                      {lead.contact_name}
                                    </a>
                                  </Tippy>
                                </h5>
                                <ul className="list-inline d-flex align-items-center gap-1 mb-0">
                                  <li className="list-inline-item">
                                    {
                                      // !lead.assigned_to
                                      //   ? <TippyButton className='btn btn-xs btn-soft-dark rounded-pill' title="Atender lead"
                                      //     onClick={() => onAttendClient(lead.id, true)}>
                                      //     <i className='fas fa-hands-helping'></i>
                                      //   </TippyButton>
                                      //   : (
                                      //     lead.assigned_to == LaravelSession.service_user.id
                                      //       ? <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
                                      //         onClick={() => onAttendClient(lead.id, false)}>
                                      //         <i className='fas fa-hands-wash'></i>
                                      //       </TippyButton>
                                      //       : <Tippy content={`Atendido por ${lead?.assigned?.fullname}`}>
                                      //         <a href="" data-bs-toggle="tooltip" data-bs-placement="top"
                                      //           title="Username">
                                      //           <img src={`//${Global.APP_DOMAIN}/api/profile/${lead?.assigned?.relative_id}`} alt="img"
                                      //           onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                                      //             className="avatar-xs rounded-circle" />
                                      //         </a>
                                      //       </Tippy>
                                      //   )
                                    }
                                  </li>
                                  <li className="list-inline-item">
                                    <span className="badge d-block" style={{
                                      backgroundColor: lead?.manage_status?.color || '#6c757d',
                                      width: 'max-content'
                                    }}>{lead?.manage_status?.name ?? 'Sin estado'}</span>
                                    <small className='text-muted'>{moment(lead.created_at).format('LLL')}</small>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </motion.li>
                        )
                      })
                    }
                  </AnimatePresence>
                  {
                    statusesLoading[status.id] &&
                    <motion.li
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="p-2"
                      style={{ cursor: 'wait' }}
                    >
                      <div className="kanban-box">
                        <div className="kanban-detail ms-0">
                          <div className="dropdown float-end">
                            <span className="dropdown-toggle arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="mdi mdi-dots-vertical placeholder"></i>
                            </span>
                          </div>
                          <h5 className="mt-0 text-truncate">
                            <span className="text-dark placeholder">
                              Nombre de lead
                            </span>
                          </h5>
                          <ul className="list-inline d-flex align-items-center gap-1 mb-0">
                            <li className="list-inline-item">
                              <span className="avatar-xs rounded-circle placeholder" />
                            </li>
                            <li className="list-inline-item">
                              <small className="text-sm d-block placeholder" style={{ width: 'max-content' }}>Estado</small>
                              <small className='text-muted placeholder'>0000-00-00 00:00:00</small>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </motion.li>
                  }
                </ul>
              </div>
            </div>
          </div>)
        })
      }
    </div>
  </>
}

export default LeadKanban