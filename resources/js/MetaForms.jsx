import React, { useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import CreateReactScript from "./Utils/CreateReactScript.jsx";
import Adminto from "./components/Adminto.jsx";
import Modal from "./components/Modal.jsx";
import Swal from "sweetalert2";
import MetaFormRulesRest from "./actions/MetaFormRulesRest.js";
import { Fetch } from "sode-extend-react";

const metaFormRulesRest = new MetaFormRulesRest();

const MetaForms = ({
    leadStatuses = [],
    manageStatuses = [],
    chatStatuses = [],
    users = [],
    rules: initialRules = [],
    metaForms: initialMetaForms = [],
}) => {
    const [rules, setRules] = useState(initialRules);
    const [metaForms, setMetaForms] = useState(initialMetaForms);
    const [isSyncingForms, setIsSyncingForms] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("forms"); // "forms" | "rules"

    const modalRef = useRef();

    // Selected state for Modal
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedRule, setSelectedRule] = useState(null);
    const [isEditingRule, setIsEditingRule] = useState(false);

    // Rule Builder state
    const [conditions, setConditions] = useState([]);
    const [chatStatusId, setChatStatusId] = useState("");
    const [manageStatusId, setManageStatusId] = useState("");
    const [statusId, setStatusId] = useState("");
    const [assignedTo, setAssignedTo] = useState("");

    // Sync Meta Forms
    const syncMetaForms = async () => {
        setIsSyncingForms(true);
        try {
            const { status, result } = await Fetch("/api/meta-form-rules/forms");
            const formsArray = result?.data || [];
            if (status && Array.isArray(formsArray)) {
                setMetaForms(formsArray);
                Swal.fire({
                    title: "Sincronizado",
                    text: `Se actualizaron ${formsArray.length} formularios de Meta`,
                    icon: "success",
                    timer: 2000,
                });
            } else {
                Swal.fire("Atención", "No se encontraron formularios o verifica tu conexión a Meta", "warning");
            }
        } catch (error) {
            Swal.fire("Error", "Error al conectar con la API de Meta", "error");
        } finally {
            setIsSyncingForms(false);
        }
    };

    // Filter standard Meta contact fields (FULL_NAME, EMAIL, PHONE, etc.), leaving custom questions
    const getCustomQuestions = (questions = []) => {
        const standardKeys = [
            "full_name",
            "email",
            "phone_number",
            "work_phone_number",
            "phone",
            "first_name",
            "last_name",
            "nombre_y_apelido",
            "correo",
            "número_de_celular",
        ];

        return questions.filter((q) => {
            if (q.type === "CUSTOM") return true;
            if (q.options && q.options.length > 0) return true;
            const qKey = (q.key || q.name || q.type || "").toLowerCase();
            return !standardKeys.includes(qKey);
        });
    };

    // Open modal to configure rule
    const onOpenFormModal = (formObj, ruleToEdit = null) => {
        setSelectedForm(formObj);

        if (ruleToEdit) {
            setIsEditingRule(true);
            setSelectedRule(ruleToEdit);
            setConditions(ruleToEdit.conditions || []);
            setChatStatusId(ruleToEdit.chat_status_id || "");
            setManageStatusId(ruleToEdit.manage_status_id || "");
            setStatusId(ruleToEdit.status_id || "");
            setAssignedTo(ruleToEdit.assigned_to || "");
        } else {
            setIsEditingRule(false);
            setSelectedRule(null);
            setConditions([{ field_name: "", operator: "equals", value: "" }]);
            setChatStatusId("");
            setManageStatusId("");
            setStatusId("");
            setAssignedTo("");
        }

        $(modalRef.current).modal("show");
    };

    const addCondition = () => {
        setConditions((prev) => [
            ...prev,
            { field_name: "", operator: "equals", value: "" },
        ]);
    };

    const updateCondition = (index, field, val) => {
        setConditions((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: val };
            if (field === "field_name") {
                next[index].value = "";
            }
            return next;
        });
    };

    const removeCondition = (index) => {
        setConditions((prev) => prev.filter((_, i) => i !== index));
    };

    const onSaveRule = async (e) => {
        e.preventDefault();

        if (!selectedForm) {
            Swal.fire("Error", "Selecciona un formulario de Meta", "error");
            return;
        }

        const payload = {
            id: selectedRule ? selectedRule.id : undefined,
            form_id: selectedForm.id,
            form_name: selectedForm.name || `Formulario ${selectedForm.id}`,
            conditions: conditions.filter((c) => c.field_name.trim() !== ""),
            chat_status_id: chatStatusId || null,
            manage_status_id: manageStatusId || null,
            status_id: statusId || null,
            assigned_to: assignedTo || null,
        };

        const result = await metaFormRulesRest.save(payload);

        if (result) {
            Swal.fire({
                title: "Regla Guardada",
                text: "Los nuevos leads de este formulario ejecutarán este flujo automáticamente",
                icon: "success",
                timer: 2000,
            });

            if (rules.some((r) => r.id === result.id)) {
                setRules((prev) =>
                    prev.map((r) => (r.id === result.id ? result : r))
                );
            } else {
                setRules((prev) => [result, ...prev]);
            }

            $(modalRef.current).modal("hide");
        }
    };

    const onDeleteRule = async (id) => {
        const { isConfirmed } = await Swal.fire({
            title: "¿Eliminar regla de automatización?",
            text: "Esta acción eliminará el flujo automático para esta respuesta.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!isConfirmed) return;

        const result = await metaFormRulesRest.delete(id);

        if (result) {
            setRules((prev) => prev.filter((r) => r.id !== id));
            Swal.fire("Eliminado", "La regla ha sido eliminada", "success");
        }
    };

    const filteredForms = metaForms.filter((f) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (f.name || "").toLowerCase().includes(term) ||
            (f.id || "").toLowerCase().includes(term)
        );
    });

    return (
        <div className="container-fluid">
            {/* SERIOUS CLEAN HEADER */}
            <div className="row mb-3 align-items-center">
                <div className="col">
                    <h4 className="page-title my-0 fw-bold text-dark font-20">
                        Formularios Meta
                    </h4>
                    <p className="text-muted mb-0 font-13">
                        Administración de reglas y flujos de automatización para leads de Meta Forms.
                    </p>
                </div>
                <div className="col-auto d-flex gap-2">
                    <button
                        className="btn btn-sm btn-primary rounded-pill font-13 px-3 fw-semibold"
                        onClick={syncMetaForms}
                        disabled={isSyncingForms}
                    >
                        <i className={`mdi ${isSyncingForms ? "mdi-loading mdi-spin" : "mdi-refresh"} me-1`}></i>
                        {isSyncingForms ? "Sincronizando..." : "Sincronizar Formularios"}
                    </button>
                </div>
            </div>

            {/* TAB CONTROLS & SEARCH */}
            <div className="row mb-3 align-items-center">
                <div className="col-md-7">
                    <ul className="nav nav-tabs nav-bordered">
                        <li className="nav-item">
                            <button
                                className={`nav-link font-13 fw-semibold ${activeTab === "forms" ? "active" : ""}`}
                                onClick={() => setActiveTab("forms")}
                            >
                                <i className="mdi mdi-form-select me-1"></i>
                                Formularios ({metaForms.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link font-13 fw-semibold ${activeTab === "rules" ? "active" : ""}`}
                                onClick={() => setActiveTab("rules")}
                            >
                                <i className="mdi mdi-lightning-bolt me-1"></i>
                                Reglas Configuradas ({rules.length})
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="col-md-5 d-flex gap-2 justify-content-md-end mt-2 mt-md-0">
                    {activeTab === "forms" && (
                        <div className="input-group input-group-sm" style={{ maxWidth: "300px" }}>
                            <span className="input-group-text bg-white border-end-0">
                                <i className="mdi mdi-magnify text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control form-control-sm border-start-0"
                                placeholder="Buscar por nombre o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* TAB 1: FORMULARIOS DE META (COMPACT GRID - 4 CARDS PER ROW) */}
            {activeTab === "forms" && (
                <div className="row g-3">
                    {filteredForms.length === 0 ? (
                        <div className="col-12">
                            <div className="card text-center py-5 border">
                                <div className="card-body">
                                    <i className="mdi mdi-form-select display-4 text-muted"></i>
                                    <h5 className="mt-3 font-16 fw-bold">No se encontraron formularios</h5>
                                    <p className="text-muted font-13">
                                        Haz clic en "Sincronizar Formularios" para importar los formularios de tu cuenta de Meta.
                                    </p>
                                    <button
                                        className="btn btn-sm btn-primary rounded-pill px-3"
                                        onClick={syncMetaForms}
                                        disabled={isSyncingForms}
                                    >
                                        <i className="mdi mdi-refresh me-1"></i> Sincronizar Ahora
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        filteredForms.map((form) => {
                            const formRules = rules.filter((r) => r.form_id === form.id || r.form_id === "*");
                            const customQuestions = getCustomQuestions(form.questions || []);

                            return (
                                <div key={form.id} className="col-xl-3 col-lg-4 col-md-6">
                                    <div className="card h-100 border shadow-sm">
                                        {/* TOP HEADER WITH ACTION BUTTON */}
                                        <div className="card-header bg-light p-3 border-bottom">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <span className="badge bg-white text-secondary border font-10">
                                                    ID: {form.id}
                                                </span>
                                                <span className={`badge ${form.status === "ACTIVE" ? "bg-success" : "bg-secondary"} rounded-pill font-10`}>
                                                    {form.status || "ACTIVO"}
                                                </span>
                                            </div>

                                            <h6 className="card-title my-0 text-dark fw-bold font-14 text-truncate mb-3" title={form.name || form.id}>
                                                {form.name || `Formulario ${form.id}`}
                                            </h6>

                                            {/* PRIMARY ACTION BUTTON AT THE TOP */}
                                            <button
                                                className="btn btn-sm btn-primary w-100 font-12 fw-semibold"
                                                style={{ borderRadius: "2.5rem", padding: "8px 16px" }}
                                                onClick={() => onOpenFormModal(form)}
                                            >
                                                <i className="mdi mdi-lightning-bolt me-1"></i> Configurar Flujo Automático
                                            </button>
                                        </div>

                                        {/* CARD BODY: CUSTOM QUESTIONS LIST */}
                                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                                            <div className="mb-2">
                                                <small className="text-uppercase fw-bold text-muted font-10 d-block mb-2">
                                                    Preguntas del Formulario ({customQuestions.length})
                                                </small>

                                                {customQuestions.length === 0 ? (
                                                    <div className="text-muted font-11 font-italic py-1">
                                                        Sin preguntas personalizadas.
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "240px", overflowY: "auto" }}>
                                                        {customQuestions.map((q, qIdx) => {
                                                            const qText = q.label || q.key || q.name || `Pregunta ${qIdx + 1}`;
                                                            return (
                                                                <div
                                                                    key={qIdx}
                                                                    className="p-2 bg-light rounded-3 font-12 text-dark fw-semibold border-0"
                                                                    style={{ whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.4" }}
                                                                    title={qText}
                                                                >
                                                                    • {qText}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* CONFIGURED RULES SUMMARY */}
                                            {formRules.length > 0 && (
                                                <div className="border-top pt-2 mt-2">
                                                    <small className="text-uppercase fw-bold text-muted font-10 d-block mb-1">
                                                        Flujos Activos ({formRules.length})
                                                    </small>
                                                    <div className="d-flex flex-column gap-1" style={{ maxHeight: "100px", overflowY: "auto" }}>
                                                        {formRules.map((rule) => (
                                                            <div
                                                                key={rule.id}
                                                                className="d-flex align-items-center justify-content-between font-11 bg-white p-1 rounded border"
                                                            >
                                                                <span className="text-truncate me-1" style={{ maxWidth: "120px" }}>
                                                                    {rule.conditions?.[0]?.value ? `"${rule.conditions[0].value}"` : "Todas"}
                                                                </span>

                                                                <div className="d-flex align-items-center gap-1">
                                                                    {rule.chat_status && (
                                                                        <span className="badge rounded-pill" style={{ backgroundColor: rule.chat_status.color || "#6c757d" }}>
                                                                            {rule.chat_status.name}
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        className="btn btn-xs btn-link text-primary p-0"
                                                                        title="Editar flujo"
                                                                        onClick={() => onOpenFormModal(form, rule)}
                                                                    >
                                                                        <i className="fa fa-pen"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 2: TODAS LAS REGLAS ACTIVAS */}
            {activeTab === "rules" && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border">
                            <div className="card-header bg-light p-3">
                                <h5 className="card-title my-0 font-15 fw-bold">
                                    Todas las Reglas de Automatización
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                {rules.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="mdi mdi-lightning-bolt-outline display-4 text-muted"></i>
                                        <h5 className="mt-3 font-16 fw-bold">No hay reglas de automatización configuradas</h5>
                                        <p className="text-muted font-13">
                                            Selecciona un formulario de la pestaña "Formularios" para crear tu primera regla.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-centered mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Formulario Meta</th>
                                                    <th>Condición (Respuesta Lead)</th>
                                                    <th>Temperatura (Chat)</th>
                                                    <th>Etiqueta</th>
                                                    <th>Estado Lead</th>
                                                    <th>Asesor Asignado</th>
                                                    <th className="text-end">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rules.map((rule) => {
                                                    const matchedForm = metaForms.find((f) => f.id === rule.form_id);
                                                    return (
                                                        <tr key={rule.id}>
                                                            <td>
                                                                <strong className="text-dark">{rule.form_name || rule.form_id}</strong>
                                                                <br />
                                                                <small className="text-muted">ID: {rule.form_id}</small>
                                                            </td>
                                                            <td>
                                                                {rule.conditions && rule.conditions.length > 0 ? (
                                                                    rule.conditions.map((c, i) => (
                                                                        <div key={i} className="badge bg-soft-secondary text-dark me-1 font-11">
                                                                            <code>{c.field_name}</code> = <b>"{c.value}"</b>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <span className="badge bg-soft-info text-info font-11">Todas las respuestas</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {rule.chat_status ? (
                                                                    <span className="badge rounded-pill font-11 px-2 py-1" style={{ backgroundColor: rule.chat_status.color || "#6c757d" }}>
                                                                        {rule.chat_status.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {rule.manage_status ? (
                                                                    <span className="badge bg-soft-primary text-primary rounded-pill font-11">
                                                                        {rule.manage_status.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {rule.status_ref ? (
                                                                    <span className="badge bg-soft-success text-success rounded-pill font-11">
                                                                        {rule.status_ref.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {rule.assigned ? (
                                                                    <span className="fw-semibold font-13">{rule.assigned.name}</span>
                                                                ) : (
                                                                    <span className="text-muted">Sin asignar</span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    className="btn btn-xs btn-soft-primary me-1"
                                                                    onClick={() => onOpenFormModal(matchedForm || { id: rule.form_id, name: rule.form_name }, rule)}
                                                                >
                                                                    <i className="fa fa-pen"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-xs btn-soft-danger"
                                                                    onClick={() => onDeleteRule(rule.id)}
                                                                >
                                                                    <i className="fa fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BUILDER */}
            <Modal
                modalRef={modalRef}
                title={
                    selectedForm
                        ? `${isEditingRule ? "Editar" : "Nuevo"} Flujo Automático: ${selectedForm.name || selectedForm.id}`
                        : "Configurador de Flujo Automático"
                }
                onSubmit={onSaveRule}
                size="lg"
            >
                {selectedForm && (
                    <div className="row g-3">
                        <div className="col-12 bg-light p-2 rounded border">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="my-0 text-dark fw-bold font-14">
                                        {selectedForm.name || `Formulario ${selectedForm.id}`}
                                    </h6>
                                    <small className="text-muted">Meta Form ID: {selectedForm.id}</small>
                                </div>
                                <span className="badge bg-primary text-white font-11 rounded-pill">
                                    {(selectedForm.questions || []).length} preguntas
                                </span>
                            </div>
                        </div>

                        {/* CONDICIONES */}
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="my-0 font-14 fw-bold text-dark">
                                    Condición (Si el cliente responde en Meta...)
                                </h6>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-soft-primary"
                                    onClick={addCondition}
                                >
                                    <i className="mdi mdi-plus me-1"></i> Agregar Condición
                                </button>
                            </div>

                            {conditions.length === 0 ? (
                                <div className="p-2 bg-light border rounded text-muted font-12">
                                    Sin condiciones: La regla aplicará a todas las respuestas recibidas.
                                </div>
                            ) : (
                                conditions.map((cond, idx) => {
                                    const formQs = selectedForm.questions || [];
                                    const matchedQ = formQs.find(
                                        (q) => (q.label || q.key || q.name) === cond.field_name
                                    );
                                    const availableOptions = matchedQ ? matchedQ.options || [] : [];

                                    return (
                                        <div key={idx} className="p-2 bg-light border rounded mb-2">
                                            <div className="row g-2 align-items-center">
                                                <div className="col-md-5">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <label className="font-11 text-muted fw-bold my-0">Pregunta del Formulario</label>
                                                        {formQs.length > 0 && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-xs p-0 text-decoration-none font-10"
                                                                onClick={() => updateCondition(idx, "isCustomQuestion", !cond.isCustomQuestion)}
                                                            >
                                                                {cond.isCustomQuestion ? "Elegir de lista" : "Escribir manual"}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {formQs.length > 0 && !cond.isCustomQuestion ? (
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={cond.field_name}
                                                            onChange={(e) => updateCondition(idx, "field_name", e.target.value)}
                                                        >
                                                            <option value="">-- Seleccionar Pregunta --</option>
                                                            {formQs.map((q, qi) => {
                                                                const qLabel = q.label || q.key || q.name || `Pregunta ${qi + 1}`;
                                                                return (
                                                                    <option key={qi} value={qLabel}>
                                                                        {qLabel}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Nombre o clave de la pregunta"
                                                            value={cond.field_name}
                                                            onChange={(e) => updateCondition(idx, "field_name", e.target.value)}
                                                        />
                                                    )}
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="font-11 text-muted fw-bold mb-1">Operador</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={cond.operator}
                                                        onChange={(e) => updateCondition(idx, "operator", e.target.value)}
                                                    >
                                                        <option value="equals">Es igual a (=)</option>
                                                        <option value="contains">Contiene</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="font-11 text-muted fw-bold mb-1">Respuesta Esperada</label>
                                                    {availableOptions.length > 0 ? (
                                                        <select
                                                            className="form-select form-select-sm fw-bold text-primary"
                                                            value={cond.value}
                                                            onChange={(e) => updateCondition(idx, "value", e.target.value)}
                                                        >
                                                            <option value="">-- Seleccionar Opción --</option>
                                                            {availableOptions.map((opt, oi) => (
                                                                <option key={oi} value={opt.value || opt.key}>
                                                                    {opt.value || opt.key}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Respuesta esperada (ej. si)"
                                                            value={cond.value}
                                                            onChange={(e) => updateCondition(idx, "value", e.target.value)}
                                                        />
                                                    )}
                                                </div>

                                                <div className="col-md-1 text-end mt-3">
                                                    <button
                                                        type="button"
                                                        className="btn btn-xs btn-soft-danger"
                                                        onClick={() => removeCondition(idx)}
                                                    >
                                                        <i className="mdi mdi-close"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* ACCIONES */}
                        <div className="col-12 border-top pt-3">
                            <h6 className="my-0 font-14 fw-bold text-dark mb-3">
                                Entonces Atalaya CRM asignará automáticamente:
                            </h6>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label font-13 fw-bold">
                                Temperatura (Estado de Chat)
                            </label>
                            <select
                                className="form-select form-select-sm fw-semibold"
                                value={chatStatusId}
                                onChange={(e) => setChatStatusId(e.target.value)}
                            >
                                <option value="">-- Sin cambio de Temperatura --</option>
                                {chatStatuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label font-13 fw-bold">
                                Etiqueta de Gestión (Sub-Estado)
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={manageStatusId}
                                onChange={(e) => setManageStatusId(e.target.value)}
                            >
                                <option value="">-- Sin cambio de Etiqueta --</option>
                                {manageStatuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6 mt-3">
                            <label className="form-label font-13 fw-bold">
                                Estado en Pipeline de Leads
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={statusId}
                                onChange={(e) => setStatusId(e.target.value)}
                            >
                                <option value="">-- Estado Estándar (Nuevo Lead) --</option>
                                {leadStatuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6 mt-3">
                            <label className="form-label font-13 fw-bold">
                                Auto-Asignar Asesor
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            >
                                <option value="">-- No auto-asignar --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.lastname || ""} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <Adminto {...properties} title="Formularios Meta">
            <MetaForms {...properties} />
        </Adminto>
    );
});
