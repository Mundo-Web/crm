import React, { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import 'tippy.js/dist/tippy.css';
import Swal from "sweetalert2";
import NotesRest from "../../actions/ClientNotesRest";
import InputFormGroup from "../../components/form/InputFormGroup";
import TextareaFormGroup from "../../components/form/TextareaFormGroup";
import SelectAPIFormGroup from "../../components/form/SelectAPIFormGroup";
import SetSelectValue from "../../Utils/SetSelectValue";
import DropdownItem from "../../components/dropdown/DropdownItem";
import DropdownEnd from "../../components/dropdown/DropdownEnd";

const ClientNotesModal = ({ can, client, setClient, grid2refresh, page }) => {

  const modalNoteRef = useRef()
  const modalAddNoteRef = useRef()

  const idRef = useRef()
  const typeRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [notes, setNotes] = useState([])
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (client.id) {
      onNotesModalOpen()
    }

    $(modalNoteRef.current).on('hidden.bs.modal', () => {
      setClient({})
      setNotes([])
      setIsEditing(false)
      idRef.current.value = null
      SetSelectValue(typeRef.current, null, null)
      nameRef.current.value = null
      descriptionRef.current.value = null
    })
  }, [client])


  const onNotesModalOpen = async () => {
    const notesByClient = await NotesRest.byClient(client?.id)
    setNotes(notesByClient)
    $(modalNoteRef.current).modal('show')
  }

  console.log(client)

  const onNoteSubmit = async (e) => {
    e.preventDefault()
    const request = {
      id: idRef.current.value || undefined,
      type_id: typeRef.current.value,
      client_id: client.id,
      name: nameRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await NotesRest.save(request)
    if (!result) return

    $(modalAddNoteRef.current).modal('hide')

    idRef.current.value = null
    SetSelectValue(typeRef.current, null, null)
    nameRef.current.value = null
    descriptionRef.current.value = null

    await reloadNotes()
    $(grid2refresh.current).dxDataGrid('instance').refresh()
  }

  const reloadNotes = async () => {
    const notesByClient = await NotesRest.byClient(client.id)
    setNotes(notesByClient)
  }

  const onEditNote = async (note) => {
    idRef.current.value = note.id
    SetSelectValue(typeRef.current, note.type.id, note.type.name)
    nameRef.current.value = note.name
    descriptionRef.current.value = note.description

    $(modalAddNoteRef.current).modal('show')
    setIsEditing(true)
  }

  const onDeleteNote = async (note_id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar esta nota?",
      text: "No podras revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return

    const result = await NotesRest.delete(note_id)
    if (!result) return
    await reloadNotes()
    $(grid2refresh.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Modal modalRef={modalNoteRef} title={`Notas de ${client?.tradename || client?.name || client?.contact_name}`} size="full-width" isStatic hideFooter>
      <div style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        <div className="text-center">
          <button className="btn btn-primary" type="button" onClick={() => $(modalAddNoteRef.current).modal('show')} >Agregar nota</button>
        </div>
        <hr className="my-2" />
        <div className="d-flex flex-wrap flex-row justify-content-center gap-2">
          {
            notes
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((note, i) => {
                const noteDate = moment(note.created_at)
                const now = moment()
                const diffHours = now.diff(noteDate, 'hours')
                const time = diffHours > 12 ? noteDate.format('lll') : noteDate.fromNow()

                return <div key={`note-${i}`} className="card text-white bg-purple mb-0" style={{ width: "100%", maxWidth: '300px', height: 'max-content' }}>
                  <div className="card-body p-2">
                    <div className="d-flex align-items-center border-bottom border-white pb-1 mb-1">
                      <div className="avatar-sm me-2 mb-1">
                        <img src={`/api/profile/thumbnail/${note.user.relative_id}?v=${new Date(note.user.updated_at).getTime()}`} className="img-fluid rounded-circle" alt="user" />
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="text-white m-0">{note.user.name} {note.user.lastname}</h5>
                        <p className="text-white-50 m-0 font-13 text-truncate">{time}</p>
                      </div>
                      {
                        can(page, 'root', 'all', 'editnotes', 'deletenotes') && <DropdownEnd>
                          {can(page, 'root', 'all', 'editnotes') && <DropdownItem onClick={() => onEditNote(note)}>Editar</DropdownItem>}
                          {can(page, 'root', 'all', 'deletenotes') && <DropdownItem onClick={() => onDeleteNote(note.id)}>Eliminar</DropdownItem>}
                        </DropdownEnd>
                      }
                    </div>
                    <blockquote className="card-bodyquote mb-0">
                      {note.name && <b>{note.name}</b>}
                      <p className="mb-1">{note.description}</p>
                    </blockquote>
                  </div>
                </div>
              })
          }
        </div>
      </div>
    </Modal>
    <Modal modalRef={modalAddNoteRef} title={isEditing ? "Editar nota" : "Agregar nota"} size="sm" onSubmit={onNoteSubmit}>
      <div id="note-crud-container">
        <input ref={idRef} type="hidden" />
        <SelectAPIFormGroup eRef={typeRef} label='Tipo de nota' col='col-12' dropdownParent='#note-crud-container' searchAPI='/api/types/paginate' searchBy='name' filter={['table_id', '=', 'c81ad4fb-a895-4f4c-b4b3-5989a7a66a85']} required />
        <InputFormGroup eRef={nameRef} label="Titulo de la nota" />
        <TextareaFormGroup eRef={descriptionRef} label="Descripcion de la nota" required />
      </div>
    </Modal>
  </>)
}

export default ClientNotesModal;