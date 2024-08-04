import { Fetch, Notify } from "sode-extend-react"

class UsersByProjectsRest {
  static getUser = async (relative_id) => {
    const { result } = await Fetch(`/api/users-by-projects/${relative_id}`)
    return result?.data ?? null
  }

  static byProject = async (project) => {
    const { result } = await Fetch(`/api/users-by-projects/project/${project}`)
    return result?.data ?? []
  }

  static massiveByProject = async (data) => {
    try {
      const { status, result } = await Fetch('/api/users-by-projects/project', {
        method: 'PATCH',
        body: JSON.stringify(data)
      })

      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default UsersByProjectsRest