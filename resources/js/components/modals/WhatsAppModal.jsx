import Tippy from "@tippyjs/react";
import { useEffect, useRef, useState } from "react";
import { Fetch, Notify } from "sode-extend-react";
import Swal from "sweetalert2";
import '../../../css/qr-code.css';
import WhatsAppStatuses from "../../Reutilizables/WhatsApp/WhatsAppStatuses";
import WhatsAppRest from "../../actions/WhatsAppRest";
import Global from "../../Utils/Global";

const whatsAppRest = new WhatsAppRest()
let eventSource = {}

const WhatsAppModal = ({ prefixes, status: whatsAppStatus, setStatus: setWhatsAppStatus, WA_URL, APP_URL, session, setWAPhone }) => {
  const modalRef = useRef()
  const qrRef = useRef()
  const phoneRef = useRef()

  const { color, icon, text } = WhatsAppStatuses[whatsAppStatus]
  const [percent, setPercent] = useState(0)
  const [sessionInfo, setSessionInfo] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState('51')

  const businessSession = session.business_uuid

  const verifyStatus = async () => {
    const { status, data } = await whatsAppRest.verify()
    if (status == 200) {
      setWhatsAppStatus('ready')
      setSessionInfo(data)
      setWAPhone(data?.me?.user || null)
    } else if (status == 404) {
      setWhatsAppStatus('close')
    } else {
      setWhatsAppStatus(null)
    }
  }

  const handleShow = () => {
    setIsModalOpen(true);
  };

  const handleHide = () => {
    eventSource?.close?.()
    setIsModalOpen(false);
    if (whatsAppStatus == 'ready') return
    setWhatsAppStatus(null)
  };

  useEffect(() => {
    const modalElement = document.getElementById('whatsapp-modal');

    modalElement.addEventListener('show.bs.modal', handleShow);
    modalElement.addEventListener('hide.bs.modal', handleHide);

    return () => {
      modalElement.removeEventListener('show.bs.modal', handleShow);
      modalElement.removeEventListener('hide.bs.modal', handleHide);
    };
  }, [whatsAppStatus]);

  useEffect(() => {
    if (whatsAppStatus == 'verifying') {
      const searchParams = new URLSearchParams({
        session: businessSession,
        // redirect_to: `${APP_URL}/free/leads`
      })

      eventSource = new EventSource(`/api/whatsapp/verify?${searchParams}`)
      eventSource.onmessage = ({ data }) => {
        if (data == 'ping') return console.log('Realtime active')
        const { status, qr, percent, info } = JSON.parse(data)
        switch (status) {
          case 'ping':
            console.log('Evento del servidor')
            break;
          case 'qr':
            setWhatsAppStatus('qr')
            $(qrRef.current).empty()
            new QRCode(qrRef.current, {
              text: qr,
              width: 200,
              height: 200,
              colorDark: '#343a40'
            });
            break;
          case 'loading_screen':
            setWhatsAppStatus('loading_screen')
            setPercent(percent)
            break
          case 'authenticated':
            setWhatsAppStatus('authenticated')
            break
          case 'ready':
            setWhatsAppStatus('ready')
            setSessionInfo(info)
            setWAPhone(info?.me?.user || null)
            eventSource.close()
            break
          case 'close':
            setWhatsAppStatus('close')
            eventSource.close()
            setTimeout(() => {
              setWhatsAppStatus('verifying')
            }, 5000)
            break
          default:
            eventSource.close()
            break;
        }
      }
      eventSource.onerror = event => {
        console.log('Realtime closed: Perdida de conexion (Timeout)')
        setWhatsAppStatus('close')
        eventSource.close()
        setTimeout(() => {
          setWhatsAppStatus('verifying')
        }, 5000)
      }
    } else if (whatsAppStatus == null && !isModalOpen) {
      console.log('Realtime closed: Modal cerrado')
      verifyStatus()
    }
  }, [whatsAppStatus, isModalOpen])

  const onCloseClicked = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se cerrará la sesión actual`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    await Fetch(`/api/whatsapp`, {
      method: 'DELETE'
    })
    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Operación correcta',
      body: `Se cerró la sesión de ${sessionInfo?.pushname || 'WhatsApp'}`
    })
    setSessionInfo({})
    setWAPhone(null)
    setWhatsAppStatus(null)
  }

  const onPingClicked = async () => {
    try {
      const { status, result } = await Fetch(`/api/whatsapp/send`, {
        method: 'POST',
        body: JSON.stringify({
          phone: `${phonePrefix}${phoneRef.current.value}`,
          message: '¡Hola! 👋\nEste es un mensaje de prueba para confirmar que el servicio de WhatsApp está funcionando correctamente.\n> Mensaje automático de verificación',
        })
      })

      if (!status) throw new Error(result?.message || 'No se pudo enviar el ping');

      setPhonePrefix('51')
      phoneRef.current.value = ''

      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Operacion correcta',
        body: `Se envio el ping a ${phoneRef.current.value}`
      })
    } catch (error) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
    }
  }

  return (<div ref={modalRef} id="whatsapp-modal" className="modal fade" aria-hidden="true" data-bs-backdrop='static'>
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-body">
          <div className="text-center">
            <button type='button' className='btn-close position-absolute top-0 end-0 me-2 mt-2' data-bs-dismiss='modal' aria-label='Close'></button>
            <i className={`${icon} h1 text-${color} my-2 d-block`}></i>
            <h4 className="mt-2">{text} {whatsAppStatus == 'loading_screen' && percent && `[${percent}%]`}</h4>
            <div className="position-relative" hidden={whatsAppStatus !== 'qr'}>
              <img className="position-absolute" src={`//${Global.APP_DOMAIN}/assets/img/icon-border.svg`} alt='Atalaya' style={{
                width: '30px',
                aspectRatio: '30px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }} />
              <div ref={qrRef} id="qr-code" className={`mt-3 text-center ${whatsAppStatus == 'qr' ? 'd-block' : 'd-none'}`}>
              </div>
            </div>
            {
              whatsAppStatus == null &&
              <button className="btn btn-sm btn-dark waves-effect waves-light mt-2" type="button" onClick={() => setWhatsAppStatus('verifying')}>
                <i className="mdi mdi-qrcode-plus me-1"></i>
                Generar QR
              </button>
            }
            {
              whatsAppStatus == 'ready' && <div className="d-block py-2">
                <img className="d-block mb-2 avatar-md rounded-circle mx-auto"
                  src={sessionInfo?.profile || `//${Global.APP_DOMAIN}/api/profile/thumbnail/undefined`}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `//${Global.APP_DOMAIN}/api/profile/thumbnail/undefined`;
                  }}
                  alt={sessionInfo?.pushname} />
                <b>{sessionInfo?.pushname}</b>
                <br />
                <span className="text-muted">{sessionInfo?.me?.user}@{sessionInfo?.me?.server}</span>
                <div className="row mt-2">
                  <div className="col-4 text-center">
                    <i className="mdi mdi-account-multiple h4 my-0 d-block"></i>
                    <small className="text-muted">Contacts</small>
                    <div>{sessionInfo?.count?.contacts || 0}</div>
                  </div>
                  <div className="col-4 text-center">
                    <i className="mdi mdi-chat-processing h4 my-0 d-block"></i>
                    <small className="text-muted">Chats</small>
                    <div>{sessionInfo?.count?.chats || 0}</div>
                  </div>
                  <div className="col-4 text-center">
                    <i className="mdi mdi-message-text h4 my-0 d-block"></i>
                    <small className="text-muted">Messages</small>
                    <div>{sessionInfo?.count?.messages || 0}</div>
                  </div>
                </div>
                <div className="mt-2 text-start">
                  <label htmlFor="ping-phone-number" className="form-label mb-1">Envía un ping a:</label>
                  <div className="input-group">
                    <div className="dropdown">
                      <button className="btn btn-white btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ minWidth: '10px' }}>
                        <span className="d-flex align-items-center">
                          {/* <span className="font-emoji">{prefixes.find(p => p.realCode == phonePrefix)?.flag}</span> */}
                          {prefixes.find(p => p.realCode == phonePrefix)?.beautyCode}
                        </span>
                      </button>
                      <div className="dropdown-menu" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {prefixes.map((prefix, index) => (
                          <button key={index} className="dropdown-item" onClick={() => setPhonePrefix(prefix.realCode)}>
                            <div>
                              <span className="font-emoji">{prefix.flag}</span> {prefix.beautyCode}
                              <small className="d-block text-muted">{prefix.country}</small>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <input ref={phoneRef} id="ping-phone-number" type="text" className="form-control form-control-sm" placeholder="000000000" />
                    <Tippy content="Enviar mensaje ping">
                      <button className="btn btn-sm input-group-text btn-dark waves-effect waves-light" type="button" onClick={onPingClicked}>
                        <i className="mdi mdi-arrow-top-right"></i>
                      </button>
                    </Tippy>
                  </div>
                </div>
              </div>
            }
            {whatsAppStatus == 'ready' && <button type="button" className="btn btn-danger my-2" onClick={onCloseClicked}>Cerrar sesión</button>}
          </div>
        </div>
      </div>
    </div>
  </div>)
}

export default WhatsAppModal;