import React from "react"
import HtmlContent from "../../Utils/HtmlContent"
import Global from "../../Utils/Global"

const TaskCard = ({ id, status, name, description, assigned, priority, type, onChange, ends_at }) => {
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

  return <div className="card border border-default mb-1">
    <div className="card-body p-2">
      <blockquote className="card-bodyquote mb-0">
        <div className="btn-group mb-1 d-flex justify-content-between align-items-center">
          <div>
            <button className={`btn btn-xs ${statuses[status].color} btn-sm dropdown-toggle`} type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <i className={statuses[status].icon}></i> {status} <i className="mdi mdi-chevron-down"></i>
            </button>
            <div className="dropdown-menu">
              {Object.keys(statuses).map((statusName, i) => {
                return <span key={`status-${i}`} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onChange(id, statusName)}>
                  <i className={statuses[statusName].icon}></i> {statusName}
                </span>
              })}
            </div>
          </div>
          <small className="text-muted ms-1">vence {moment(ends_at).fromNow()}</small>
        </div>
        <div className="mb-1">
          <span class="badge bg-light text-dark me-1"><i className={types[type].icon}></i> {type}</span>
          <span class={`badge ${priorities[priority].color}`}>{priority}</span>
        </div>
        <h5 className="mt-0">{name}</h5>
        {
          description &&
          <small>
            <HtmlContent html={description} />
          </small>
        }
      </blockquote>
      {
        assigned &&
        <small>
          <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${assigned.relative_id}`} alt={assigned.fullname} class="img-fluid avatar-xs rounded-circle me-1"></img>
          Asignado a <b>{assigned.fullname}</b>
        </small>
      }
    </div>
  </div>
}

export default TaskCard