import React from "react"
import HtmlContent from "../../Utils/HtmlContent"
import TaskCard from "../Tasks/TaskCard"

const ClientNotesCard = ({ type, name, description, created_at, tasks, onTaskChange }) => {
  return <div className="card border border-primary mb-2">
    {
      name &&
      <div className="card-header p-2">
        <h5 className='card-title mb-0'><i className={`${type.icon} me-1`}></i> {name}</h5>
      </div>
    }
    <div className='card-body p-2'>
      {
        description &&
        <p className="card-text">
          <HtmlContent html={description} />
        </p>
      }
      {
        tasks.length > 0 &&
        tasks.map((task, i) => {
          return <TaskCard key={`task-${i}`} {...task} onChange={onTaskChange} />
        })
      }
      <p className="card-text">
        <small className="text-muted">{moment(created_at).format('LLLL')}</small>
      </p>
    </div>
  </div>
}

export default ClientNotesCard