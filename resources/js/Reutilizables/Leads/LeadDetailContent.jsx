import Tippy from "@tippyjs/react";
import Quill from "quill";
import React, { useEffect, useRef, useState } from "react";
import { Local, String as SodeString } from "sode-extend-react";
import Swal from "sweetalert2";

import ClientNotesCard from "../ClientNotes/ClientNotesCard.jsx";
import TaskCard from "../Tasks/TaskCard.jsx";
import ClientNotesRest from "../../actions/ClientNotesRest.js";
import LeadsRest from "../../actions/LeadsRest.js";
import TasksRest from "../../actions/TasksRest.js";
import ProductsByClients from "../../actions/ProductsByClientsRest.js";
import GmailRest from "../../actions/GmailRest.js";
import Global from "../../Utils/Global.js";
import HtmlContent from "../../Utils/HtmlContent.jsx";
import MailingModal from "../../components/modals/MailingModal.jsx";
import InputFormGroup from "../../components/form/InputFormGroup.jsx";
import SelectFormGroup from "../../components/form/SelectFormGroup.jsx";
import SelectAPIFormGroup from "../../components/form/SelectAPIFormGroup.jsx";
import SetSelectValue from "../../Utils/SetSelectValue.jsx";
import Number2Currency from "../../Utils/Number2Currency.jsx";
import Dropdown from "../../components/dropdown/DropDown.jsx";
import DropdownItem from "../../components/dropdown/DropdownItem.jsx";
import SimpleProductCard from "../Products/SimpleProductCard.jsx";
import googleSVG from "../../components/svg/google.svg";

const leadsRest = new LeadsRest();
const clientNotesRest = new ClientNotesRest();
const taskRest = new TasksRest();
const productsByClients = new ProductsByClients();
const gmailRest = new GmailRest();

moment.locale("es");

