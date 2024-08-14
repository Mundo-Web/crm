import React, { useRef } from "react";
import { createRoot } from "react-dom/client";
import '../css/coming-soon.css';
import TasksRest from "./actions/TasksRest";
import Adminto from "./components/Adminto";
import TippyButton from "./components/form/TippyButton";
import Table from "./components/Table";
import CreateReactScript from "./Utils/CreateReactScript";
import ReactAppend from "./Utils/ReactAppend";
import Global from "./Utils/Global";
import DxBox from "./components/dx/DxBox";
import Dropdown from "./components/dropdown/DropDown";
import DropdownItem from "./components/dropdown/DropdownItem";

const tasksRest = new TasksRest();

const Tasks = () => {
  const gridRef = useRef()

  const statuses = {
    'Pendiente': {
      icon: 'mdi mdi-clock-time-eight-outline',
      color: 'btn-danger'
    },
    'En curso': {
      icon: 'mdi mdi-timer-sand',
      color: 'btn-primary'
    },
    'Realizado': {
      icon: 'mdi mdi-check',
      color: 'btn-success'
    }
  }

  const types = {
    'Llamada': {
      icon: 'mdi mdi-phone-forward'
    },
    'Correo': {
      icon: 'mdi mdi-email-send'
    },
    'Por hacer': {
      icon: 'mdi mdi-clock-start'
    }
  }

  const priorities = {
    'Baja': {
      color: 'bg-light',
    },
    'Media': {
      color: 'bg-success',
    },
    'Alta': {
      color: 'bg-warning',
    },
    'Urgente': {
      color: 'bg-danger',
    }
  }

  const onTaskStatusChange = async (id, status) => {
    const result = await tasksRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return <>
    <Table gridRef={gridRef} title='Tareas' rest={tasksRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'plus',
            hint: 'Nuevo registro',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'status',
          caption: 'Estado',
          width: '120px',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'overflow: visible')
            container.append(DxBox([
              {
                height: '28px',
                children: <Dropdown className={`btn btn-xs ${statuses[data.status].color} rounded-pill`} title={data.status} tippy='Actualizar estado' icon={{ icon: statuses[data.status].icon, color: '#ffffff' }}>
                  {Object.keys(statuses).map((statusName, i) => {
                    return <DropdownItem key={`item-${i}`} onClick={() => onTaskStatusChange(data.id, statusName)}>
                      <i className={statuses[statusName].icon}></i> {statusName}
                    </DropdownItem>
                  })}
                </Dropdown>
              }
            ]))
            // ReactAppend(container, <div>
            //   <button className={`btn btn-xs ${statuses[data.status].color} btn-sm dropdown-toggle`} type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            //     <i className={statuses[data.status].icon}></i> {data.status} <i className="mdi mdi-chevron-down"></i>
            //   </button>
            //   <div className="dropdown-menu">
            //     {Object.keys(statuses).map((statusName, i) => {
            //       return <span key={`status-${i}`} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onChange(id, statusName)}>
            //         <i className={statuses[statusName].icon}></i> {statusName}
            //       </span>
            //     })}
            //   </div>
            // </div>)
          }
        },
        {
          dataField: 'name',
          caption: 'Titulo',
          dataType: 'string',
          width: '250px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div style={{ width: '240px' }}>
              <b className="d-block my-0">{data.name}</b>
              <div className="mb-0">
                <span class="badge bg-light text-dark me-1"><i className={types[data.type].icon}></i> {data.type}</span>
                <span class={`badge ${priorities[data.priority].color}`}>{data.priority}</span>
              </div>
            </div>)
          }
        },
        {
          dataField: 'type',
          caption: 'Tipo',
          dataType: 'string',
          cellTemplate: (container, { data }) => {
            container.text(data.type)
            container.prepend(`<i class="${types[data.type].icon} me-1"></i>`)
          },
          visible: false
        },
        {
          dataField: 'priority',
          caption: 'Prioridad',
          dataType: 'string',
          alignment: 'center',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span className={`badge ${priorities[data.priority].color}`}>{data.priority}</span>)
          },
          visible: false
        },
        {
          dataField: 'client_note.client.contact_name',
          caption: 'Contacto asociado',
          width: '185px',
          cellTemplate: (container, { data }) => {
            const client = data.client_note.client
            ReactAppend(container, <div style={{ width: '185px' }}>
              <b className="d-block my-0 text-truncate">{client.contact_name}</b>
              <small>
                <i className="mdi mdi-phone me-1"></i>
                {client.country_prefix || ''}{client.contact_phone}
              </small>
            </div>)
          }
        },
        {
          dataField: 'assigned.fullname',
          caption: 'Asignado a',
          cellTemplate: (container, { data }) => {
            if (!data.assigned) return
            ReactAppend(container, <>
              <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} alt={data.assigned.fullname} class="img-fluid avatar-xs rounded-circle me-1"></img>
              <b>{data.assigned.fullname}</b>
            </>)
          }
        },
        // {
        //   caption: 'Acciones',
        //   cellTemplate: (container, { data }) => {
        //     container.attr('style', 'display: flex; gap: 4px; overflow: unset')

        //     ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
        //       <i className='fa fa-pen'></i>
        //     </TippyButton>)

        //     ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
        //       <i className='fa fa-trash-alt'></i>
        //     </TippyButton>)
        //   },
        //   allowFiltering: false,
        //   allowExporting: false
        // }
      ]} />
  </>
}

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Tareas'>
      <Tasks {...properties} />
    </Adminto>
  );
})