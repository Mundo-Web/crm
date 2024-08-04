import React from "react"
import Dropdown from "../../components/dropdown/DropDown"
import DropdownItem from "../../components/dropdown/DropdownItem"
import ProjectsRest from "../../actions/ProjectsRest"

const ProjectStatusDropdown = ({ statuses, data, onChange }) => {
  const onProjectStatusClicked = async (project, status) => {
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