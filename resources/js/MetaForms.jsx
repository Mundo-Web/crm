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
    lastSync: initialLastSync = null,
}) => {
    const [rules, setRules] = useState(initialRules);
    const [metaForms, setMetaForms] = useState(initialMetaForms);
    const [isSyncingForms, setIsSyncingForms] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("forms"); // "forms" | "rules"
    const [lastSync, setLastSync] = useState(initialLastSync);

    const modalRef = useRef();
    const treeModalRef = useRef();

    // Selected state for Modal
    const [selectedForm, setSelectedForm] = useState(null);
    const [selectedRule, setSelectedRule] = useState(null);
    const [isEditingRule, setIsEditingRule] = useState(false);

    // Rule Builder state (Simple)
    const [conditions, setConditions] = useState([]);
    const [chatStatusId, setChatStatusId] = useState("");
    const [manageStatusId, setManageStatusId] = useState("");
    const [statusId, setStatusId] = useState("");
    const [assignedTo, setAssignedTo] = useState("");

    // Tree Builder state
    const [ruleName, setRuleName] = useState("");
    const [treeData, setTreeData] = useState(null);

    // Sync Meta Forms (Limited to 1 sync per day)
    const isSyncAllowed = () => {
        if (!lastSync) return true;
        try {
            const syncDate = new Date(lastSync);
            const today = new Date();
            return (
                syncDate.getFullYear() !== today.getFullYear() ||
                syncDate.getMonth() !== today.getMonth() ||
                syncDate.getDate() !== today.getDate()
            );
        } catch (e) {
            return true;
        }
    };

    const syncMetaForms = async () => {
        if (!isSyncAllowed()) {
            Swal.fire({
                title: "Sincronización Limitada",
                text: "La sincronización directa con Meta solo está permitida 1 vez al día para prevenir bloqueos de cuenta. Tus formularios actuales ya están guardados en el CRM.",
                icon: "info",
            });
            return;
        }

        setIsSyncingForms(true);
        try {
            const { status, result } = await Fetch("/api/meta-form-rules/forms?force=1");
            const formsArray = result?.data || [];
            if (status && Array.isArray(formsArray)) {
                setMetaForms(formsArray);
                const nowIso = new Date().toISOString();
                setLastSync(nowIso);
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
            Swal.fire("Error", error?.message || "Error al conectar con la API de Meta", "error");
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

    // Open Tree Builder Modal
    const onOpenTreeModal = (formObj, ruleToEdit = null) => {
        setSelectedForm(formObj);
        if (ruleToEdit) {
            setSelectedRule(ruleToEdit);
            setRuleName(ruleToEdit.rule_name || `Flujo Árbol - ${formObj.name || formObj.id}`);
            setTreeData(ruleToEdit.tree || null);
        } else {
            setSelectedRule(null);
            setRuleName(`Flujo Árbol - ${formObj.name || formObj.id}`);
            setTreeData(null);
        }
        $(treeModalRef.current).modal("show");
    };

    const onSaveTree = async (e) => {
        if (e) e.preventDefault();
        if (!selectedForm) return;

        if (!treeData) {
            Swal.fire("Atención", "Debes configurar al menos una pregunta en el árbol", "warning");
            return;
        }

        const payload = {
            id: selectedRule ? selectedRule.id : undefined,
            form_id: selectedForm.id,
            form_name: selectedForm.name || `Formulario ${selectedForm.id}`,
            rule_name: ruleName || `Flujo Árbol - ${selectedForm.name}`,
            tree: treeData,
        };

        try {
            const { status, result } = await Fetch("/api/meta-form-rules/tree", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });

            if (status && result?.data) {
                const savedRule = result.data;
                Swal.fire({
                    title: "Árbol de Decisión Guardado",
                    text: "El flujo de preguntas fue configurado correctamente para este formulario",
                    icon: "success",
                    timer: 2000,
                });

                if (rules.some((r) => r.id === savedRule.id)) {
                    setRules((prev) => prev.map((r) => (r.id === savedRule.id ? savedRule : r)));
                } else {
                    setRules((prev) => [savedRule, ...prev]);
                }

                $(treeModalRef.current).modal("hide");
            } else {
                Swal.fire("Error", result?.message || "No se pudo guardar el árbol", "error");
            }
        } catch (err) {
            Swal.fire("Error", err?.message || "Error al guardar el árbol", "error");
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
                <div className="col-auto d-flex align-items-center gap-2">
                    {lastSync && !isSyncAllowed() && (
                        <span className="badge bg-soft-info text-info font-11 p-2 rounded-pill">
                            <i className="mdi mdi-clock-check me-1"></i>
                            Sincronizado hoy (1/1 al día)
                        </span>
                    )}
                    <button
                        className={`btn btn-sm ${isSyncAllowed() ? "btn-primary" : "btn-secondary"} rounded-pill font-13 px-3 fw-semibold`}
                        onClick={syncMetaForms}
                        disabled={isSyncingForms || !isSyncAllowed()}
                        title={!isSyncAllowed() ? "La sincronización se permite 1 vez al día" : ""}
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
                                <i className="mdi mdi-routes me-1"></i>
                                Flujos y Árboles ({rules.length})
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
                                        disabled={isSyncingForms || !isSyncAllowed()}
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
                            const treeRule = formRules.find((r) => r.tree);

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

                                            {/* PRIMARY ACTION BUTTONS */}
                                            <div className="d-flex flex-column gap-2">
                                                <button
                                                    className="btn btn-sm btn-success w-100 font-12 fw-bold shadow-sm"
                                                    style={{ borderRadius: "2.5rem", padding: "8px 14px" }}
                                                    onClick={() => onOpenTreeModal(form, treeRule)}
                                                >
                                                    <i className="mdi mdi-routes me-1"></i> {treeRule ? "Editar Árbol de Decisión" : "Crear Árbol de Decisión"}
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-outline-secondary w-100 font-11 rounded-pill"
                                                    onClick={() => onOpenFormModal(form)}
                                                >
                                                    <i className="mdi mdi-lightning-bolt me-1"></i> Regla Sencilla
                                                </button>
                                            </div>
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
                                                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
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
                                                        Flujos Configurados ({formRules.length})
                                                    </small>
                                                    <div className="d-flex flex-column gap-1" style={{ maxHeight: "100px", overflowY: "auto" }}>
                                                        {formRules.map((rule) => (
                                                            <div
                                                                key={rule.id}
                                                                className="d-flex align-items-center justify-content-between font-11 bg-white p-1 rounded border"
                                                            >
                                                                <span className="text-truncate me-1 fw-semibold" style={{ maxWidth: "140px" }}>
                                                                    {rule.tree ? `🌳 ${rule.rule_name || 'Árbol'}` : (rule.conditions?.[0]?.value ? `"${rule.conditions[0].value}"` : "Regla Plana")}
                                                                </span>

                                                                <div className="d-flex align-items-center gap-1">
                                                                    {rule.tree ? (
                                                                        <span className="badge bg-success rounded-pill font-10">Árbol</span>
                                                                    ) : rule.chat_status ? (
                                                                        <span className="badge rounded-pill" style={{ backgroundColor: rule.chat_status.color || "#6c757d" }}>
                                                                            {rule.chat_status.name}
                                                                        </span>
                                                                    ) : null}
                                                                    <button
                                                                        className="btn btn-xs btn-link text-primary p-0"
                                                                        title="Editar"
                                                                        onClick={() => rule.tree ? onOpenTreeModal(form, rule) : onOpenFormModal(form, rule)}
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
                                    Todas las Reglas y Árboles de Automatización
                                </h5>
                            </div>
                            <div className="card-body p-0">
                                {rules.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="mdi mdi-routes display-4 text-muted"></i>
                                        <h5 className="mt-3 font-16 fw-bold">No hay reglas o árboles configurados</h5>
                                        <p className="text-muted font-13">
                                            Selecciona un formulario de la pestaña "Formularios" para crear tu primer Árbol de Decisión.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-centered mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Formulario Meta</th>
                                                    <th>Tipo de Flujo</th>
                                                    <th>Detalle / Condición</th>
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
                                                                {rule.tree ? (
                                                                    <span className="badge bg-success font-11 rounded-pill">🌳 Árbol de Decisión</span>
                                                                ) : (
                                                                    <span className="badge bg-secondary font-11 rounded-pill">⚡ Regla Sencilla</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {rule.tree ? (
                                                                    <span className="fw-semibold text-dark font-12">
                                                                        {rule.rule_name || "Árbol de preguntas"}
                                                                    </span>
                                                                ) : rule.conditions && rule.conditions.length > 0 ? (
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
                                                                    onClick={() => rule.tree ? onOpenTreeModal(matchedForm || { id: rule.form_id, name: rule.form_name }, rule) : onOpenFormModal(matchedForm || { id: rule.form_id, name: rule.form_name }, rule)}
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

            {/* MODAL 1: ÁRBOL DE DECISIÓN VISUAL */}
            <Modal
                modalRef={treeModalRef}
                title={
                    selectedForm
                        ? `🌳 Árbol de Decisión: ${selectedForm.name || selectedForm.id}`
                        : "Constructor de Árbol de Decisión"
                }
                onSubmit={onSaveTree}
                size="xl"
            >
                {selectedForm && (
                    <div className="row g-3">
                        <div className="col-12 bg-light p-3 rounded border">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <label className="form-label font-12 fw-bold text-dark mb-1">Nombre del Flujo / Árbol</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm font-13 fw-semibold"
                                        placeholder="Ej. Flujo de Calificación de Clientes"
                                        value={ruleName}
                                        onChange={(e) => setRuleName(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6 text-md-end mt-2 mt-md-0">
                                    <span className="badge bg-primary text-white font-11 rounded-pill p-2">
                                        Formulario ID: {selectedForm.id} ({(selectedForm.questions || []).length} preguntas)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="alert alert-info font-12 my-2 py-2">
                                <i className="mdi mdi-information-outline me-1"></i>
                                <strong>¿Cómo funciona?</strong> Configura una pregunta raíz. Según la respuesta del cliente, puedes guiarlo a otra pregunta o asignar un resultado final (Estado, Asesor, Etiqueta).
                            </div>

                            <TreeNodeEditor
                                node={treeData}
                                questions={selectedForm.questions || []}
                                leadStatuses={leadStatuses}
                                chatStatuses={chatStatuses}
                                manageStatuses={manageStatuses}
                                users={users}
                                onChange={(newTree) => setTreeData(newTree)}
                                onDelete={() => setTreeData(null)}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 2: REGLA SENCILLA (LEGACY/SIMPLE) */}
            <Modal
                modalRef={modalRef}
                title={
                    selectedForm
                        ? `${isEditingRule ? "Editar" : "Nueva"} Regla Sencilla: ${selectedForm.name || selectedForm.id}`
                        : "Configurador de Regla Sencilla"
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

// RECURSIVE TREE NODE EDITOR
const TreeNodeEditor = ({
    node,
    questions = [],
    leadStatuses = [],
    chatStatuses = [],
    manageStatuses = [],
    users = [],
    onChange,
    onDelete,
    depth = 0,
}) => {
    if (!node) {
        return (
            <div className="card border border-dashed text-center p-4 my-2 bg-white rounded-3 shadow-sm">
                <i className="mdi mdi-routes display-4 text-primary mb-2"></i>
                <h6 className="fw-bold text-dark font-15">Árbol de Decisión Vacío</h6>
                <p className="text-muted font-12 mb-3">Comienza seleccionando la primera pregunta del formulario para evaluar.</p>
                <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill mx-auto font-12 px-3 fw-bold"
                    onClick={() => {
                        const firstQ = questions[0];
                        const qLabel = firstQ ? (firstQ.label || firstQ.key || firstQ.name) : "";
                        const qKey   = firstQ ? (firstQ.key || firstQ.name || qLabel) : "";
                        onChange({
                            question_key: qKey,
                            question_label: qLabel,
                            branches: [],
                        });
                    }}
                >
                    <i className="mdi mdi-plus me-1"></i> Seleccionar Pregunta Raíz
                </button>
            </div>
        );
    }

    const availableOpts = (() => {
        const matchedQ = questions.find((q) => (q.label || q.key || q.name) === node.question_label || q.key === node.question_key);
        return matchedQ?.options || [];
    })();

    const addBranch = () => {
        const newBranches = [...(node.branches || []), { answer: "", result: null, next: null }];
        onChange({ ...node, branches: newBranches });
    };

    const updateBranch = (index, updatedBranch) => {
        const newBranches = [...(node.branches || [])];
        newBranches[index] = updatedBranch;
        onChange({ ...node, branches: newBranches });
    };

    const removeBranch = (index) => {
        const newBranches = (node.branches || []).filter((_, i) => i !== index);
        onChange({ ...node, branches: newBranches });
    };

    return (
        <div className={`card border shadow-sm mb-3 ${depth > 0 ? "ms-3 border-start border-4 border-start-primary" : ""}`}>
            <div className="card-header bg-soft-primary p-2 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-primary font-10">Pregunta Nivel {depth + 1}</span>
                    <strong className="font-13 text-dark">Pregunta:</strong>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <select
                        className="form-select form-select-sm fw-semibold font-12"
                        style={{ minWidth: "260px" }}
                        value={node.question_label || node.question_key}
                        onChange={(e) => {
                            const selectedLabel = e.target.value;
                            const matchedQ = questions.find((q) => (q.label || q.key || q.name) === selectedLabel);
                            onChange({
                                ...node,
                                question_label: selectedLabel,
                                question_key: matchedQ?.key || matchedQ?.name || selectedLabel,
                            });
                        }}
                    >
                        <option value="">-- Seleccionar Pregunta --</option>
                        {questions.map((q, idx) => {
                            const label = q.label || q.key || q.name || `Pregunta ${idx + 1}`;
                            return (
                                <option key={idx} value={label}>
                                    {label}
                                </option>
                            );
                        })}
                    </select>

                    {onDelete && (
                        <button type="button" className="btn btn-xs btn-outline-danger" onClick={onDelete} title="Eliminar nodo">
                            <i className="mdi mdi-delete"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="card-body p-3 bg-light">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <small className="fw-bold text-uppercase text-muted font-11">
                        Respuestas / Ramas de decisión ({node.branches?.length || 0})
                    </small>
                    <button type="button" className="btn btn-xs btn-soft-success font-11 rounded-pill fw-bold" onClick={addBranch}>
                        <i className="mdi mdi-plus me-1"></i> Agregar Respuesta
                    </button>
                </div>

                {(node.branches || []).length === 0 ? (
                    <div className="text-muted font-12 italic py-2 text-center bg-white border rounded">
                        Haz clic en <strong>+ Agregar Respuesta</strong> para evaluar opciones para esta pregunta.
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {node.branches.map((branch, bIdx) => (
                            <div key={bIdx} className="p-3 bg-white border rounded shadow-sm">
                                <div className="row g-2 align-items-center mb-2">
                                    <div className="col-auto">
                                        <span className="badge bg-soft-info text-info font-11">Rama #{bIdx + 1}</span>
                                    </div>
                                    <div className="col">
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light font-11">Si responde:</span>
                                            {availableOpts.length > 0 ? (
                                                <select
                                                    className="form-select form-select-sm fw-bold text-primary"
                                                    value={branch.answer}
                                                    onChange={(e) => updateBranch(bIdx, { ...branch, answer: e.target.value })}
                                                >
                                                    <option value="">-- Seleccionar Opción --</option>
                                                    {availableOpts.map((opt, oIdx) => (
                                                        <option key={oIdx} value={opt.value || opt.key}>
                                                            {opt.value || opt.key}
                                                        </option>
                                                    ))}
                                                    <option value="*">* Cualquier otra respuesta (Default)</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm font-12 fw-bold text-primary"
                                                    placeholder="Respuesta esperada o *"
                                                    value={branch.answer}
                                                    onChange={(e) => updateBranch(bIdx, { ...branch, answer: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline-danger"
                                            onClick={() => removeBranch(bIdx)}
                                            title="Eliminar respuesta"
                                        >
                                            <i className="mdi mdi-close"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* ACTION CHOICE */}
                                <div className="border-top pt-2 mt-2">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="font-11 fw-bold text-dark">
                                            Acción para "{branch.answer || '...'}" :
                                        </span>
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                type="button"
                                                className={`btn btn-xs ${branch.next ? "btn-primary" : "btn-outline-primary"}`}
                                                onClick={() => {
                                                    const firstQ = questions[0];
                                                    updateBranch(bIdx, {
                                                        ...branch,
                                                        result: null,
                                                        next: branch.next || {
                                                            question_key: firstQ?.key || firstQ?.name || "",
                                                            question_label: firstQ?.label || firstQ?.key || "",
                                                            branches: [],
                                                        },
                                                    });
                                                }}
                                            >
                                                <i className="mdi mdi-routes me-1"></i> Siguiente Pregunta
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-xs ${branch.result ? "btn-success" : "btn-outline-success"}`}
                                                onClick={() => {
                                                    updateBranch(bIdx, {
                                                        ...branch,
                                                        next: null,
                                                        result: branch.result || {
                                                            status_id: "",
                                                            chat_status_id: "",
                                                            manage_status_id: "",
                                                            assigned_to: "",
                                                            tag: "",
                                                        },
                                                    });
                                                }}
                                            >
                                                <i className="mdi mdi-flag-checkered me-1"></i> Asignar Resultado Final
                                            </button>
                                        </div>
                                    </div>

                                    {/* SUB-NODE */}
                                    {branch.next && (
                                        <div className="mt-2">
                                            <TreeNodeEditor
                                                node={branch.next}
                                                questions={questions}
                                                leadStatuses={leadStatuses}
                                                chatStatuses={chatStatuses}
                                                manageStatuses={manageStatuses}
                                                users={users}
                                                onChange={(updatedSubNode) => updateBranch(bIdx, { ...branch, next: updatedSubNode })}
                                                onDelete={() => updateBranch(bIdx, { ...branch, next: null })}
                                                depth={depth + 1}
                                            />
                                        </div>
                                    )}

                                    {/* RESULT LEAF */}
                                    {branch.result && (
                                        <div className="p-2 bg-soft-success border border-success rounded mt-2">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <span className="badge bg-success font-10">🏁 Resultado Final</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-xs text-danger p-0 font-11"
                                                    onClick={() => updateBranch(bIdx, { ...branch, result: null })}
                                                >
                                                    Quitar resultado
                                                </button>
                                            </div>
                                            <div className="row g-2">
                                                <div className="col-md-3">
                                                    <label className="font-10 text-muted fw-bold mb-1">Estado Lead</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={branch.result.status_id || ""}
                                                        onChange={(e) =>
                                                            updateBranch(bIdx, {
                                                                ...branch,
                                                                result: { ...branch.result, status_id: e.target.value },
                                                            })
                                                        }
                                                    >
                                                        <option value="">-- Sin cambio --</option>
                                                        {leadStatuses.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="font-10 text-muted fw-bold mb-1">Temperatura Chat</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={branch.result.chat_status_id || ""}
                                                        onChange={(e) =>
                                                            updateBranch(bIdx, {
                                                                ...branch,
                                                                result: { ...branch.result, chat_status_id: e.target.value },
                                                            })
                                                        }
                                                    >
                                                        <option value="">-- Sin cambio --</option>
                                                        {chatStatuses.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="font-10 text-muted fw-bold mb-1">Asesor Asignado</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={branch.result.assigned_to || ""}
                                                        onChange={(e) =>
                                                            updateBranch(bIdx, {
                                                                ...branch,
                                                                result: { ...branch.result, assigned_to: e.target.value },
                                                            })
                                                        }
                                                    >
                                                        <option value="">-- Sin asignar --</option>
                                                        {users.map((u) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name} {u.lastname || ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="font-10 text-muted fw-bold mb-1">Etiqueta (#Tag)</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="ej. vip-caliente"
                                                        value={branch.result.tag || ""}
                                                        onChange={(e) =>
                                                            updateBranch(bIdx, {
                                                                ...branch,
                                                                result: { ...branch.result, tag: e.target.value },
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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