const LeadDetailContent = ({
    lead: leadLoadedInitial,
    statuses = [],
    manageStatuses = [],
    noteTypes = [],
    users = [],
    products = [],
    processes = [],
    session = {},
    onLeadUpdate = () => {},
    onOpenEditModal = () => {}, // Callback to open the edit modal
    convertedLeadStatus,
    defaultClientStatus,
    defaultMessages = [],
    signs = [],
}) => {
    const [leadLoaded, setLeadLoaded] = useState(leadLoadedInitial);
    const [notes, setNotes] = useState([]);
    const [clientProducts, setClientProducts] = useState([]);
    const [hasGSToken, setHasGSToken] = useState(false);
    const [tokenUUID, setTokenUUID] = useState(crypto.randomUUID());
    const [googleAuthURI, setGoogleAuthURI] = useState(null);
    const [mails, setMails] = useState([]);
    const [loadingMails, setLoadingMails] = useState(false);
    const [inReplyTo, setInReplyTo] = useState(null);
    const [mailLoaded, setMailLoaded] = useState(null);

    const [processStatus, setProcessStatus] = useState(null);
    const [processManageStatus, setProcessManageStatus] = useState(null);

    const composeModal = useRef();
    const mailModal = useRef();

    const taskTitleRef = useRef();
    const taskTypeRef = useRef();
    const taskPriorityRef = useRef();
    const taskAssignedToRef = useRef();
    const taskEndsAtDateRef = useRef();
    const taskEndsAtTimeRef = useRef();
    const processRef = useRef();
    const statusRef = useRef();
    const manageStatusRef = useRef();

    const typeRefs = {};
    const idRefs = {};

    noteTypes.forEach((type) => {
        typeRefs[type.id] = useRef();
        idRefs[type.id] = useRef();
    });

    useEffect(() => {
        if (!leadLoadedInitial) return;
        setLeadLoaded(leadLoadedInitial);
    }, [leadLoadedInitial]);

    useEffect(() => {
        const input = processRef.current;
        if (!input) return;
        const dropdownMenu = new bootstrap.Dropdown(input);

        const onFocus = () => dropdownMenu.show();
        const onBlur = () => setTimeout(() => dropdownMenu.hide(), 200);

        input.addEventListener("focus", onFocus);
        input.addEventListener("blur", onBlur);

        return () => {
            input.removeEventListener("focus", onFocus);
            input.removeEventListener("blur", onBlur);
        };
    }, []);

    useEffect(() => {
        gmailRest.check().then((data) => {
            if (data.authorized) return setHasGSToken(true);
            setGoogleAuthURI(data.auth_url);
        });
    }, [tokenUUID]);

    const getMails = () => {
        if (!(hasGSToken && leadLoaded?.contact_email)) return;
        setLoadingMails(true);
        setMails([]);
        gmailRest.list(leadLoaded.contact_email).then((data) => {
            setMails(data ?? []);
            setLoadingMails(false);
        });
    }

    useEffect(() => {
        getMails();
    }, [hasGSToken, leadLoaded]);

    useEffect(() => {
        if (!leadLoaded) {
            setNotes([]);
            setClientProducts([]);
            setProcessStatus(null);
            setProcessManageStatus(null);
            return;
        }

        getNotes(leadLoaded.id);
        getClientProducts(leadLoaded.id);
        setProcessStatus(leadLoaded.status_id);
        setProcessManageStatus(leadLoaded.manage_status_id);
    }, [leadLoaded]);

    useEffect(() => {
        noteTypes.forEach((type) => {
            const editorId = `#editor-${type.id}`;
            if ($(editorId).length && !$(editorId).hasClass("ql-container")) {
                new Quill(editorId, {
                    theme: "bubble",
                    modules: {
                        toolbar: [
                            [{ font: [] }, { size: [] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ color: [] }, { background: [] }],
                            [{ script: "super" }, { script: "sub" }],
                            [
                                { header: [!1, 1, 2, 3, 4, 5, 6] },
                                "blockquote",
                                "code-block",
                            ],
                            [
                                { list: "ordered" },
                                { list: "bullet" },
                                { indent: "-1" },
                                { indent: "+1" },
                            ],
                            ["direction", { align: [] }],
                            ["link", "image", "video"],
                            ["clean"],
                        ],
                        mention: {
                            allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
                            mentionDenotationChars: ["@", "#"],
                            source: async function (
                                searchTerm,
                                renderList,
                                mentionChar,
                            ) {
                                let values = [];
                                if (mentionChar === "@") {
                                    values = users.map((u) => ({
                                        id: u.id,
                                        value: u.fullname,
                                    }));
                                }
                                if (searchTerm.length === 0) {
                                    renderList(values, searchTerm);
                                } else {
                                    const matches = values.filter(
                                        (v) =>
                                            ~v.value
                                                .toLowerCase()
                                                .indexOf(
                                                    searchTerm.toLowerCase(),
                                                ),
                                    );
                                    renderList(matches, searchTerm);
                                }
                            },
                        },
                    },
                });
                $(`#editor-${type.id}`).find(".ql-editor").empty();
            }
        });
    }, [leadLoaded, noteTypes]);

    const getNotes = async (id = leadLoaded?.id) => {
        if (!id) return;
        const newNotes = await clientNotesRest.byClient(id);
        setNotes(newNotes ?? []);
    };

    const getClientProducts = async (id = leadLoaded?.id) => {
        if (!id) return;
        const newClientProducts = await productsByClients.byClient(id);
        setClientProducts(newClientProducts);
    };

    const confirmLeadConversion = async (leadData) => {
        const typesOptions = projectTypes
            .map((t) => `<option value="${t.id}">${t.name}</option>`)
            .join("");
        const suggestedCost =
            leadData?.products?.[0]?.pivot?.price ||
            leadData?.products?.[0]?.price ||
            clientProducts?.[0]?.pivot?.price ||
            clientProducts?.[0]?.price ||
            0;
        const projectPlaceholder =
            leadData?.name || leadData?.tradename || "Nuevo";

        const { value: formValues } = await Swal.fire({
            title: "¿Convertir lead en cliente?",
            width: 500,
            html: `
        <div class="row g-2 text-start pt-2">
          <div class="col-12">
            <label class="form-label fw-semibold text-muted d-flex align-items-center" for="swal-dni" style="font-size: 11px">
              <i class="mdi mdi-card-account-details me-1"></i>DNI o RUC
            </label>
            <input id="swal-dni" class="form-control form-control-sm" placeholder="Ingrese el número de documento" value="${leadData?.ruc || ""}">
          </div>
          <div class="col-12">
            <label class="form-label fw-semibold text-muted d-flex align-items-center" for="swal-fullname" style="font-size: 11px">
              <i class="mdi mdi-account-edit me-1"></i>Nombre completo / Titular
            </label>
            <input id="swal-fullname" class="form-control form-control-sm" placeholder="Nombre completo" value="${leadData?.contact_name || ""}">
          </div>
          <div class="col-12">
            <label class="form-label fw-semibold text-muted d-flex align-items-center" for="swal-tradename" style="font-size: 11px">
              <i class="mdi mdi-office-building me-1"></i>Razón Social
            </label>
            <input id="swal-tradename" class="form-control form-control-sm" placeholder="Razón social o Marca" value="${leadData?.tradename || leadData?.name || ""}">
          </div>
          <div class="col-12">
             <div class="form-check mt-1">
               <input class="form-check-input" type="checkbox" id="swal-create-project">
               <label class="form-check-label fw-bold text-primary" for="swal-create-project" style="font-size: 13px">Crear proyecto de inmediato</label>
             </div>
          </div>
          <div id="swal-project-fields" class="d-none animate__animated animate__fadeIn">
            <div class="border rounded p-2 mt-2 bg-light">
              <div class="col-12 mb-2">
                <label class="form-label fw-semibold text-muted" for="swal-project-name" style="font-size: 11px">Nombre del proyecto</label>
                <input id="swal-project-name" class="form-control form-control-sm" value="Proyecto: ${projectPlaceholder}">
              </div>
              <div class="col-12 mb-2">
                <label class="form-label fw-semibold text-muted" for="swal-project-type" style="font-size: 11px">Tipo del proyecto</label>
                <select id="swal-project-type" class="form-select form-select-sm">${typesOptions}</select>
              </div>
              <div class="col-12 mb-2">
                <label class="form-label fw-semibold text-muted" for="swal-project-cost" style="font-size: 11px">Costo</label>
                <input id="swal-project-cost" type="number" step="0.01" class="form-control form-control-sm" value="${suggestedCost}">
              </div>
              <div class="col-12 mb-2">
                <label class="form-label fw-semibold text-muted" for="swal-project-sign" style="font-size: 11px">Fecha firma</label>
                <input id="swal-project-sign" type="date" class="form-control form-control-sm" value="${moment().format("YYYY-MM-DD")}">
              </div>
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label fw-semibold text-muted" for="swal-project-starts" style="font-size: 11px">Fecha inicio</label>
                  <input id="swal-project-starts" type="date" class="form-control form-control-sm" value="${moment().format("YYYY-MM-DD")}">
                </div>
                <div class="col-6">
                  <label class="form-label fw-semibold text-muted" for="swal-project-ends" style="font-size: 11px">Fecha fin</label>
                  <input id="swal-project-ends" type="date" class="form-control form-control-sm">
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
            didOpen: () => {
                const checkbox = document.getElementById("swal-create-project");
                const fields = document.getElementById("swal-project-fields");
                checkbox.addEventListener("change", (e) => {
                    fields.classList.toggle("d-none", !e.target.checked);
                });
            },
            preConfirm: () => {
                const dni = document.getElementById("swal-dni").value.trim();
                const fullname = document
                    .getElementById("swal-fullname")
                    .value.trim();
                const tradename = document
                    .getElementById("swal-tradename")
                    .value.trim();
                const createProject = document.getElementById(
                    "swal-create-project",
                ).checked;

                if (!dni || !fullname || !tradename) {
                    Swal.showValidationMessage(
                        "Complete los datos (DNI/RUC, Titular y Empresa/Razón Social)",
                    );
                    return false;
                }

                let projectData = null;
                if (createProject) {
                    projectData = {
                        name: document
                            .getElementById("swal-project-name")
                            .value.trim(),
                        type_id:
                            document.getElementById("swal-project-type").value,
                        cost: document.getElementById("swal-project-cost")
                            .value,
                        signed_at:
                            document.getElementById("swal-project-sign").value,
                        starts_at: document.getElementById(
                            "swal-project-starts",
                        ).value,
                        ends_at:
                            document.getElementById("swal-project-ends").value,
                    };
                    if (
                        !projectData.name ||
                        !projectData.type_id ||
                        !projectData.cost ||
                        !projectData.starts_at
                    ) {
                        Swal.showValidationMessage(
                            "Complete los campos del proyecto",
                        );
                        return false;
                    }
                }

                return { dni, fullname, tradename, createProject, projectData };
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Sí, continuar",
            cancelButtonText: "Cancelar",
        });
        return formValues;
    };

    const onSaveNote = async (e) => {
        const type = e.target.value;
        const quill = typeRefs[type].current;
        const editor = $(quill).find(".ql-editor");
        const text = editor.text().trim();
        const content = editor.html();
        if (!text.trim())
            return Swal.fire({
                title: "Ooops!",
                text: "Ingresa un valor válido",
                timer: 2000,
            });
        let title = "";
        let isTask = false;
        let processStatus2save = processStatus;
        let clientData = null;

        const lead = structuredClone({ ...leadLoaded });

        const selectedStatus = statuses.find((s) => s.id === processStatus);
        const selectedManageStatus = manageStatuses.find(
            (s) => s.id === processManageStatus,
        );
        if (
            (selectedStatus?.require || selectedManageStatus?.require) &&
            clientProducts.length === 0
        ) {
            return Swal.fire({
                title: "¡Producto requerido!",
                text: "Debes agregar al menos un producto antes de pasar a este estado.",
                icon: "warning",
                confirmButtonText: "Entendido",
            });
        }

        switch (type) {
            case "8e895346-3d87-4a87-897a-4192b917c211":
                if (
                    convertedLeadStatus &&
                    defaultClientStatus &&
                    processManageStatus == convertedLeadStatus
                ) {
                    const formValues = await confirmLeadConversion(lead);
                    if (!formValues) return;
                    clientData = {
                        ruc: formValues.dni,
                        tradename: formValues.tradename,
                        fullname: formValues.fullname,
                        company: formValues.company,
                        createProject: formValues.createProject,
                        projectData: formValues.projectData,
                    };
                    processStatus2save = defaultClientStatus;
                }
                title = `Nota de ${session.service_user?.fullname || session.fullname}`;
                break;
            case "ed37659f-f9dc-49c1-9d0e-6a2effe9bd54":
                title = `${session.service_user?.fullname || session.fullname} → ${leadLoaded.contact_name}`;
                break;
            case "e20c7891-1ef8-4388-8150-4c1028cc4525":
                isTask = true;
                title = `Nueva tarea`;
                if (
                    !taskEndsAtDateRef.current.value ||
                    !taskEndsAtTimeRef.current.value
                )
                    return Swal.fire({
                        title: "Oops",
                        text: "Ingresa la fecha de finalizacion de la tarea",
                        timer: 2000,
                    });
                break;
            default:
                title = `Nota de ${session.service_user?.fullname || session.fullname}`;
                break;
        }

        const mentions = [
            ...new Set(
                [...$(editor).find(".mention")].map((e) =>
                    e.getAttribute("data-id"),
                ),
            ),
        ];

        const result = await clientNotesRest.save({
            id: idRefs[type].current.value || undefined,
            note_type_id: type,
            process: processRef.current?.value,
            status_id:
                type == "8e895346-3d87-4a87-897a-4192b917c211"
                    ? processStatus2save
                    : undefined,
            manage_status_id:
                type == "8e895346-3d87-4a87-897a-4192b917c211"
                    ? processManageStatus
                    : undefined,
            name: title,
            description: !isTask ? content : undefined,
            raw: !isTask ? text : undefined,
            client_id: leadLoaded.id,
            client_data: clientData,
            tasks: isTask
                ? [
                      {
                          name: taskTitleRef.current.value,
                          type: taskTypeRef.current.value,
                          priority: taskPriorityRef.current.value,
                          description: text ? content : undefined,
                          ends_at: `${taskEndsAtDateRef.current.value} ${taskEndsAtTimeRef.current.value}`,
                          assigned_to: taskAssignedToRef.current.value,
                          mentions,
                      },
                  ]
                : [],
            mentions: !isTask ? mentions : [],
        });
        if (!result) return;

        editor.empty();
        idRefs[type].current.value = null;
        if (isTask) {
            taskTitleRef.current.value = "";
            $(taskTypeRef.current).val("Por hacer").trigger("change");
            $(taskPriorityRef.current).val("Media").trigger("change");
            $(taskAssignedToRef.current).val("").trigger("change");
            taskEndsAtDateRef.current.value = "";
            taskEndsAtTimeRef.current.value = "";
        }
        if (processRef.current) processRef.current.value = "";

        getNotes();
        onLeadUpdate();
    };

    const onDeleteNote = async (noteId) => {
        const { isConfirmed } = await Swal.fire({
            title: "¿Estás seguro?",
            text: `¡No podrás revertir esta acción!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Continuar",
            cancelButtonText: `Cancelar`,
        });
        if (!isConfirmed) return;
        await clientNotesRest.delete(noteId);
        setNotes(notes.filter(({ id }) => id != noteId));
    };

    const onUpdateNoteClicked = async (note) => {
        const quill = typeRefs[note.type.id].current;
        idRefs[note.type.id].current.value = note.id || null;
        $(quill).find(".ql-editor").html(note.description);

        if (note.type.id == "e20c7891-1ef8-4388-8150-4c1028cc4525") {
            const task = note.tasks[0] ?? {};
            taskTitleRef.current.value = task?.name;
            $(taskTypeRef.current).val(task?.type).trigger("change");
            $(taskPriorityRef.current).val(task?.priority).trigger("change");
            SetSelectValue(
                taskAssignedToRef.current,
                task?.assigned?.id,
                task?.assigned?.fullname,
            );
            $(quill).find(".ql-editor").html(task?.description);
            taskEndsAtDateRef.current.value = moment(task?.ends_at).format(
                "YYYY-MM-DD",
            );
            taskEndsAtTimeRef.current.value = moment(task?.ends_at).format(
                "HH:mm",
            );
        }
    };

    const onClientStatusClicked = async (leadId, statusId) => {
        const selectedStatus = statuses.find((s) => s.id === statusId);
        if (selectedStatus?.require && clientProducts.length === 0) {
            return Swal.fire({
                title: "¡Producto requerido!",
                text: "Debes agregar al menos un producto antes de pasar a este estado.",
                icon: "warning",
                confirmButtonText: "Entendido",
            });
        }

        if (defaultClientStatus && statusId == defaultClientStatus) {
            const formValues = await confirmLeadConversion(leadLoaded);
            if (!formValues) return;

            await leadsRest.leadStatus({
                lead: leadId,
                status: statusId,
                ruc: formValues.dni,
                tradename: formValues.tradename,
                fullname: formValues.fullname,
                company: formValues.company,
                createProject: formValues.createProject,
                projectData: formValues.projectData,
            });

            await Swal.fire({
                title: "¡Lead convertido!",
                text: "El lead ha sido convertido en cliente exitosamente.",
                icon: "success",
                confirmButtonText: "Entendido",
            });
        } else {
            await leadsRest.leadStatus({ lead: leadId, status: statusId });
        }

        const newLead = await leadsRest.get(leadId);
        setLeadLoaded(newLead);
        onLeadUpdate();
    };

    const onManageStatusChange = async (lead, status) => {
        if (status?.require && clientProducts.length === 0) {
            return Swal.fire({
                title: "¡Producto requerido!",
                text: "Debes agregar al menos un producto antes de pasar a este estado.",
                icon: "warning",
                confirmButtonText: "Entendido",
            });
        }

        await leadsRest.manageStatus({
            lead: lead.id,
            status: status.id,
        });
        const newLead = await leadsRest.get(lead.id);
        setLeadLoaded(newLead);
        onLeadUpdate();
    };

    const onTaskStatusChange = async (id, status) => {
        const result = await taskRest.status({ id, status });
        if (!result) return;
        getNotes();
        onLeadUpdate();
    };

    const addProduct2Client = async (product) => {
        await productsByClients.save({
            client_id: leadLoaded.id,
            product_id: product.id,
            price: product.price,
        });
        getClientProducts();
    };

    const deleteClientProduct = async (id) => {
        await productsByClients.delete(id);
        getClientProducts();
    };

    const onPriceChange = async (id, price) => {
        await productsByClients.boolean({ id, field: "price", value: price });
        getClientProducts();
    };

    const onAssignLead = async (leadId, userId) => {
        const { isConfirmed } = await Swal.fire({
            title: "¿Estás seguro?",
            text: "El lead será asignado a otro usuario.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, asignar",
            cancelButtonText: "Cancelar",
        });

        if (!isConfirmed) return;

        const success = await leadsRest.massiveAssign({
            leadsId: [leadId],
            userId,
        });
        if (success) {
            const updated = await leadsRest.get(leadId);
            setLeadLoaded(updated);
            onLeadUpdate();
        }
    };

    if (!leadLoaded) return null;

    const pendingTasks = [];
    notes.forEach((note) => {
        pendingTasks.push(
            ...(note.tasks?.filter((x) => x.status != "Realizado") || []),
        );
    });

    return (
        <div className="row">
            {/* Column 1: Details */}
            <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                <div className="d-flex mb-3">
                    <img
                        className="flex-shrink-0 me-3 rounded-circle avatar-md"
                        alt={leadLoaded?.contact_name}
                        src={`/api/whatsapp/profile/${leadLoaded?.integration_user_id || leadLoaded?.contact_phone}`}
                        onError={(e) => {
                            e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                        }}
                    />
                    <div className="flex-grow-1">
                        <h4 className="media-heading mt-0">
                            <Tippy content="Modificar datos">
                                <i
                                    className="mdi mdi-lead-pencil me-1"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => onOpenEditModal(leadLoaded)}
                                ></i>
                            </Tippy>
                            {leadLoaded?.contact_name}
                        </h4>
                        <span className="badge bg-primary me-1">
                            {leadLoaded?.contact_position || "Trabajador"}
                        </span>{" "}
                        <small className="text-muted">
                            desde <b>{leadLoaded?.origin}</b>
                        </small>
                    </div>
                </div>
                <hr />
                <h4>Estados</h4>
                <div className="d-flex flex-wrap gap-2 justify-content-between mb-2">
                    <div style={{ flex: 1 }}>
                        <b className="d-block">Estado de gestión</b>
                        <div className="btn-group mb-0 w-100">
                            <button
                                className="btn btn-light btn-sm dropdown-toggle text-white"
                                type="button"
                                data-bs-toggle="dropdown"
                                style={{
                                    backgroundColor:
                                        leadLoaded?.status?.color || "#6c757d",
                                }}
                            >
                                {leadLoaded?.status?.name || "Sin estado"}{" "}
                                <i className="mdi mdi-chevron-down"></i>
                            </button>
                            <div className="dropdown-menu">
                                {statuses.map((status, i) => (
                                    <span
                                        key={`status-${i}`}
                                        className="dropdown-item"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            onClientStatusClicked(
                                                leadLoaded.id,
                                                status.id,
                                            )
                                        }
                                    >
                                        {status.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <b className="d-block">Etiqueta</b>
                        <div className="btn-group mb-0 w-100">
                            <button
                                className="btn btn-light btn-sm dropdown-toggle text-white"
                                type="button"
                                data-bs-toggle="dropdown"
                                style={{
                                    backgroundColor:
                                        leadLoaded?.manage_status?.color ||
                                        "#6c757d",
                                }}
                            >
                                {leadLoaded?.manage_status?.name ||
                                    "Sin estado"}{" "}
                                <i className="mdi mdi-chevron-down"></i>
                            </button>
                            <div className="dropdown-menu">
                                {manageStatuses.map((status, i) => (
                                    <span
                                        key={`mstatus-${i}`}
                                        className="dropdown-item"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            onManageStatusChange(
                                                leadLoaded,
                                                status,
                                            )
                                        }
                                    >
                                        {status.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-2 bg-light rounded mb-2 border mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <b className="d-block mb-0">Atendido por:</b>
                        <div className="dropdown">
                            <button
                                className="btn btn-xs btn-soft-primary rounded-pill dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                            >
                                {leadLoaded.assigned_to ? 'Reasignar' : 'Asignar'} <i className="mdi mdi-chevron-down"></i>
                            </button>
                            <div
                                className="dropdown-menu dropdown-menu-end scroll-hidden"
                                style={{ maxHeight: "200px", overflowY: "auto" }}
                            >
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        className={`dropdown-item d-flex align-items-center gap-2 ${
                                            leadLoaded.assigned_to ===
                                            user.service_user.id
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            onAssignLead(
                                                leadLoaded.id,
                                                user.service_user.id,
                                            )
                                        }
                                    >
                                        <img
                                            src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                                            className="rounded-circle"
                                            width="20"
                                            height="20"
                                            onError={(e) => {
                                                e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                            }}
                                        />
                                        <span>
                                            {user.name} {user.lastname}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {leadLoaded?.assigned_to ? (
                        <div className="d-flex align-items-start">
                            <img
                                className="d-flex me-2 rounded-circle"
                                src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${leadLoaded?.assigned?.relative_id}`}
                                onError={(e) => {
                                    e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                }}
                                alt={leadLoaded?.assigned?.name}
                                height="32"
                            />
                            <div className="w-100 overflow-hidden">
                                <h5 className="m-0 font-14 text-truncate">
                                    {leadLoaded?.assigned?.name}{" "}
                                    {leadLoaded?.assigned?.lastname}
                                </h5>
                                <span className="font-12 mb-0 text-truncate d-block text-muted">
                                    {leadLoaded?.assigned?.email}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-1">
                            <i className="text-muted small">Sin asignar</i>
                        </div>
                    )}
                </div>
                <hr />
                <h4>Datos del contacto</h4>
                <h5 className="font-600 mb-0">Correo electronico</h5>
                <p className="mb-2 text-truncate">
                    {" "}
                    {leadLoaded?.contact_email || (
                        <i className="text-muted">No especifica</i>
                    )}{" "}
                </p>
                <h5 className="font-600 mb-0">Tefono / Celular</h5>
                <p className="mb-2">
                    {" "}
                    {leadLoaded?.contact_phone || (
                        <i className="text-muted">No especifica</i>
                    )}{" "}
                </p>
                <h5 className="font-600 mb-0">Mensaje</h5>
                <p className="mb-2">
                    {" "}
                    {leadLoaded?.message || (
                        <i className="text-muted">Sin mensaje</i>
                    )}{" "}
                </p>
                <h5 className="font-600 mb-0">Fecha de registro</h5>
                <p className="mb-2">
                    {moment(leadLoaded?.created_at).format("LL")}
                    <br />
                    <small className="text-muted">
                        {moment(leadLoaded?.created_at).format("LTS")}
                    </small>
                </p>
                <hr />
                <h4>Datos de la empresa</h4>
                <h5 className="font-600 mb-0">Nombre comercial</h5>
                <p className="mb-2">
                    {" "}
                    {leadLoaded?.name || (
                        <i className="text-muted">No especifica</i>
                    )}{" "}
                </p>
                <h5 className="font-600 mb-0">RUC</h5>
                <p className="mb-2">
                    {" "}
                    {leadLoaded?.ruc || (
                        <i className="text-muted">No especifica</i>
                    )}{" "}
                </p>
                <h5 className="font-600 mb-0">N° trabajadores</h5>
                <p className="mb-2">
                    {" "}
                    {leadLoaded?.workers || (
                        <i className="text-muted">No especifica</i>
                    )}{" "}
                </p>
            </div>

            {/* Column 2: Tabs and Activity */}
            <div className="col-lg-6 col-md-4 col-sm-6 col-xs-12">
                <div className="card card-body shadow-none border">
                    <ul
                        className="nav nav-tabs"
                        style={{
                            flexWrap: "nowrap",
                            overflowX: "auto",
                            overflowY: "hidden",
                        }}
                    >
                        <li className="nav-item">
                            <a
                                href="#note-type-activity"
                                data-bs-toggle="tab"
                                className="nav-link active text-center"
                            >
                                <i className="mdi mdi-clock"></i> Actividad
                            </a>
                        </li>
                        {noteTypes
                            .sort((a, b) => a.order - b.order)
                            .map((type, i) => {
                                if (
                                    !leadLoaded?.contact_email &&
                                    type.name == "Correos"
                                )
                                    return null;
                                return (
                                    <li key={`nt-${i}`} className="nav-item">
                                        <a
                                            href={`#note-type-${type.id}`}
                                            data-name={type.name}
                                            data-bs-toggle="tab"
                                            className="nav-link text-center"
                                        >
                                            <i className={type.icon}></i>{" "}
                                            {type.name}
                                        </a>
                                    </li>
                                );
                            })}
                    </ul>
                    <div className="tab-content">
                        <div
                            className="tab-pane active"
                            id="note-type-activity"
                        >
                            {notes
                                .sort((a, b) =>
                                    b.created_at > a.created_at ? 1 : -1,
                                )
                                .map((note, i) => (
                                    <ClientNotesCard
                                        key={`note-${i}`}
                                        {...note}
                                        onTaskChange={onTaskStatusChange}
                                        showOptions={false}
                                        session={session}
                                    />
                                ))}
                        </div>
                        {noteTypes
                            .sort((a, b) => a.order - b.order)
                            .map((type, i) => {
                                const isGmail =
                                    type.id ==
                                    "37b1e8e2-04c4-4246-a8c9-838baa7f8187";
                                const drawGoogleAuth = isGmail && !hasGSToken;
                                return (
                                    <div
                                        key={`tab-nt-${i}`}
                                        className="tab-pane"
                                        id={`note-type-${type.id}`}
                                    >
                                        {!drawGoogleAuth && (
                                            <h4 className="header-title mb-2 d-flex justify-content-between align-items-center">
                                                <span>
                                                    Lista de {type.name}
                                                </span>
                                                {isGmail && (
                                                    <div className="d-flex gap-1">
                                                        <Tippy content="Refrescar correos">
                                                            <button
                                                                className="btn btn-xs btn-white"
                                                                type="button"
                                                                disabled={
                                                                    loadingMails
                                                                }
                                                                onClick={
                                                                    getMails
                                                                }
                                                            >
                                                                {loadingMails ? (
                                                                    <i className="fa fa-spinner fa-spin"></i>
                                                                ) : (
                                                                    <i className="fas fa-redo"></i>
                                                                )}
                                                            </button>
                                                        </Tippy>
                                                        <button
                                                            className="btn btn-xs btn-success"
                                                            type="button"
                                                            onClick={() => {
                                                                setInReplyTo(
                                                                    null,
                                                                );
                                                                $(
                                                                    composeModal.current,
                                                                ).modal("show");
                                                            }}
                                                        >
                                                            <i className="mdi mdi-pen me-1"></i>{" "}
                                                            Redactar
                                                        </button>
                                                    </div>
                                                )}
                                            </h4>
                                        )}
                                        <input
                                            ref={idRefs[type.id]}
                                            type="hidden"
                                        />
                                        <div className="row">
                                            {drawGoogleAuth && (
                                                <div className="col-12 text-center py-4">
                                                    <h1>¡Ups!</h1>
                                                    <p>
                                                        Necesitamos tu permiso
                                                        para acceder a tu correo
                                                        electrónico.
                                                    </p>
                                                    <div className="d-flex flex-column align-items-center gap-2">
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() =>
                                                                setTokenUUID(
                                                                    crypto.randomUUID(),
                                                                )
                                                            }
                                                        >
                                                            Ya he iniciado
                                                            sesión
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-white d-inline-flex align-items-center gap-1"
                                                            onClick={() =>
                                                                window.open(
                                                                    googleAuthURI,
                                                                    "_blank",
                                                                )
                                                            }
                                                        >
                                                            <img
                                                                src={googleSVG}
                                                                alt=""
                                                                style={{
                                                                    width: "14px",
                                                                }}
                                                            />
                                                            <span>
                                                                Permitir acceso
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {type.id ==
                                                "e20c7891-1ef8-4388-8150-4c1028cc4525" && (
                                                <>
                                                    <InputFormGroup
                                                        eRef={taskTitleRef}
                                                        label="Titulo de la tarea"
                                                        col="col-12"
                                                        required
                                                    />
                                                    <SelectFormGroup
                                                        eRef={taskTypeRef}
                                                        label="Tipo de tarea"
                                                        col="col-lg-4 col-md-12"
                                                        required
                                                        dropdownParent={`#note-type-${type.id}`}
                                                        defaultValue="Por hacer"
                                                    >
                                                        <option value="Llamada">
                                                            Llamada
                                                        </option>
                                                        <option value="Correo">
                                                            Correo
                                                        </option>
                                                        <option value="Por hacer">
                                                            Por hacer
                                                        </option>
                                                    </SelectFormGroup>
                                                    <SelectFormGroup
                                                        eRef={taskPriorityRef}
                                                        label="Prioridad"
                                                        col="col-lg-3 col-md-12"
                                                        required
                                                        dropdownParent={`#note-type-${type.id}`}
                                                        defaultValue="Media"
                                                    >
                                                        <option value="Baja">
                                                            Baja
                                                        </option>
                                                        <option value="Media">
                                                            Media
                                                        </option>
                                                        <option value="Alta">
                                                            Alta
                                                        </option>
                                                        <option value="Urgente">
                                                            Urgente
                                                        </option>
                                                    </SelectFormGroup>
                                                    <SelectAPIFormGroup
                                                        eRef={taskAssignedToRef}
                                                        label="Asignado a"
                                                        col="col-lg-5 col-md-12"
                                                        dropdownParent={`#note-type-${type.id}`}
                                                        searchAPI="/api/users/paginate"
                                                        searchBy="fullname"
                                                    />
                                                    <InputFormGroup
                                                        eRef={taskEndsAtDateRef}
                                                        label="Fecha finalización"
                                                        type="date"
                                                        col="col-lg-6 col-md-12"
                                                        required
                                                    />
                                                    <InputFormGroup
                                                        eRef={taskEndsAtTimeRef}
                                                        label="Hora finalización"
                                                        type="time"
                                                        col="col-lg-6 col-md-12"
                                                        required
                                                    />
                                                </>
                                            )}
                                            {type.id ==
                                                "8e895346-3d87-4a87-897a-4192b917c211" && (
                                                <InputFormGroup
                                                    eRef={processRef}
                                                    label="Proceso"
                                                    col="col-12"
                                                    parentClassName="dropdown"
                                                    className="dropdown-toggle"
                                                    data-bs-toggle="dropdown"
                                                >
                                                    <ul className="dropdown-menu w-100">
                                                        {processes.map(
                                                            (p, idx) => (
                                                                <li
                                                                    key={idx}
                                                                    className="dropdown-item"
                                                                    onClick={() =>
                                                                        (processRef.current.value =
                                                                            p.name)
                                                                    }
                                                                    style={{
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <b className="d-block">
                                                                        {p.name}
                                                                    </b>
                                                                    {p.description && (
                                                                        <small className="d-block text-truncate">
                                                                            {
                                                                                p.description
                                                                            }
                                                                        </small>
                                                                    )}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </InputFormGroup>
                                            )}
                                            {!isGmail && (
                                                <div className="col-12 mb-2">
                                                    <label className="mb-1">
                                                        Contenido
                                                    </label>
                                                    <div
                                                        ref={typeRefs[type.id]}
                                                        id={`editor-${type.id}`}
                                                        style={{
                                                            height: "162px",
                                                        }}
                                                    ></div>
                                                </div>
                                            )}
                                            {type.id ==
                                                "8e895346-3d87-4a87-897a-4192b917c211" && (
                                                <>
                                                    <div className="col-lg-6 mb-2">
                                                        <label className="form-label">
                                                            Estado de gestión
                                                        </label>
                                                        <div className="dropdown">
                                                            <button
                                                                className="btn btn-white btn-sm dropdown-toggle w-100 text-start"
                                                                type="button"
                                                                data-bs-toggle="dropdown"
                                                                ref={statusRef}
                                                            >
                                                                {statuses.find(
                                                                    (s) =>
                                                                        s.id ===
                                                                        processStatus,
                                                                )?.name ||
                                                                    "Seleccionar estado"}
                                                                <i className="mdi mdi-chevron-down float-end" />
                                                            </button>
                                                            <ul className="dropdown-menu w-100">
                                                                {statuses
                                                                    .sort(
                                                                        (
                                                                            a,
                                                                            b,
                                                                        ) =>
                                                                            a.order -
                                                                            b.order,
                                                                    )
                                                                    .map(
                                                                        (s) => (
                                                                            <li
                                                                                key={
                                                                                    s.id
                                                                                }
                                                                            >
                                                                                <button
                                                                                    className="dropdown-item"
                                                                                    onClick={() =>
                                                                                        setProcessStatus(
                                                                                            s.id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <i
                                                                                        className="mdi mdi-circle me-1"
                                                                                        style={{
                                                                                            color: s.color,
                                                                                        }}
                                                                                    />
                                                                                    {
                                                                                        s.name
                                                                                    }
                                                                                </button>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-6 mb-2">
                                                        <label className="form-label">
                                                            Etiqueta
                                                        </label>
                                                        <div className="dropdown">
                                                            <button
                                                                className="btn btn-white btn-sm dropdown-toggle w-100 text-start"
                                                                type="button"
                                                                data-bs-toggle="dropdown"
                                                                ref={
                                                                    manageStatusRef
                                                                }
                                                            >
                                                                {manageStatuses.find(
                                                                    (s) =>
                                                                        s.id ===
                                                                        processManageStatus,
                                                                )?.name ||
                                                                    "Seleccionar estado"}
                                                                <i className="mdi mdi-chevron-down float-end" />
                                                            </button>
                                                            <ul className="dropdown-menu w-100">
                                                                {manageStatuses
                                                                    .filter(
                                                                        (s) => {
                                                                            const parent =
                                                                                statuses.find(
                                                                                    (
                                                                                        ps,
                                                                                    ) =>
                                                                                        ps.id ===
                                                                                        processStatus,
                                                                                );
                                                                            if (
                                                                                !parent
                                                                                    ?.children
                                                                                    ?.length
                                                                            )
                                                                                return true;
                                                                            return parent.children.includes(
                                                                                s.id,
                                                                            );
                                                                        },
                                                                    )
                                                                    .sort(
                                                                        (
                                                                            a,
                                                                            b,
                                                                        ) =>
                                                                            a.order -
                                                                            b.order,
                                                                    )
                                                                    .map(
                                                                        (s) => (
                                                                            <li
                                                                                key={
                                                                                    s.id
                                                                                }
                                                                            >
                                                                                <button
                                                                                    className="dropdown-item"
                                                                                    onClick={() => {
                                                                                        setProcessManageStatus(
                                                                                            s.id,
                                                                                        );
                                                                                        if (
                                                                                            s.parent &&
                                                                                            statuses.some(
                                                                                                (
                                                                                                    ps,
                                                                                                ) =>
                                                                                                    ps.id ===
                                                                                                    s.parent,
                                                                                            )
                                                                                        )
                                                                                            setProcessStatus(
                                                                                                s.parent,
                                                                                            );
                                                                                    }}
                                                                                >
                                                                                    <i
                                                                                        className="mdi mdi-circle me-1"
                                                                                        style={{
                                                                                            color: s.color,
                                                                                        }}
                                                                                    />
                                                                                    {
                                                                                        s.name
                                                                                    }
                                                                                </button>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {!isGmail && (
                                                <div className="col-12">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        type="button"
                                                        value={type.id}
                                                        onClick={onSaveNote}
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {!isGmail && <hr />}
                                        {isGmail
                                            ? mails.map((mail, idx) => (
                                                  <div
                                                      key={idx}
                                                      className="card mb-2 border shadow-none"
                                                      style={{
                                                          cursor: "pointer",
                                                      }}
                                                      onClick={async () => {
                                                          const details =
                                                              await gmailRest.getDetails(
                                                                  mail.id,
                                                              );
                                                          if (details) {
                                                              setMailLoaded(
                                                                  details,
                                                              );
                                                              $(
                                                                  mailModal.current,
                                                              ).modal("show");
                                                          }
                                                      }}
                                                  >
                                                      <div className="card-header p-2 bg-light">
                                                          <b className="d-block">
                                                              {mail.type ==
                                                              "sent" ? (
                                                                  <i className="mdi mdi-send me-1"></i>
                                                              ) : (
                                                                  <i className="mdi mdi-inbox me-1"></i>
                                                              )}
                                                              <HtmlContent
                                                                  className="d-inline"
                                                                  html={SodeString(
                                                                      mail.sender,
                                                                  ).replace(
                                                                      /\<(.*?)\>/g,
                                                                      '<span class="mx-1">·</span><small>&lt;$1&gt;</small>',
                                                                  )}
                                                              />
                                                          </b>
                                                          <small className="text-muted">
                                                              {moment(
                                                                  mail.date,
                                                              ).format("LLL")}
                                                          </small>
                                                      </div>
                                                      <div className="card-body p-2 font-13">
                                                          <b>{mail.subject}</b>{" "}
                                                          - {mail.snippet}
                                                      </div>
                                                  </div>
                                              ))
                                            : notes
                                                  .filter(
                                                      (n) =>
                                                          n.note_type_id ==
                                                          type.id,
                                                  )
                                                  .sort((a, b) =>
                                                      b.created_at >
                                                      a.created_at
                                                          ? 1
                                                          : -1,
                                                  )
                                                  .map((note, idx) => (
                                                      <ClientNotesCard
                                                          key={idx}
                                                          {...note}
                                                          session={session}
                                                          onDeleteNote={
                                                              onDeleteNote
                                                          }
                                                          onUpdateNote={
                                                              onUpdateNoteClicked
                                                          }
                                                      />
                                                  ))}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Column 3: Tasks and Products */}
            <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                <div className="card shadow-none border">
                    <div className="card-header bg-danger py-2">
                        <h5 className="header-title my-0 text-white font-14">
                            Tareas
                        </h5>
                    </div>
                    <div
                        className="card-body p-2 scroll-hidden"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                        {pendingTasks.length > 0 ? (
                            pendingTasks
                                .sort((a, b) =>
                                    a.ends_at > b.ends_at ? 1 : -1,
                                )
                                .map((task, i) => (
                                    <TaskCard
                                        key={i}
                                        {...task}
                                        onChange={onTaskStatusChange}
                                    />
                                ))
                        ) : (
                            <i className="text-muted small">
                                - No hay tareas pendientes -
                            </i>
                        )}
                    </div>
                </div>

                <div className="card shadow-none border">
                    <div className="card-header bg-primary py-2 d-flex justify-content-between align-items-center">
                        <h5 className="header-title my-0 text-white font-14">
                            Productos
                        </h5>
                        <div className="text-white font-12 fw-bold">
                            S/.{" "}
                            {Number2Currency(
                                clientProducts.reduce(
                                    (t, p) => t + Number(p.price),
                                    0,
                                ),
                            )}
                        </div>
                    </div>
                    <div
                        className="card-body p-2 scroll-hidden"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                        <Dropdown
                            className="d-block mx-auto btn btn-xs btn-white rounded-pill mb-2 border"
                            title={
                                <span>
                                    <i className="mdi mdi-plus me-1"></i>Añadir
                                </span>
                            }
                        >
                            {products.map((p, i) => (
                                <DropdownItem
                                    key={i}
                                    onClick={() => addProduct2Client(p)}
                                >
                                    {p.name} - S/. {Number2Currency(p.price)}
                                </DropdownItem>
                            ))}
                        </Dropdown>
                        {clientProducts.map((p, i) => (
                            <SimpleProductCard
                                key={i}
                                {...p}
                                onDelete={() => deleteClientProduct(p.id)}
                                onPriceChange={(val) =>
                                    onPriceChange(p.id, val)
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>

            <MailingModal
                modalRef={composeModal}
                data={leadLoaded}
                inReplyTo={inReplyTo}
                session={session}
                defaultMessages={defaultMessages}
                signs={signs}
                onSend={() => {
                    getMails();
                    onLeadUpdate();
                }}
            />
            <MailingModal
                modalRef={mailModal}
                data={leadLoaded}
                inReplyTo={mailLoaded}
                session={session}
                defaultMessages={defaultMessages}
                signs={signs}
                readOnly
                onReply={(mail) => {
                    setInReplyTo(mail);
                    $(composeModal.current).modal("show");
                }}
                onSend={() => {
                    getMails();
                    onLeadUpdate();
                }}
            />
        </div>
    );
};

export default LeadDetailContent;
