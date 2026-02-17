import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react'
import { Clipboard } from 'sode-extend-react'
import Swal from 'sweetalert2'
import Global from './Utils/Global.js'

const PixelIntegration = ({ apikey, breadkowns }) => {

  const scriptRef = useRef()

  useEffect(() => {

  }, [null])

  const onCopyClicked = () => {
    Clipboard.copy(pixelScript, () => {
      Swal.fire({
        title: 'Correcto!',
        text: 'Se ha copiado el script en el portapapeles',
        timer: 2000
      })
    }, (e) => {
      Swal.fire({
        title: 'Ooops!',
        text: error,
        timer: 2000
      })
    })
  }

  const pixelScript = `<!-- Atalaya Tracking Pixel -->
<script>
  (function(){const e=new URLSearchParams(window.location.search),t=e.get("utm_source")||"",o=e=>{const t="; "+document.cookie,o=t.split("; "+e+"=");return 2===o.length?o.pop().split(";").shift():null},n=o("X-Breakdown-ID"),r=new URLSearchParams;t&&r.append("utm_source",t),n&&r.append("x-breakdown-id",n);const c=r.toString(),s=\`https://crm.atalaya.pe/free/pixel/${apikey}\${c?"?"+c:""}\`,a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=s;const i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(a,i)})();
</script>`
  return (<>
    <div className="row">
      <div className="col-lg-4 col-md-6 col-sm-12">
        <div className="card">
          <div className="card-header">
            <h4 className="header-title mb-0">Instala tu Pixel de Atalaya</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              Copia y pega el siguiente script en el <code>&lt;head&gt;</code> de tu sitio web para comenzar a trackear visitas automáticamente.
            </p>

            <div className="mb-3">
              <h5>Script de Seguimiento:</h5>
              <pre ref={scriptRef} className="mb-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}><code>{pixelScript}</code></pre>
              <div className='d-flex justify-content-end'>
                <Tippy content="Copiar Script">
                  <button className="btn btn-sm btn-dark waves-effect waves-light" type="button" onClick={onCopyClicked}>
                    <i className='fa fa-clipboard me-2'></i>Copiar Script
                  </button>
                </Tippy>
              </div>
              <p className='sub-header mt-2'><b>Nota</b>: El script es compatible con cualquier sitio web. No modifiques nada dentro del script.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-8 col-md-6 col-sm-12">
        <div className="card">
          <div className="card-header">
            <h4 className="header-title mb-0">Datos que Captura el Pixel</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              Una vez instalado, el pixel recopilará automáticamente la siguiente información de cada visita:
            </p>

            <div className="mb-3">
              <h5>Parámetros Recolectados:</h5>
              <ul className="list-unstyled">
                <li><i className="fa fa-check-circle text-success me-2"></i><b>IP del visitante</b></li>
                <li><i className="fa fa-check-circle text-success me-2"></i><b>Navegador y versión</b></li>
                <li><i className="fa fa-check-circle text-success me-2"></i><b>Sistema operativo</b></li>
                <li><i className="fa fa-check-circle text-success me-2"></i><b>Dispositivo (móvil o escritorio)</b></li>
                <li><i className="fa fa-check-circle text-success me-2"></i><b>UTM Source (Facebook, Instagram)</b></li>
                <li><i className="fa fa-check-circle text-success me-2"></i><b>Fecha y hora de la visita</b></li>
              </ul>
            </div>

            <div className="mb-3">
              <h5>Ejemplo de URL con UTM:</h5>
              <pre><code>{`https://tusitio.com/?utm_source=fb`}</code></pre>
            </div>

            <div className="mb-3">
              <h5>Conteo de visitas:</h5>
              <p className='my-0'>{breadkowns} {breadkowns == 1 ? 'visita': 'visitas'}</p>
            </div>

            {/* <div className="mb-3">
              <h5>Datos estadísticos:</h5>

              <div className="d-flex flex-column gap-4">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                  <span className="text-muted small">Visitantes únicos</span>
                  <span className="fw-bold">1,234</span>
                </div>

                <div className="border-bottom pb-3">
                  <div className="text-muted small mb-2">Navegadores</div>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Chrome</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-primary" style={{ width: '65%' }} />
                      </div>
                      <span className="small fw-bold">65%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Safari</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-success" style={{ width: '20%' }} />
                      </div>
                      <span className="small fw-bold">20%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Firefox</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-warning" style={{ width: '10%' }} />
                      </div>
                      <span className="small fw-bold">10%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Otros</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-secondary" style={{ width: '5%' }} />
                      </div>
                      <span className="small fw-bold">5%</span>
                    </div>
                  </div>
                </div>

                <div className="border-bottom pb-3">
                  <div className="text-muted small mb-2">Sistemas operativos</div>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Windows</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar" style={{ width: '45%', backgroundColor: '#0d6efd' }} />
                      </div>
                      <span className="small fw-bold">45%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>macOS</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar" style={{ width: '25%', backgroundColor: '#6c757d' }} />
                      </div>
                      <span className="small fw-bold">25%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Android</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar" style={{ width: '20%', backgroundColor: '#198754' }} />
                      </div>
                      <span className="small fw-bold">20%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>iOS</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar" style={{ width: '10%', backgroundColor: '#fd7e14' }} />
                      </div>
                      <span className="small fw-bold">10%</span>
                    </div>
                  </div>
                </div>

                <div className="border-bottom pb-3">
                  <div className="text-muted small mb-2">Dispositivos</div>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Móvil</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar" style={{ width: '60%', backgroundColor: '#6f42c1' }} />
                      </div>
                      <span className="small fw-bold">60%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Escritorio</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-secondary" style={{ width: '40%' }} />
                      </div>
                      <span className="small fw-bold">40%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-muted small mb-2">Tráfico por UTM</div>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Facebook</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-primary" style={{ width: '35%' }} />
                      </div>
                      <span className="small fw-bold">35%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Instagram</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-danger" style={{ width: '25%' }} />
                      </div>
                      <span className="small fw-bold">25%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Google</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-info" style={{ width: '30%' }} />
                      </div>
                      <span className="small fw-bold">30%</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small" style={{ width: 60 }}>Directo</span>
                      <div className="progress flex-fill" style={{ height: 4 }}>
                        <div className="progress-bar bg-dark" style={{ width: '10%' }} />
                      </div>
                      <span className="small fw-bold">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Pixel de Seguimiento'>
      <PixelIntegration {...properties} />
    </Adminto>
  );
})