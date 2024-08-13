
import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto'

const Calendar = () => {

  const calendarRef = useRef()

  useEffect(() => {
    const calendar = new FullCalendar.Calendar(calendarRef.current, {
      slotDuration: "00:15:00", // Duración de cada slot de tiempo
      slotMinTime: "08:00:00", // Tiempo mínimo visible
      slotMaxTime: "19:00:00", // Tiempo máximo visible
      themeSystem: "bootstrap", // Sistema de temas
      bootstrapFontAwesome: false, // Deshabilita FontAwesome
      buttonText: {
        today: "Hoy",
        month: "Mes",
        week: "Semana",
        day: "Dia",
        list: "Lista",
        prev: "<",
        next: ">"
      },
      initialView: "dayGridMonth", // Vista inicial del calendario
      handleWindowResize: true, // Maneja el redimensionamiento de la ventana
      height: $(document.body).height() - 200, // Altura del calendario
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth"
      },
      initialEvents: [], // Carga los eventos por defecto
      editable: true, // Permite editar eventos
      droppable: true, // Permite arrastrar eventos externos
      selectable: true, // Permite seleccionar fechas en el calendario
      dateClick: function (info) {
        self.onSelect(info); // Maneja la selección de una fecha
      },
      eventClick: function (info) {
        self.onEventClick(info); // Maneja el clic en un evento
      }
    })
    calendar.render()
  }, [null])

  return (<>
    <div className="row">
      <div className="col-12">
        <div className="row">
          <div className="col-lg-3">
            <button className="btn btn-lg font-16 btn-success w-100" id="btn-new-event"><i
              className="fa fa-plus me-1"></i> Create New</button>

            <div id="external-events">
              <br />
              <p className="text-muted">Drag and drop your event or click in the calendar</p>
              <div className="external-event bg-primary" data-class="bg-primary">
                <i className="mdi mdi-checkbox-blank-circle me-2 vertical-middle"></i>New Theme
                Release
              </div>
              <div className="external-event bg-pink" data-class="bg-pink">
                <i className="mdi mdi-checkbox-blank-circle me-2 vertical-middle"></i>My Event
              </div>
              <div className="external-event bg-warning" data-class="bg-warning">
                <i className="mdi mdi-checkbox-blank-circle me-2 vertical-middle"></i>Meet
                manager
              </div>
              <div className="external-event bg-purple" data-class="bg-danger">
                <i className="mdi mdi-checkbox-blank-circle me-2 vertical-middle"></i>Create New
                theme
              </div>
            </div>

            <div className="form-check mt-3">
              <input type="checkbox" className="form-check-input" id="drop-remove" />
              <label className="form-check-label" htmlFor="drop-remove">Remove after drop</label>
            </div>

          </div>

          <div className="col-lg-9">
            <div className="card">
              <div className="card-body">

                <div ref={calendarRef}></div>

              </div>
            </div>
          </div>

        </div>
        <div className="modal fade" id="event-modal" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header py-3 px-4 border-bottom-0 d-block">
                <button type="button" className="btn-close float-end" data-bs-dismiss="modal"
                  aria-label="Close"></button>
                <h5 className="modal-title" id="modal-title">Event</h5>
              </div>
              <div className="modal-body px-4 pb-4 pt-0">
                <form className="needs-validation" name="event-form" id="form-event" noValidate>
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Event Name</label>
                        <input className="form-control" placeholder="Insert Event Name"
                          type="text" name="title" id="event-title" required />
                        <div className="invalid-feedback">Please provide a valid event
                          name</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select className="form-select" name="category"
                          id="event-category" defaultValue='bg-danger' required>
                          <option value="bg-danger">Danger</option>
                          <option value="bg-success">Success</option>
                          <option value="bg-primary">Primary</option>
                          <option value="bg-info">Info</option>
                          <option value="bg-dark">Dark</option>
                          <option value="bg-warning">Warning</option>
                        </select>
                        <div className="invalid-feedback">Please select a valid event
                          category</div>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-6 col-4">
                      <button type="button" className="btn btn-danger"
                        id="btn-delete-event">Delete</button>
                    </div>
                    <div className="col-md-6 col-8 text-end">
                      <button type="button" className="btn btn-light me-1"
                        data-bs-dismiss="modal">Close</button>
                      <button type="submit" className="btn btn-success"
                        id="btn-save-event">Save</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Usuarios'>
      <Calendar {...properties} />
    </Adminto>
  );
})