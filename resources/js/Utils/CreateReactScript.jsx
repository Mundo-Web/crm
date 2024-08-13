import { createInertiaApp } from '@inertiajs/react'
import { Cookies, FetchParams } from 'sode-extend-react'
import Global from './Global';

const CreateReactScript = (render) => {

  createInertiaApp({
    resolve: name => `/${name}.jsx`,
    setup: ({ el, props }) => {
      const properties = props.initialPage.props
      if (properties?.global) {
        for (const name in properties.global) {
          Global.set(name, properties.global[name])
        }
      }
      const can = (page, ...keys) => {
        if (properties?.session?.is_owner) return true
        keys = keys.map(x => `${page}.${x}`)
        if (properties?.session?.service_user?.permissions?.find(x => keys.includes(x.name))) return true
        const roles = properties?.session?.service_user?.roles ?? []
        for (const rol of roles) {
          if (rol?.permissions?.find(x => keys.includes(x.name))) return true
        }
        return false
      }
      FetchParams.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
      }
      render(el, { ...properties, can })
    },
  });
}

export default CreateReactScript