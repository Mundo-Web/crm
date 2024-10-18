import React from "react"
import HtmlContent from "../../Utils/HtmlContent"
import TaskCard from "../Tasks/TaskCard"

const ClientNotesCard = ({ id, type, name, process, description, created_at, updated_at, user_id, tasks, onTaskChange, showOptions = true, session, onDeleteNote, onUpdateNote, status, manage_status }) => {
  if (!type) {
    return <div className="card card-body p-2 mb-2" style={{ border: '1px solid #dee2e6' }}>
      <p className="card-text mb-0">
        <i className='mdi mdi-clock me-1'></i>
        {name}
      </p>
      <p className="card-text">
        <small className="text-muted">{moment(created_at).format('LLL')} {updated_at != created_at && <span>· <i>Editado</i></span>}</small>
      </p>
    </div>
  }
  return <div className="card border border-primary mb-2">
    {
      name &&
      <div className="card-header p-2 d-flex justify-content-between align-items-center">
        <h5 className='card-title mb-0'>{
          process
            ? <>
              <i className='mdi mdi-timeline-text me-1'></i> {process} <small className="text-muted">{name}</small>
            </>
            : <>
              <i className={`${type?.icon ?? 'mdi mdi-clock'} me-1`}></i> {name}
            </>}</h5>
        {
          (showOptions && user_id == session.service_user.id) && <div className="dropdown">
            <a className="dropdown-toggle arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false" style={{ cursor: 'pointer' }}>
              <i className="mdi mdi-dots-vertical"></i>
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onUpdateNote({ id, type, name, description, tasks })}>
                <i className="fa fa-pen me-1"></i>
                Editar
              </a>
              <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onDeleteNote(id)}>
                <i className="fa fa-trash me-1"></i>
                Eliminar
              </a>
            </div>
          </div>
        }
      </div>
    }
    <div className='card-body p-2'>
      {
        description &&
        <div className="card-text">
          <HtmlContent html={description} />
        </div>
      }
      {
        tasks.length > 0 &&
        tasks.map((task, i) => {
          return <TaskCard key={`task-${i}`} {...task} onChange={onTaskChange} />
        })
      }
      {
        (status || manage_status) &&
        <div className="d-flex mb-1 gap-1">
          {
            status &&
            <span class="badge rounded-pill px-1" style={{ paddingTop: '4px', backgroundColor: status.color }}>{status.name}</span>
          }
          {
            manage_status &&
            <span class="badge rounded-pill px-1" style={{ paddingTop: '4px', backgroundColor: manage_status.color }}>{manage_status.name}</span>
          }
        </div>
      }
      <p className="card-text">
        <small className="text-muted">{moment(created_at).format('LLL')} {updated_at != created_at && <span>· <i>Editado</i></span>}</small>
      </p>
    </div>
  </div>
}

export default ClientNotesCard