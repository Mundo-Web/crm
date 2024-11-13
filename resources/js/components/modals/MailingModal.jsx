import React, { useRef, useState } from "react";
import QuillFormGroup from "../form/QuillFormGroup";
import TextareaFormGroup from "../form/TextareaFormGroup";
import Modal from "../Modal";
import GmailRest from "../../actions/GmailRest";
import { Notify } from "sode-extend-react";
import SelectFormGroup from "../form/SelectFormGroup";

const gmailRest = new GmailRest();

const MailingModal = ({ data, inReplyTo, modalRef, onSend = () => { } }) => {
  const ccRef = useRef();
  const bccRef = useRef();
  const subjectRef = useRef();
  const bodyRef = useRef();
  const fileRef = useRef();

  const [sending, setSending] = useState(false);

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

    // Agregar los destinatarios CC y BCC
    const ccEmails = $(ccRef.current).val() || [];
    const bccEmails = $(bccRef.current).val() || [];
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
    cleanForm()
    $(modalRef.current).modal("hide");
    onSend(result);
  };

  const cleanForm = () => {
    subjectRef.current.value = "";
    bodyRef.current.value = "";
    bodyRef.editor.root.innerHTML = "";
    $(ccRef.current).val(null).trigger('change')
    $(bccRef.current).val(null).trigger('change')
    fileRef.current.value = null
  }

  return (
    <Modal modalRef={modalRef} size="md" zIndex={1065} onSubmit={onSubmit} hideHeader hideFooter>
      <div id="mailing-modal">
        <h4 className="header-title mb-0">Mensaje nuevo</h4>
        <hr className="my-2" />
        {
          inReplyTo && <div className="mb-2">
            <i className='fas fa-reply me-1'></i> {inReplyTo?.sender}
          </div>
        }
        <div className="mb-2">
          <b>Para:</b> {data?.contact_name}
          <small className="text-muted d-block">&lt;{data?.contact_email}&gt;</small>
        </div>
        <SelectFormGroup eRef={ccRef} label="CC" tags dropdownParent="#mailing-modal" multiple />
        <SelectFormGroup eRef={bccRef} label="BCC" tags dropdownParent="#mailing-modal" multiple />
        <TextareaFormGroup eRef={subjectRef} label="Asunto" rows={1} required />
        <QuillFormGroup eRef={bodyRef} label="Mensaje" required />
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
  );
};

export default MailingModal;
