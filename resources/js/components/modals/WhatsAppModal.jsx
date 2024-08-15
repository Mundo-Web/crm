import React, { useEffect, useRef, useState } from "react";
import WhatsAppStatuses from "../../Reutilizables/WhatsApp/WhatsAppStatuses";
import '../../../css/qr-code.css'
import Swal from "sweetalert2";
import Tippy from "@tippyjs/react";
import { Notify } from "sode-extend-react";

const WhatsAppModal = ({ status: whatsappStatus, setStatus, WA_URL, APP_URL, session }) => {
  const qrRef = useRef()
  const phoneRef = useRef()

  const { color, icon, text } = WhatsAppStatuses[whatsappStatus]
  const [percent, setPercent] = useState(0)
  const [sessionInfo, setSessionInfo] = useState({})

  const businessSession = `atalaya-${session.business_uuid}`

  useEffect(() => {
    if (whatsappStatus == 'verifying') {
      const searchParams = new URLSearchParams({
        session: businessSession,
        redirect_to: `${APP_URL}/free/leads`
      })

      let eventSource = new EventSource(`${WA_URL}/api/session/verify?${searchParams}`)
      eventSource.onmessage = ({ data }) => {
        if (data == 'ping') return console.log('Realtime active')
        const { status, qr, percent, info } = JSON.parse(data)
        switch (status) {
          case 'qr':
            setStatus('qr')
            $(qrRef.current).empty()
            new QRCode(qrRef.current, {
              text: qr,
              width: 200,
              height: 200,
              colorDark: '#343a40'
            });
            break;
          case 'loading_screen':
            setStatus('loading_screen')
            setPercent(percent)
            break
          case 'authenticated':
            setStatus('authenticated')
            break
          case 'ready':
            setStatus('ready')
            setSessionInfo(info)
            eventSource.close()
            break
          case 'close':
            setStatus('close')
            eventSource.close()
            setTimeout(() => {
              setStatus('verifying')
            }, 5000)
            break
          default:
            eventSource.close()
            break;
        }
      }
      eventSource.onerror = event => {
        console.log('Realtime closed')
        setStatus('close')
        eventSource.close()
        setTimeout(() => {
          setStatus('verifying')
        }, 5000)
      }
    }
  }, [whatsappStatus])

  const onCloseClicked = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro?",
      text: `Se cerrara la sesion actual`,
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
      title: 'Operacion correcta',
      body: `Se cerro la sesion de ${sessionInfo?.pushname || 'WhatsApp'}`
    })
    setSessionInfo({})
    setStatus('verifying')
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

  return (<div id="whatsapp-modal" className="modal fade" aria-hidden="true" data-bs-backdrop='static' >
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-body">
          <div className="text-center">
            <button type='button' className='btn-close position-absolute top-0 end-0 me-2 mt-2' data-bs-dismiss='modal' aria-label='Close'></button>
            <i className={`${icon} h1 text-${color} my-2 d-block`}></i>
            <h4 className="mt-2">{text} {whatsappStatus == 'loading_screen' && `[${percent}%]`}</h4>
            <div ref={qrRef} id="qr-code" className={`mt-3 text-center ${whatsappStatus == 'qr' ? 'd-block' : 'd-none'}`}>
            </div>
            {
              whatsappStatus == 'ready' && <div className="d-block py-2">
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
            {whatsappStatus == 'ready' && <button type="button" className="btn btn-danger my-2" onClick={onCloseClicked}>Cerrar sesion</button>}
          </div>
        </div>
      </div>
    </div>
  </div>)
}

export default WhatsAppModal;