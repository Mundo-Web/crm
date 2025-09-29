import { Fetch, Notify } from 'sode-extend-react';
import BasicRest from '../BasicRest';

class UsersByServicesByBusinessesRest extends BasicRest {
  path = 'atalaya/users-by-services-by-business'

  authorize = async (request) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/authorize`, {
        method: 'POST',
        body: JSON.stringify(request)
      })
      if (!status) throw new Error(result?.message || 'Ocurrio un error al abrir el servicio')
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Correcto',
        body: result.message,
        type: 'success'
      })
      return true
    } catch (error) {
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }
}

export default UsersByServicesByBusinessesRest