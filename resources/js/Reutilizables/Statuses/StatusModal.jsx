import React from "react"
import { useEffect, useRef, useState } from "react"
import InputFormGroup from "../../components/form/InputFormGroup"
import SelectAPIFormGroup from "../../components/form/SelectAPIFormGroup"
import TextareaFormGroup from "../../components/form/TextareaFormGroup"
import Modal from "../../components/Modal"
import SetSelectValue from "../../Utils/SetSelectValue"
import StatusesRest from "../../actions/StatusesRest"

const statusesRest = new StatusesRest()

const StatusModal = ({ dataLoaded, setDataLoaded, afterSave = () => { } }) => {
  const modalRef = useRef()
  const idRef = useRef()
  const nameRef = useRef()
  const tableRef = useRef()
  const colorRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false);

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    SetSelectValue(tableRef.current, data?.table?.id, data?.table?.name)
    if (data?.table?.id) {
      $(tableRef.current).parents('.form-group').hide();
    } else {
      $(tableRef.current).parents('.form-group').show();
    }
    nameRef.current.value = data?.name || null
    colorRef.current.value = data?.color || '#343a40'
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      table_id: tableRef.current.value,
      name: nameRef.current.value,
      color: colorRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await statusesRest.save(request)
    if (!result) return

    afterSave(result, structuredClone(dataLoaded))
    setDataLoaded(null)
    $(modalRef.current).modal('hide')
  }

  useEffect(() => {
    console.log(dataLoaded)
    if (dataLoaded) {
      $(modalRef.current).modal('show');
      onModalOpen(dataLoaded);
    }
  }, [dataLoaded])

  return <Modal modalRef={modalRef} title={isEditing ? 'Editar estado' : 'Agregar estado'} onSubmit={onModalSubmit} size='sm'>
    <div className='row' id='status-crud-container'>
      <input ref={idRef} type='hidden' />
      <InputFormGroup eRef={nameRef} label='Nombre de estado' col='col-12' required />
      <SelectAPIFormGroup eRef={tableRef} label='Tabla' col='col-12' dropdownParent='#status-crud-container' searchAPI='/api/tables/paginate' searchBy='name' required />
      <InputFormGroup eRef={colorRef} type='color' label='Color' col='col-12' required />
      <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' />
    </div>
  </Modal>
}

export default StatusModal