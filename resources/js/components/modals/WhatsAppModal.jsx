import Tippy from "@tippyjs/react";
import React, { useEffect, useRef, useState } from "react";
import { Notify } from "sode-extend-react";
import Swal from "sweetalert2";
import '../../../css/qr-code.css';
import WhatsAppStatuses from "../../Reutilizables/WhatsApp/WhatsAppStatuses";
import WhatsAppRest from "../../actions/WhatsAppRest";
import Global from "../../Utils/Global";
import LaravelSession from "../../Utils/LaravelSession";

const whatsAppRest = new WhatsAppRest()
let eventSource = {}

const WhatsAppModal = ({ status: whatsAppStatus, setStatus: setWhatsAppStatus, WA_URL, APP_URL, session }) => {

  const modalRef = useRef()
  const qrRef = useRef()
  const phoneRef = useRef()

  const { color, icon, text } = WhatsAppStatuses[whatsAppStatus]
  const [percent, setPercent] = useState(0)
  const [sessionInfo, setSessionInfo] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false);

  const businessSession = `atalaya-${session.business_uuid}`

  const verifyStatus = async () => {
    const { status, data } = await whatsAppRest.verify()
    if (status == 200) {
      setWhatsAppStatus('ready')
      setSessionInfo(data)
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
        redirect_to: `${APP_URL}/free/leads`
      })

      eventSource = new EventSource(`${WA_URL}/api/session/verify?${searchParams}`)
      eventSource.onmessage = ({ data }) => {
        if (data == 'ping') return console.log('Realtime active')
        const { status, qr, percent, info } = JSON.parse(data)
        switch (status) {
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
    await fetch(`${WA_URL}/api/session/${businessSession}`, {
      method: 'DELETE'
    })
    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Operación correcta',
      body: `Se cerró la sesión de ${sessionInfo?.pushname || 'WhatsApp'}`
    })
    setSessionInfo({})
    setWhatsAppStatus(null)
  }

  const onPingClicked = async () => {
    try {
      const res = await fetch(`${WA_URL}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: businessSession,
          to: [phoneRef.current.value],
          content: 'Ping!\n> Mensaje automatico',
        })
      })

      if (!res.ok) throw new Error('No se pudo enviar el ping');

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
            <h4 className="mt-2">{text} {whatsAppStatus == 'loading_screen' && `[${percent}%]`}</h4>
            <div className="position-relative" hidden={whatsAppStatus !== 'qr'}>
              <img className="position-absolute" src={`//${Global.APP_DOMAIN}/assets/img/icon.svg`} alt='Atalaya' style={{
                width: '30px',
                aspectRatio: '30px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'grayscale(100%)',
                padding: '4px',
                borderRadius: '8px',
                backgroundColor: '#fff'
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
                  src={`${Global.WA_URL}/api/profile/${LaravelSession.business_uuid}/${sessionInfo?.me?.user}`}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `//${Global.APP_DOMAIN}/api/profile/thumbnail/undefined`;
                  }}
                  alt={sessionInfo?.pushname} />
                <b>{sessionInfo?.pushname}</b>
                <br />
                <span className="text-muted">{sessionInfo?.me?.user}@{sessionInfo?.me?.server}</span>
                <div className="input-group mt-2">
                  <input ref={phoneRef} type="text" className="form-control form-control-sm" placeholder="Numero receptor" />
                  <Tippy content="Enviar mensaje ping">
                    <button className="btn btn-sm input-group-text btn-dark waves-effect waves-light" type="button" onClick={onPingClicked}>Ping</button>
                  </Tippy>
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