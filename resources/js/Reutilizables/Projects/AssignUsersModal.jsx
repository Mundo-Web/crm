import React, { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import 'tippy.js/dist/tippy.css';
import PaymentsRest from "../../actions/PaymentsRest";
import SelectAPIFormGroup from "../../components/form/SelectAPIFormGroup";
import SetSelectValue from "../../Utils/SetSelectValue";
import UsersByProjectsRest from "../../actions/UsersByProjectsRest";

const AssignUsersModal = ({ dataLoaded, setDataLoaded, grid2refresh }) => {

  const modalRef = useRef()

  const idRef = useRef()
  const usersRef = useRef()

  useEffect(() => {
    if (dataLoaded.id) {
      onModalOpen()
    }

    $(modalRef.current).on('hidden.bs.modal', () => {
      idRef.current.value = null
      SetSelectValue(usersRef.current, null, null)
      setDataLoaded({})
    })
  }, [dataLoaded])


  const onModalOpen = async () => {
    const usersByProjects = await UsersByProjectsRest.byProject(dataLoaded?.id)

    idRef.current.value = dataLoaded?.id || null
    SetSelectValue(usersRef.current, usersByProjects, 'id', 'fullname')

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()
    const request = {
      project_id: idRef.current.value,
      users: $(usersRef.current).val()
    }

    console.log(request)
    
    const result = await UsersByProjectsRest.massiveByProject(request)
    if (!result) return

    $(modalRef.current).modal('hide')
    grid2refresh.refresh()
  }

  return (
    <Modal modalRef={modalRef} title='Asignar usuarios al proyecto' onSubmit={onModalSubmit}>
      <div id='assign-users-container'>
        <p>
          Que usuarios deseas asignar al proyecto <b>{dataLoaded?.name}</b> de <b>{dataLoaded?.client?.name}</b>
        </p>
        <input ref={idRef} type='hidden' />
        <SelectAPIFormGroup eRef={usersRef} label='Usuarios a asignar' col='col-12' dropdownParent='#assign-users-container' searchAPI='/api/users/paginate' searchBy='fullname' multiple />
      </div>
    </Modal>
  )
}

export default AssignUsersModal;