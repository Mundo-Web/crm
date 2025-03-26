import { createInertiaApp } from '@inertiajs/react'
import { Cookies, FetchParams } from 'sode-extend-react'
import Global from './Global';
import LaravelSession from './LaravelSession';

const CreateReactScript = (render) => {

  createInertiaApp({
    resolve: name => `/${name}.jsx`,
    setup: ({ el, props }) => {
      const properties = props.initialPage.props

      const global = { ...properties?.global }
      for (const name in global) {
        Global.set(name, global[name])
      }

      const session = { ...properties?.session }
      for (const key in session) {
        LaravelSession.set(`${key}`, session[key])
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
      // el.removeAttribute('data-page')
    },
  });
}

// INICIO: Pintando datos en consola y evitando futuros logs
console.log(
  "%c¡Detente!",
  "font-size: 24px; color: red; font-weight: bold;"
);
console.log(
  "%cEsta es una característica avanzada para desarrolladores. Usar esta consola puede dar acceso a información privada o a tu cuenta. No copies ni pegues ningún código aquí si no sabes exactamente lo que hace.",
  "font-size: 16px; color: grey;"
);
// console.log = console.warn = console.error = console.info = function () { };
// FIN

export default CreateReactScript