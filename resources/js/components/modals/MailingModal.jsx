import React, { useRef, useState } from "react";
import QuillFormGroup from "../form/QuillFormGroup";
import TextareaFormGroup from "../form/TextareaFormGroup";
import Modal from "../Modal";
import GmailRest from "../../actions/GmailRest";
import { Notify } from "sode-extend-react";
import SelectFormGroup from "../form/SelectFormGroup";
import UsersRest from "../../actions/UsersRest";
import Tippy from "@tippyjs/react";
import Global from "../../Utils/Global";
import LaravelSession from "../../Utils/LaravelSession";

const gmailRest = new GmailRest();
const usersRest = new UsersRest();

const MailingModal = ({ data, session, setSession, inReplyTo, modalRef, onSend = () => { }, defaultMessages, signs = [] }) => {
  const ccRef = useRef();
  const bccRef = useRef();
  const subjectRef = useRef();
  const bodyRef = useRef();
  const fileRef = useRef();
  const signsModalRef = useRef()

  const [sending, setSending] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [defaultSign, setDefaultSign] = useState(LaravelSession.service_user.mailing_sign)

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    // Crear un FormData para enviar la información al backend
    const formData = new FormData();
    formData.append("to", data?.id);
    formData.append("subject", subjectRef.current.value);
    formData.append("body", bodyRef.current.value);
    if (inReplyTo) {
      formData.append("inReplyTo", inReplyTo.id);
    }

    // Agregar los destinatarios CC y BCC si están visibles y tienen valores
    const ccEmails = showCC ? $(ccRef.current).val() || [] : [];
    const bccEmails = showBCC ? $(bccRef.current).val() || [] : [];
    if (ccEmails.length > 0) ccEmails.forEach(cc => formData.append("cc[]", cc));
    if (bccEmails.length > 0) bccEmails.forEach(bcc => formData.append("bcc[]", bcc));

    // Agregar los archivos adjuntos si se han seleccionado
    if (fileRef.current.files.length > 0) {
      Array.from(fileRef.current.files).forEach((file) => {
        formData.append("attachments[]", file);
      });
    }

    // Enviar la solicitud al backend
    const result = await gmailRest.send(formData);
    setSending(false);

    if (!result) return;

    Notify.add({
      icon: "/assets/img/logo-login.svg",
      title: "Correcto",
      body: "El correo ha sido enviado correctamente",
    });

    // Limpiar los campos
    cleanForm();
    $(modalRef.current).modal("hide");
    onSend(result);
  };

  const cleanForm = () => {
    subjectRef.current.value = "";
    bodyRef.current.value = "";
    bodyRef.editor.root.innerHTML = "";
    $(ccRef.current).val(null).trigger("change");
    $(bccRef.current).val(null).trigger("change");
    fileRef.current.value = null;
    setShowCC(false);
    setShowBCC(false);
  };

  const onSignChange = async (e) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    const formData = new FormData()
    formData.append('sign', file)
    formData.append('business_id', LaravelSession.business_uuid)

    e.target.value = null

    const result = await usersRest.addSign(formData);
    if (!result) return
    setSession(old => ({
      ...old, service_user: {
        ...old.service_user,
        mailing_sign: result
      }
    }))
  }

  const onDeleteSign = async () => {
    const result = await usersRest.deleteSign()
    if (!result) return
    setSession(old => ({
      ...old, service_user: {
        ...old.service_user,
        mailing_sign: null
      }
    }))
  }

  const onDefaultSignChanged = async (e) => {
    const signId = e.target.value
    const result = await usersRest.setDefaultSign({
      type: 'whatsapp',
      sign: signId
    })
    if (!result) return
    setDefaultSign(signId)
  }

  return (
    <>
      <Modal modalRef={modalRef} size="lg" zIndex={1065} onSubmit={onSubmit} hideHeader hideFooter>
        <div id="mailing-modal">
          <button type="button" className="btn-close float-end" data-bs-dismiss="modal" aria-label="Close"></button>
          <h4 className="header-title mb-0">Mensaje nuevo</h4>
          <hr className="my-2" />
          {inReplyTo && (
            <div className="mb-2">
              <i className="fas fa-reply me-1"></i> {inReplyTo?.sender}
            </div>
          )}
          <div className="mb-2">
            <b>Para:</b> {data?.contact_name}
            <small className="text-muted d-block">&lt;{data?.contact_email}&gt;</small>
          </div>

          {/* Checkboxes para CC y BCC */}
          <div className="mb-2 d-flex align-items-center">
            <div className="form-check me-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="showCC"
                checked={showCC}
                onChange={() => setShowCC(!showCC)}
              />
              <label className="form-check-label" htmlFor="showCC">CC</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="showBCC"
                checked={showBCC}
                onChange={() => setShowBCC(!showBCC)}
              />
              <label className="form-check-label" htmlFor="showBCC">BCC</label>
            </div>
          </div>

          {/* Campos condicionales para CC y BCC */}
          {showCC && (
            <SelectFormGroup eRef={ccRef} label="CC" tags dropdownParent="#mailing-modal" multiple />
          )}
          {showBCC && (
            <SelectFormGroup eRef={bccRef} label="BCC" tags dropdownParent="#mailing-modal" multiple />
          )}

          <TextareaFormGroup eRef={subjectRef} label="Asunto" rows={1} required />
          <QuillFormGroup eRef={bodyRef} label="Mensaje" required />
          <div className="mb-2 text-center">
            <input type="file" id="sign-file" onChange={onSignChange} accept="image/*" hidden />
            {
              session.service_user.mailing_sign
                ? <div className="position-relative mx-auto" style={{ width: 'max-content' }}>
                  <Tippy content='Cambiar firma'>
                    {/* <label htmlFor="sign-file" style={{ cursor: 'pointer' }}>
                    <img className="border" src={`//${Global.APP_DOMAIN}/repository/signs/${session.service_user.mailing_sign}`} alt="" style={{
                      aspectRatio: 520 / 210,
                      height: '100%',
                      maxHeight: '100px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }} />
                  </label> */}
                    <div onClick={() => $(signsModalRef.current).modal('show')} style={{ cursor: 'pointer' }}>
                      <img className="border" src={`//${Global.APP_DOMAIN}/repository/signs/${session.service_user.mailing_sign}`} alt="" style={{
                        aspectRatio: 520 / 210,
                        height: '100%',
                        maxHeight: '100px',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }} />
                    </div>
                  </Tippy>
                  <Tippy content="Quitar firma">
                    <button className="position-absolute btn btn-xs r-1 btn-soft-danger" type="button" style={{
                      top: '4px',
                      right: '4px'
                    }} onClick={onDeleteSign}>
                      <i className="fa fa-times"></i>
                    </button>
                  </Tippy>
                </div>
                // : <label htmlFor="sign-file" className="mx-auto btn btn-sm btn-white">
                //   <i className="fas fa-signature me-1"></i>
                //   Adjuntar firma
                // </label>
                : <a href={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/signs`} className="mx-auto btn btn-sm btn-white">
                  <i className="fas fa-signature me-1"></i>
                  Adjuntar firma
                </a>
            }
          </div>
          <input ref={fileRef} type="file" className="form-control" multiple />
          <hr className="my-2" />
          <div className="d-flex justify-content-between">
            <button className="btn btn-sm btn-primary" type="submit" disabled={sending}>
              Enviar
              {sending ? <i className="fa fa-spin fa-spinner ms-1"></i> : <i className="fas fa-location-arrow ms-1"></i>}
            </button>
            <button className="btn btn-sm btn-danger" type="button" onClick={cleanForm}>
              <i className="mdi mdi-delete"></i>
            </button>
          </div>
        </div>
      </Modal>
      <Modal modalRef={signsModalRef} title="Tus firmas" zIndex={1070} hideFooter>
        <b className="d-block">¿Desea seleccionar una de sus firmas disponibles como predeterminado?</b>
        <div className="row mt-2">
          {signs.map((sign, index) => (
            <div className="col-md-6">
              <Tippy content='Marcar como predeterminado'>
                <label htmlFor={`sign-${sign.id}`} key={index} className="card border" style={{ cursor: 'pointer' }}>
                  <div className="card-header d-flex gap-1 align-items-center py-1 px-2">
                    <input
                      type="radio"
                      name="sign"
                      className="form-check-input my-0"
                      id={`sign-${sign.id}`}
                      checked={sign.id == defaultSign}
                      onChange={onDefaultSignChanged}
                      value={sign.id}
                    />
                    <b className="d-block my-0 w-100 text-truncate">{sign.name || 'Sin nombre'}</b>
                  </div>
                  <div className="card-body p-0">
                    <img
                      src={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/repository/signs/${sign.sign}`}
                      alt={sign.name}
                      className="img-fluid w-100"
                      style={{
                        objectFit: 'cover',
                        aspectRatio: 5 / 2
                      }}
                    />
                  </div>
                </label>
              </Tippy>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default MailingModal;