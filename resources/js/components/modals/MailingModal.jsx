import React, { useRef, useState } from "react"
import InputFormGroup from "../form/InputFormGroup"
import QuillFormGroup from "../form/QuillFormGroup"
import TextareaFormGroup from "../form/TextareaFormGroup"
import Modal from "../Modal"
import GmailRest from "../../actions/GmailRest"
import { Notify } from "sode-extend-react"

const gmailRest = new GmailRest()

const MailingModal = ({ data, modalRef, onSend = () => { } }) => {

  const toRef = useRef()
  const subjectRef = useRef()
  const bodyRef = useRef()

  const [sending, setSending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    const result = await gmailRest.send({
      to: data?.id,
      subject: subjectRef.current.value,
      body: bodyRef.current.value
    })
    setSending(false)
    if (!result) return

    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Correcto',
      body: 'El correo ha sido enviado correctamente',
    })

    subjectRef.current.value = ''
    bodyRef.current.value = ''
    bodyRef.editor.root.innerHTML = ''
    $(modalRef.current).modal('hide')
    onSend(result)
  }

  return <Modal modalRef={modalRef} position='right' zIndex={1060} onSubmit={onSubmit} hideHeader hideFooter>
    <h4 className='header-title mb-0'>
      Redactar correo
      <small className='text-muted d-block'>{data?.contact_name}</small>
    </h4>
    <hr className='my-2' style={{ width: '360px' }} />
    <InputFormGroup eRef={toRef} label='Para' value={data?.contact_email} disabled />
    <TextareaFormGroup eRef={subjectRef} label='Asunto' rows={1} required />
    <QuillFormGroup eRef={bodyRef} label='Mensaje' required />
    <hr className='my-2' style={{ width: '360px' }} />
    <button className='btn btn-sm btn-primary' type='submit' disabled={sending}>
      Enviar
      {
        sending
          ? <i className='fa fa-spin fa-spinner ms-1'></i>
          : <i className='fas fa-location-arrow ms-1'></i>
      }
    </button>
  </Modal>
}

export default MailingModal