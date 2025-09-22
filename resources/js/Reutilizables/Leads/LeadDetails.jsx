import React from "react"

const LeadDetails = () => {
  return <>
    <Modal modalRef={modalRef} title='Detalles del lead' btnSubmitText='Guardar' size='full-width' bodyClass='p-3 bg-light' isStatic onSubmit={(e) => e.preventDefault()}>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="d-flex mb-3">
            <img className="flex-shrink-0 me-3 rounded-circle avatar-md" alt={leadLoaded?.contact_name}
              src={`//${Global.APP_DOMAIN}/api/profile/null`} />
            <div className="flex-grow-1">
              <h4 className="media-heading mt-0">
                <i className='mdi mdi-lead-pencil me-1' style={{ cursor: 'pointer' }} onClick={() => onOpenModal(leadLoaded)}></i>
                {leadLoaded?.contact_name}
              </h4>
              <span className="badge bg-primary me-1">{leadLoaded?.contact_position || 'Trabajador'}</span> <small className='text-muted'>desde <b>{leadLoaded?.origin}</b></small>
            </div>
          </div>
          <div className="btn-group mb-0">
            <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{ color: '#ffffff', backgroundColor: leadLoaded?.manage_status?.color || '#6c757d' }}>
              {leadLoaded?.manage_status?.name || 'Sin estado'} <i className="mdi mdi-chevron-down"></i>
            </button>
            <div className="dropdown-menu">
              {manageStatuses.map((status, i) => {
                return <span key={`status-${i}`} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onManageStatusChange(leadLoaded, status)}>{status.name}</span>
              })}
            </div>
          </div>
          <hr />
          <h4>Datos del contacto</h4>
          <h5 className="font-600 mb-0">Correo electronico</h5>
          <p className='mb-2 text-truncate'> {leadLoaded?.contact_email} </p>
          <h5 className="font-600 mb-0">Tefono / Celular</h5>
          <p className='mb-2'> {leadLoaded?.contact_phone} </p>
          <h5 className="font-600 mb-0">Mensaje</h5>
          <p className='mb-2'> {leadLoaded?.message} </p>
          <h5 className="font-600 mb-0">Fecha de registro</h5>
          <p className='mb-2'>
            {moment(leadLoaded?.created_at).format('LL')}<br />
            <small className="text-muted">{moment(leadLoaded?.created_at).format('LTS')}</small>
          </p>
          <hr />
          <h4>Datos de la empresa</h4>

          <h5 className="font-600 mb-0">Nombre comercial</h5>
          <p className='mb-2'> {leadLoaded?.tradename ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">RUC</h5>
          <p className='mb-2'> {leadLoaded?.ruc ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">N° trabajadores</h5>
          <p className='mb-2'> {leadLoaded?.workers ?? <i className='text-muted'>No especifica</i>} </p>

        </div>

        <div className="col-lg-6 col-md-4 col-sm-6 col-xs-12">
          <div className="card card-body">
            <ul className="nav nav-tabs" style={{ flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden' }}>
              <li key={`note-type-activity`} className="nav-item">
                <a href="#note-type-activity" data-bs-toggle="tab" aria-expanded="false" className="nav-link active">
                  <i className="mdi mdi-clock"></i> Actividad
                </a>
              </li>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  if (type.name == 'Correos') return
                  return <li key={`note-type-${i}`} className="nav-item">
                    <a href={`#note-type-${type.id}`} data-name={type.name} data-bs-toggle="tab" aria-expanded="false" className="nav-link">
                      <i className={type.icon}></i> {type.name}
                    </a>
                  </li>
                })
              }
            </ul>
            <div className="tab-content">
              <div key={`tab-note-type-activity`} className='tab-pane active' id={`note-type-activity`}>
                {
                  notes.sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                    return <ClientNotesCard key={`note-${i}`} {...note} onTaskChange={onTaskStatusChange} showOptions={false} session={session} />
                  })
                }

              </div>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  return <div key={`tab-note-type-${i}`} className='tab-pane' id={`note-type-${type.id}`}>
                    <h4 className='header-title mb-2'>Lista de {type.name}</h4>
                    <input ref={idRefs[type.id]} type="hidden" />
                    <div className="row">
                      {
                        type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187' && <>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">Asunto</label>
                            <input type="text" className='form-control' />
                          </div>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">Para</label>
                            <input type="text" className='form-control' />
                          </div>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">CC</label>
                            <input type="text" className='form-control' />
                          </div>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">CCO</label>
                            <input type="text" className='form-control' />
                          </div>
                        </>
                      }
                      {
                        type.id == 'e20c7891-1ef8-4388-8150-4c1028cc4525' &&
                        <>
                          <InputFormGroup eRef={taskTitleRef} label='Titulo de la tarea' col='col-12' required />
                          <SelectFormGroup eRef={taskTypeRef} label="Tipo de tarea" col="col-lg-4 col-md-12" required dropdownParent={`#note-type-${type.id}`} minimumResultsForSearch={Infinity} >
                            <option value="Llamada">Llamada</option>
                            <option value="Correo">Correo</option>
                            <option value="Por hacer" selected>Por hacer</option>
                          </SelectFormGroup>
                          <SelectFormGroup eRef={taskPriorityRef} label="Prioridad" col="col-lg-3 col-md-12" required dropdownParent={`#note-type-${type.id}`} minimumResultsForSearch={Infinity} >
                            <option value="Baja">Baja</option>
                            <option value="Media" selected>Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </SelectFormGroup>
                          <SelectAPIFormGroup eRef={taskAssignedToRef} label='Asignado a' col='col-lg-5 col-md-12' dropdownParent={`#note-type-${type.id}`} searchAPI='/api/users/paginate' searchBy='fullname' />
                          <InputFormGroup eRef={taskEndsAtDateRef} label='Fecha finalización' type='date' col='col-lg-6 col-md-12' required />
                          <InputFormGroup eRef={taskEndsAtTimeRef} label='Hora finalización' type='time' col='col-lg-6 col-md-12' required />
                        </>
                      }
                      <div className="col-12 mb-2">
                        <label className='mb-1' htmlFor="">Contenido</label>
                        <div ref={typeRefs[type.id]} id={`editor-${type.id}`} style={{ height: '120px', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}></div>
                      </div>
                      <div className="col-12">
                        <button className='btn btn-sm btn-success' type='button' value={type.id} onClick={onSaveNote}>{type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187' ? 'Guardar y enviar' : 'Guardar'}</button>
                      </div>
                    </div>
                    <hr />
                    {
                      notes.filter(x => x.note_type_id == type.id).sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                        return <ClientNotesCard key={`note-${i}`} {...note} session={session} onDeleteNote={onDeleteNote} onUpdateNote={onUpdateNoteClicked} />
                      })
                    }
                  </div>
                })
              }
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="card">
            <div className="card-body">
              <h5 className="header-title">Lista de tareas</h5>
              <hr />
              {
                pendingTasks.length > 0
                  ? pendingTasks.sort((a, b) => a.ends_at > b.ends_at ? 1 : -1).map((task, i) => {
                    return <TaskCard key={`task-${i}`} {...task} onChange={onTaskStatusChange} />
                  })
                  : <i className='text-muted'>- No hay tareas pendientes -</i>
              }
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </>
}

export default LeadDetails