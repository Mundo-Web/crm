import React, { useContext, useEffect } from "react"
import Table from "../../components/Table"
import { renderToString } from "react-dom/server"
import ReactAppend from "../../Utils/ReactAppend"
import Global from "../../Utils/Global"
import Tippy from "@tippyjs/react"
import StatusDropdown from "../Statuses/StatusDropdown"
import TippyButton from "../../components/form/TippyButton"
import LaravelSession from "../../Utils/LaravelSession"
import LeadsRest from "../../actions/LeadsRest"
import Swal from "sweetalert2"
import ClientsRest from "../../actions/ClientsRest"
import ArrayJoin from "../../Utils/ArrayJoin"
import { LeadsContext } from "./LeadsProvider"
import sourceOptions from "../Campaigns/socials.json"

const leadsRest = new LeadsRest()
const clientsRest = new ClientsRest()

const LeadTable = ({ gridRef, cardClass, otherGridRef, rest, can, defaultLeadStatus, statuses, manageStatuses, onClientStatusClicked, onManageStatusChange, onLeadClicked, onMessagesClicked, onAttendClient, onOpenModal, onMakeLeadClient, onArchiveClicked, onDeleteClicked, title, borderColor = '#315AFE', setStatuses, setManageStatuses, users, filterAssignation, completeRegistration }) => {

  const { selectedUsersId, setSelectedUsersId, defaultView } = useContext(LeadsContext)

  const onMassiveAssignClicked = async (userId) => {
    const selectedRows = $(gridRef.current).dxDataGrid('instance').getSelectedRowKeys().map(({ id }) => id);

    if (!selectedRows.length) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay leads seleccionados',
        text: 'Por favor seleccione al menos un lead para asignar'
      });
      return;
    }

    const isUnassigning = userId === null;
    const selectedUser = !isUnassigning ? users.find(user => user.id === userId) : null;

    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: isUnassigning ? 'Confirmar Desasignación' : 'Confirmar Asignación',
      text: isUnassigning
        ? `¿Está seguro que desea quitar la asignación de ${selectedRows.length} lead(s)?`
        : `¿Está seguro que desea asignar ${selectedRows.length} lead(s) a ${selectedUser?.name}?`,
      showCancelButton: true,
      confirmButtonText: isUnassigning ? 'Sí, quitar asignación' : 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) return;

    const result = await leadsRest.massiveAssign({
      leadsId: selectedRows,
      userId: userId
    });

    if (!result) return;

    Swal.fire({
      icon: 'success',
      title: isUnassigning ? 'Asignación Removida' : 'Leads Asignados',
      text: isUnassigning
        ? 'Se ha quitado la asignación de los leads exitosamente'
        : 'Los leads han sido asignados exitosamente'
    });

    const grid = $(gridRef.current).dxDataGrid('instance');
    grid.clearSelection();
    grid.refresh();
    $(otherGridRef.current).dxDataGrid('instance').refresh();
  }

  const onMassiveArchiveClicked = async () => {
    const selectedRows = $(gridRef.current).dxDataGrid('instance').getSelectedRowKeys().map(({ id }) => id);

    if (!selectedRows.length) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay leads seleccionados',
        text: 'Por favor seleccione al menos un lead para archivar'
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: 'Confirmar Archivo',
      text: `¿Está seguro que desea archivar ${selectedRows.length} lead(s)?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) return;

    const result = await clientsRest.massiveDelete({
      clientsId: selectedRows
    });

    if (!result) return;

    Swal.fire({
      icon: 'success',
      title: 'Leads Archivados',
      text: 'Los leads han sido archivados exitosamente'
    });

    const grid = $(gridRef.current).dxDataGrid('instance');
    grid.clearSelection();
    grid.refresh();
  }

  const onMassiveDeleteClicked = async () => {
    const selectedRows = $(gridRef.current).dxDataGrid('instance').getSelectedRowKeys().map(({ id }) => id);

    if (!selectedRows.length) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay leads seleccionados',
        text: 'Por favor seleccione al menos un lead para eliminar'
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: 'Confirmar Eliminación',
      text: `¿Está seguro que desea eliminar ${selectedRows.length} lead(s)?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) return;

    const result = await clientsRest.massiveDelete({
      clientsId: selectedRows,
      hardDeletion: true
    });

    if (!result) return;

    Swal.fire({
      icon: 'success',
      title: 'Leads Eliminados',
      text: 'Los leads han sido eliminados exitosamente'
    });

    const grid = $(gridRef.current).dxDataGrid('instance');
    grid.clearSelection();
    grid.refresh();
  }

  useEffect(() => {
    // if (defaultView != 'table' || !filterAssignation) return
    // const grid = $(gridRef.current).dxDataGrid('instance');
    // grid.clearFilter('assigned_to')
    // if (selectedUsersId.length > 0) {
    //   const prevFilter = grid.filter()
    //   grid.filter(ArrayJoin([prevFilter, ArrayJoin(selectedUsersId.map(id => (['assigned_to', '=', id])), 'or')].filter(Boolean), 'and'));
    // } else {
    //   grid.refresh()
    // }
  }, [selectedUsersId, defaultView])

  return <Table cardClass={cardClass} gridRef={gridRef} title={<>
    <h4 className="header-title my-0">{title}</h4>
    {
      filterAssignation && <div className="d-flex gap-0 mt-2 align-items-center driver-js-users-filter overflow-auto">
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
    }
  </>} rest={rest} reloadWith={[statuses, manageStatuses]}
    filter={filterAssignation ? ArrayJoin(selectedUsersId.map((id) => (['assigned_to', '=', id])), 'or') : []}
    toolBar={(container) => {
      // container.unshift(DxPanelButton({
      //   className: 'btn btn-xs btn-soft-dark text-nowrap',
      //   text: 'Actualizar',
      //   title: 'Refrescar tabla',
      //   icon: 'fas fa-undo-alt',
      //   onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
      // }))
      // can('leads', 'all', 'create') && container.unshift(DxPanelButton({
      //   className: 'btn btn-xs btn-soft-primary text-nowrap',
      //   text: 'Nuevo',
      //   title: 'Agregar registro',
      //   icon: 'fa fa-plus',
      //   onClick: () => onOpenModal()
      // }))
    }}
    keyExpr='id'
    selection={{
      mode: 'multiple',
      allowSelectAll: true,
      selectAllMode: 'page'
    }}
    // onSelectionChanged={({selectedRowKeys}) => {
    //   console.log(selectedRowKeys)
    // }}
    massiveActions={<>
      <li>
        <button className="dropdown-item">
          <div className="d-flex justify-content-between gap-1">
            <span>
              <i className="mdi mdi-account me-1"></i>
              Asignar a
            </span>
            <i className="mdi mdi-chevron-right"></i>
          </div>
        </button>
        <ul className="dropdown-menu dropdown-submenu" style={{
          maxHeight: '360px',
          overflowY: 'auto'
        }}>
          {
            users.map((user) => {
              return <li key={user.id}>
                <button className="dropdown-item d-flex gap-1 align-items-center" onClick={() => onMassiveAssignClicked(user.service_user.id)}>
                  <img className='avatar-xs rounded-circle' src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`} onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }} alt={user.name} />
                  {user.name?.split(' ')?.[0]} {user.lastname?.split(' ')?.[0]}
                </button>
              </li>
            })
          }
        </ul>
      </li>
      <li>
        <button className="dropdown-item" onClick={() => onMassiveAssignClicked(null)}>
          <i className="mdi mdi-account-off me-1"></i>
          Quitar Asignación
        </button>
      </li>
      <li>
        <button className="dropdown-item" onClick={onMassiveArchiveClicked}>
          <i className="mdi mdi-archive me-1"></i>
          Archivar
        </button>
      </li>
      <li>
        <button className="dropdown-item" onClick={onMassiveDeleteClicked}>
          <i className="mdi mdi-delete me-1"></i>
          Eliminar
        </button>
      </li>
      <li>
        <button className="dropdown-item" onClick={() => {
          const grid = $(gridRef.current).dxDataGrid('instance');
          grid.clearSelection();
        }}>
          <i className="mdi mdi-selection-off me-1"></i>
          Quitar selección
        </button>
      </li>
    </>}
    exportable
    height={'calc(65vh - 90px)'}
    pageSize={25}
    allowedPageSizes={[10, 25, 50, 100]}
    // selection={{
    //   mode: 'multiple',
    //   selectAllMode: 'page'
    // }}
    columns={[
      {
        dataField: 'contact_name',
        caption: 'Lead',
        width: 250,
        cellTemplate: (container, { data }) => {
          container.attr('style', `height: 48px; border-left: 4px solid ${data.status.color}; cursor: pointer;`)
          container.on('click', () => onLeadClicked(data))

          let integrationIcon = null

          switch (data?.integration?.meta_service) {
            case 'messenger':
              integrationIcon = <i className='mdi mdi-facebook-messenger text-blue'></i>
              break;
            case 'instagram':
              integrationIcon = <i className='mdi mdi-instagram text-red'></i>
              break;
            default:
              integrationIcon = <i className='mdi mdi-whatsapp text-success'></i>
              break;
          }

          ReactAppend(container, <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              {
                integrationIcon &&
                <TippyButton className='btn btn-xs btn-white' title='Ver mensajes' onClick={(e) => {
                  window.location.href = `/chat/${data.id}`
                  e.stopPropagation()
                }}>
                  {integrationIcon}
                </TippyButton>
              }
              <div className="text-truncate">
                {
                  data.status_id == defaultLeadStatus
                    ? <b className='d-block text-truncate'>{data.contact_name}</b>
                    : <span className='d-block text-truncate'>{data.contact_name}</span>
                }
                {
                  data.products_count > 0 &&
                  <small className='text-muted'>{data.products_count} {data.products_count > 1 ? 'productos' : 'producto'}</small>
                }
              </div>
            </div>
            <div className="d-flex gap-1">
              {
                completeRegistration &&
                <Tippy content={data.complete_registration ? 'Registro manual/completo' : 'Registro incompleto'}>
                  <span className={data.complete_registration ? 'text-success' : 'text-muted'}>
                    {
                      data.complete_registration
                        ? <i className="mdi mdi-account-check"></i>
                        : <i className="mdi mdi-account-clock"></i>
                    }
                  </span>
                </Tippy>
              }
              {
                completeRegistration && data.form_answers !== null &&
                <Tippy content={data.complete_form ? 'Formulario completado' : 'Formulario incompleto'}>
                  <span className={data.complete_form ? 'text-success' : 'text-muted'}>
                    {
                      data.complete_form
                        ? <i className="mdi mdi-file-check"></i>
                        : <i className="mdi mdi-file-clock"></i>
                    }
                  </span>
                </Tippy>
              }
            </div>
          </div>)
        },
        fixed: true,
        fixedPosition: 'left'
      },
      {
        dataField: 'assigned_to',
        dataType: 'string',
        caption: 'Usuario',
        width: 58,
        cellTemplate: (container, { data }) => {
          container.attr('style', 'height: 48px')
          ReactAppend(container, <div className='d-flex align-items-center gap-1'>
            {data.assigned_to
              ? <>
                <Tippy content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}>
                  <img className='avatar-sm rounded-circle' src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }} alt={data.assigned.name} />
                </Tippy>
              </>
              : ''}
          </div>)
        },
        fixed: true,
        fixedPosition: 'left',
        allowFiltering: false
      },
      {
        dataField: 'contact_email',
        caption: 'Correo',
        cellTemplate: (container, { data }) => {
          container.html(renderToString(<>
            <i className="mdi mdi-email-outline text-blue me-1"></i>
            {data.contact_email}
          </>))
        }
      },
      {
        dataField: 'contact_phone',
        caption: 'Telefono',
        cellTemplate: (container, { data }) => {
          container.html(renderToString(<>
            <i className="mdi mdi-cellphone text-blue me-1"></i>
            {data.contact_phone}
          </>))
        }
      },
      {
        dataField: 'status.name',
        caption: 'Estado de gestión',
        dataType: 'string',
        width: 180,
        cellTemplate: (container, { data }) => {
          // container.addClass('p-0')
          container.attr('style', 'overflow: visible')
          ReactAppend(container, <StatusDropdown
            items={statuses}
            defaultValue={data.status}
            base={{
              table_id: 'e05a43e5-b3a6-46ce-8d1f-381a73498f33'
            }}
            onItemClick={(status) => onClientStatusClicked(data.id, status.id)}
            canCreate={can('statuses', 'all', 'create')}
            canUpdate={can('statuses', 'all', 'update')}
            canDelete={can('statuses', 'all', 'delete')}
            onDropdownClose={(hasChanges, items) => {
              if (!hasChanges) return
              setStatuses(items)
            }}
          />)
        }
      },
      {
        dataField: 'manage_status.name',
        caption: 'Estado del lead',
        dataType: 'string',
        width: 180,
        cellTemplate: (container, { data }) => {
          // container.addClass('p-0')
          container.attr('style', 'overflow: visible')
          ReactAppend(container, <StatusDropdown
            items={manageStatuses}
            defaultValue={data.manage_status}
            base={{
              table_id: '9c27e649-574a-47eb-82af-851c5d425434'
            }}
            onItemClick={(status) => onManageStatusChange(data, status)}
            canCreate={can('statuses', 'all', 'create')}
            canUpdate={can('statuses', 'all', 'update')}
            canDelete={can('statuses', 'all', 'delete')}
            onDropdownClose={(hasChanges, items) => {
              if (!hasChanges) return
              setManageStatuses(items)
            }}
          />)
        }
      },
      {
        dataField: 'origin',
        caption: 'Red Social (Campaña)',
        dataType: 'string'
      },
      {
        dataField: 'source',
        caption: 'Recurso',
        dataType: 'string'
      },
      {
        dataField: 'triggered_by',
        caption: 'Registrado en',
        dataType: 'string'
      },
      {
        dataField: 'source_channel',
        caption: 'Donde nos vio?',
        dataType: 'string'
      },
      {
        dataField: 'campaign.source',
        caption: 'RS Campaña',
        dataType: 'string',
        width: 100,
        lookup: {
          dataSource: sourceOptions,
          valueExpr: 'id',
          displayExpr: 'label'
        }
      },
      {
        dataField: 'campaign.title',
        caption: 'Campaña',
        dataType: 'string',
        width: 200,
        cellTemplate: (container, { data }) => {
          if (!data.campaign) return;
          const campaignLink = data.campaign.link;
          container.html(renderToString(
            campaignLink
              ? <a className="text-truncate d-block text-decoration-none" style={{ maxWidth: '100%', color: 'inherit' }} href={campaignLink} target="_blank" rel="noopener noreferrer">
                <code style={{ color: '#ff8acc' }}>{data.campaign.code}</code>
                <small className="ms-1">{data.campaign.title}</small>
              </a>
              : <div className="text-truncate" style={{ maxWidth: '100%' }}>
                <code>{data.campaign.code}</code>
                <small className="ms-1">{data.campaign.title}</small>
              </div>
          ))
        }
      },
      {
        dataField: 'created_at',
        caption: 'Fecha creacion',
        dataType: 'date',
        cellTemplate: (container, { data }) => {
          container.html(renderToString(<>
            <i className="mdi mdi-calendar-blank text-blue me-1"></i>
            {moment(data.created_at.replace('Z', '+05:00')).format('lll')}
          </>))
        },
        sortOrder: 'desc',
      },
      {
        dataField: 'updated_at',
        caption: 'Fecha actualización',
        dataType: 'date',
        cellTemplate: (container, { data }) => {
          container.html(renderToString(<>
            <i className="mdi mdi-calendar-blank text-blue me-1"></i>
            {moment(data.updated_at.replace('Z', '+05:00')).format('lll')}
          </>))
        },
      },
      {
        caption: 'Acciones',
        width: 240,
        cellTemplate: (container, { data }) => {
          container.attr('style', 'display: flex; gap: 8px; height: 47px; overflow: visible; align-items: center')

          ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-warning' title='Editar lead' onClick={() => onOpenModal(data)}>
            <i className='fa fa-pen'></i>
          </TippyButton>)

          ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Ver detalles' onClick={() => onLeadClicked(data)}>
            <i className='fa fa-eye'></i>
          </TippyButton>)

          if (!data.assigned_to) {
            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title="Atender lead"
              onClick={() => onAttendClient(data.id, true)}>
              <i className='fas fa-hands-helping'></i>
            </TippyButton>)
          } else if (data.assigned_to == LaravelSession.service_user.id) {
            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
              onClick={() => onAttendClient(data.id, false)}>
              <i className='fas fa-hands-wash'></i>
            </TippyButton>)
          }

          ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-success' title='Convertir en cliente' onClick={async () => onMakeLeadClient(data)}>
            <i className='fa fa-user-plus'></i>
          </TippyButton>)
          ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Archivar lead' onClick={(e) => onArchiveClicked(data, e)}>
            <i className='mdi mdi-archive'></i>
          </TippyButton>)
          ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar lead' onClick={() => onDeleteClicked(data)}>
            <i className='fa fa-trash'></i>
          </TippyButton>)
        },
        allowFiltering: false,
        allowExporting: false
      }
    ]}
    cardStyle={{
      borderRight: `6px solid ${borderColor}`
    }} />
}

export default LeadTable