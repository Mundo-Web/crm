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
import { renderToStaticMarkup, renderToString } from "react-dom/server";

const gmailRest = new GmailRest();
const usersRest = new UsersRest();

const MailingModal = ({ data, session, setSession, inReplyTo, modalRef, onSend = () => { }, defaultMessages, signs = [] }) => {
  const ccRef = useRef();
  const bccRef = useRef();
  const subjectRef = useRef();
  const bodyRef = useRef();
  const fileRef = useRef();

  const [sending, setSending] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
    fileRef.current.value = null; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
    setAttachments([]);
  };

  const onAddSignClicked = async (sign) => {
    const root = $(bodyRef.editor.root)
    if (!sign) {
      root.find('#mailing-sign').remove()
      return
    }
    const img = <img
      id="mailing-sign"
      src={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/repository/signs/${sign.sign}`}
      alt={sign.name}
      style={{ maxWidth: '480px' }} />
    if (root.find('[id="mailing-sign-container"]').length === 0) {
      const signContent = renderToString(<>
        <p></p>
        <p></p>
        <p></p>
        <p>--</p>
        <p id="mailing-sign-container">
          {img}
        </p>
      </>
      )
      root.append(signContent)
    } else {
      const container = root.find('[id="mailing-sign-container"]')
      container.html(renderToString(img))
    }
  }

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
    // if (fileRef.current.files.length > 0) {
    //   Array.from(fileRef.current.files).forEach((file) => {
    //     formData.append("attachments[]", file);
    //   });
    // }

    // Add attachments from state
    attachments.forEach(file => {
      formData.append("attachments[]", file);
    });

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

  const onUseTemplateClicked = (template) => {
    if (!template) {
      bodyRef.current.value = "";
      bodyRef.editor.root.innerHTML = "";
      return
    }
    bodyRef.current.value = template.description;
    bodyRef.editor.root.innerHTML = template.description;
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

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="border rounded p-2 mb-3">
              <div className="d-flex align-items-center mb-2">
                <i className="mdi mdi-paperclip me-1"></i>
                <small className="text-muted">Archivos adjuntos ({attachments.length})</small>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="border rounded p-1 d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                    <i className="mdi mdi-file"></i>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="btn btn-xs btn-soft-danger py-0 px-1"
                      onClick={() => removeAttachment(index)}
                    >
                      <i className="mdi mdi-close"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="my-2" />
          <div className="d-flex justify-content-between">
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-primary" type="submit" disabled={sending}>
                Enviar
                {sending ? <i className="fa fa-spin fa-spinner ms-1"></i> : <i className="fas fa-location-arrow ms-1"></i>}
              </button>
              <div className="d-flex gap-1">
                <input
                  ref={fileRef}
                  id="mailing-attachment-input"
                  type="file"
                  className="d-none"
                  multiple
                  onChange={onFileChange}
                />
                <Tippy content="Adjuntar archivos">
                  <label htmlFor="mailing-attachment-input" className="btn btn-sm btn-white mb-0" style={{ cursor: 'pointer' }}>
                    <i className="mdi mdi-paperclip"></i>
                  </label>
                </Tippy>
                <div class="dropdown">
                  <Tippy content='Usar plantilla'>
                    <button class="btn btn-sm  btn-white dropdown-toggle" type="button" id="dropdown-templates-button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <i class="mdi mdi-message-bulleted"></i>
                    </button>
                  </Tippy>
                  <div class="dropdown-menu" aria-labelledby="dropdown-templates-button">
                    <span class="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onUseTemplateClicked()}>
                      <i className="mdi mdi-broom me-1"></i>
                      Limpiar contenido
                      </span>
                    {
                      defaultMessages.filter(tmp => tmp.type == 'email').map((tmp, index) => {
                        return <span key={index} class="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onUseTemplateClicked(tmp)}>
                          {tmp.name}
                        </span>
                      })
                    }
                    <div className="dropdown-divider"></div>
                    <a class="dropdown-item" href={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/signs`} target="_blank">
                      Gestionar plantillas
                      <i className="mdi mdi-arrow-top-right ms-1"></i>
                    </a>
                  </div>
                </div>
                <div class="dropdown">
                  <Tippy content='Insertar firma'>
                    <button class="btn btn-sm  btn-white dropdown-toggle" type="button" id="dropdown-signs-button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <i class="mdi mdi-pen"></i>
                    </button>
                  </Tippy>
                  <div class="dropdown-menu" aria-labelledby="dropdown-signs-button">
                    <span class="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onAddSignClicked()}>Sin firma</span>
                    {
                      signs.map((sign, index) => {
                        return <span key={index} class="dropdown-item d-flex gap-1 align-items-center" style={{ cursor: 'pointer' }} onClick={() => onAddSignClicked(sign)}>
                          <img src={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/repository/signs/${sign.sign}`} alt={sign.name}
                            style={{ width: '20px', aspectRatio: 1, objectFit: 'cover', objectPosition: 'center' }} />
                          {sign.name || <i className="text-muted">Sin nombre</i>}
                        </span>
                      })
                    }
                    <div className="dropdown-divider"></div>
                    <a class="dropdown-item" href={`${Global.APP_PROTOCOL}://${Global.APP_DOMAIN}/signs`} target="_blank">
                      Gestionar firmas
                      <i className="mdi mdi-arrow-top-right ms-1"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn btn-sm btn-danger" type="button" onClick={cleanForm}>
              <i className="mdi mdi-delete"></i>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MailingModal;