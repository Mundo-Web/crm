import React from "react"
import Dropdown from "../../components/dropdown/DropDown"
import DropdownItem from "../../components/dropdown/DropdownItem"
import ProjectsRest from "../../actions/ProjectsRest"
import Swal from "sweetalert2"

const ProjectStatusDropdown = ({ statuses, finishedProjectStatus, data, onChange }) => {
  const onProjectStatusClicked = async (project, status) => {
    if (status === finishedProjectStatus) {
      const { isConfirmed } = await Swal.fire({
        title: "¿Estás seguro de marcar este proyecto como terminado?",
        text: "Este proyecto podras verlo en a ventana de proyectos a partir de ahora",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar"
      })
      if (!isConfirmed) return
    }
    const result = await ProjectsRest.projectStatus(project, status)
    if (!result) return
    onChange()
  }

  return <>
    <Dropdown className='btn btn-xs btn-light rounded-pill' title={data.status.name} tippy='Actualizar estado' icon={{ icon: 'fa fa-circle', color: data.status.color }}>
      {statuses.map(({ id, name, color }) => {
        return <DropdownItem key={id} onClick={() => onProjectStatusClicked(data.id, id)}>
          <i className='fa fa-circle' style={{ color }}></i> {name}
        </DropdownItem>
      })}
    </Dropdown>
  </>
}

export default ProjectStatusDropdown