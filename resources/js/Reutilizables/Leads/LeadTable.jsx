import React from "react"
import Table from "../../components/Table"
import DxPanelButton from "../../components/dx/DxPanelButton"
import { renderToString } from "react-dom/server"
import ReactAppend from "../../Utils/ReactAppend"
import Global from "../../Utils/Global"
import Tippy from "@tippyjs/react"
import StatusDropdown from "../Statuses/StatusDropdown"
import TippyButton from "../../components/form/TippyButton"
import LaravelSession from "../../Utils/LaravelSession"

const LeadTable = ({ gridRef, rest, can, defaultLeadStatus, statuses, manageStatuses, onClientStatusClicked, onManageStatusChange, onLeadClicked, onMessagesClicked, onAttendClient, onOpenModal, onMakeLeadClient, onArchiveClicked, onDeleteClicked, title }) => {
  return <Table gridRef={gridRef} title={title} rest={rest} reloadWith={[statuses, manageStatuses]}
    toolBar={(container) => {
      container.unshift(DxPanelButton({
        className: 'btn btn-xs btn-soft-dark text-nowrap',
        text: 'Actualizar',
        title: 'Refrescar tabla',
        icon: 'fas fa-undo-alt',
        onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
      }))
      can('leads', 'all', 'create') && container.unshift(DxPanelButton({
        className: 'btn btn-xs btn-soft-primary text-nowrap',
        text: 'Nuevo',
        title: 'Agregar registro',
        icon: 'fa fa-plus',
        onClick: () => onOpenModal()
      }))
    }}
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
          container.attr('style', `height: 48px; border-left: 4px solid ${data.status.color}`)

          ReactAppend(container, <div className="d-flex align-items-center gap-1">
            <TippyButton className='btn btn-xs btn-white' title='Ver mensajes' onClick={() => onMessagesClicked(data)}>
              <i className='mdi mdi-whatsapp text-success'></i>
            </TippyButton>
            <div onClick={() => onLeadClicked(data)} style={{ cursor: 'pointer' }}>
              {
                data.status_id == defaultLeadStatus
                  ? <b className='d-block'>{data.contact_name}</b>
                  : <span className='d-block'>{data.contact_name}</span>
              }
              {
                data.products_count > 0 &&
                <small className='text-muted'>{data.products_count} {data.products_count > 1 ? 'productos' : 'producto'}</small>
              }
            </div>
          </div>)
        },
        fixed: true,
        fixedPosition: 'left'
      },
      {
        dataField: 'assigned.fullname',
        caption: 'Usuario',
        width: 58,
        cellTemplate: (container, { data }) => {
          container.attr('style', 'height: 48px')
          ReactAppend(container, <div className='d-flex align-items-center gap-1'>
            {data.assigned_to
              ? <>
                <Tippy content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}>
                  <img className='avatar-sm rounded-circle' src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} alt={data.assigned.name} />
                </Tippy>
              </>
              : ''}
          </div>)
        },
        fixed: true,
        fixedPosition: 'left'
      },
      {
        dataField: 'contact_email',
        caption: 'Correo'
      },
      {
        dataField: 'contact_phone',
        caption: 'Telefono'
      },
      {
        dataField: 'status.name',
        caption: 'Estado de gestión',
        dataType: 'string',
        width: 180,
        cellTemplate: (container, { data }) => {
          container.addClass('p-0')
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
          container.addClass('p-0')
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
        caption: 'Origen',
        dataType: 'string'
      },
      {
        dataField: 'triggered_by',
        caption: 'Disparado por',
        dataType: 'string'
      },
      {
        dataField: 'created_at',
        caption: 'Fecha creacion',
        dataType: 'date',
        cellTemplate: (container, { data }) => {
          container.text(moment(data.created_at.replace('Z', '+05:00')).format('lll'))
        },
        sortOrder: 'desc',
      },
      {
        caption: 'Acciones',
        width: 240,
        cellTemplate: (container, { data }) => {
          container.attr('style', 'display: flex; gap: 4px; height: 47px; overflow: visible')

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
    ]} />
}

export default LeadTable