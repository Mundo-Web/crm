import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import CreateReactScript from "./Utils/CreateReactScript.jsx";
import Adminto from "./components/Adminto.jsx";
import QuillFormGroup from "./components/form/QuillFormGroup.jsx";
import Swal from "sweetalert2";
import { Fetch } from "sode-extend-react";

import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

// Utility to clean HTML for display
const stripHtml = (html) => {
    if (!html) return "";
    try {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n");
        return (tmp.textContent || tmp.innerText || "").trim();
    } catch (e) {
        return html.replace(/<[^>]*>?/gm, "").trim();
    }
};

// Custom Searchable Dropdown Select Component
const SearchableSelect = ({ options = [], value, onChange, placeholder = "Buscar...", className = "" }) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter((opt) => String(opt.label).toLowerCase().includes(q));
    }, [options, search]);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`position-relative ${className}`} ref={containerRef}>
            <button
                type="button"
                className="form-select form-select-sm text-start d-flex justify-content-between align-items-center bg-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
            </button>

            {isOpen && (
                <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-sm mt-1 p-2" style={{ zIndex: 1050, maxHeight: 220, overflowY: "auto" }}>
                    <div className="input-group input-group-sm mb-2">
                        <span className="input-group-text bg-light border-end-0">
                            <i className="mdi mdi-magnify"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control form-control-sm border-start-0"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="list-group list-group-flush font-12">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`list-group-item list-group-item-action py-1 px-2 text-truncate border-0 font-11 rounded mb-1 ${
                                        String(opt.value) === String(value) ? "bg-primary text-white fw-bold" : "text-dark"
                                    }`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))
                        ) : (
                            <div className="text-muted font-11 p-2 text-center">Sin resultados</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- CUSTOM REACT FLOW NODES ---

const getTriggerLabel = (type) => {
    switch (type) {
        case "meta_lead_ads": case "fb_form": case "ig_form": case "meta_form": return "Formularios de Meta (Lead Ads)";
        case "click_to_whatsapp": case "ctwa": return "Click to WhatsApp (CTWA)";
        case "messenger": case "fb_messenger": return "Facebook Messenger";
        case "instagram_dm": case "ig_dm": return "Instagram Direct (DM)";
        case "whatsapp": case "wa_direct": return "WhatsApp API / Directo";
        case "web_form": return "Formulario Sitio Web";
        case "status_change": return "Al Cambiar Estado de Gestión";
        default: return "Todos los Canales";
    }
};

const getFieldHumanLabel = (key) => {
    switch (key) {
        case "contact_name": case "full_name": return "Nombre Completo";
        case "contact_email": case "email": return "Correo Electrónico";
        case "contact_phone": case "phone": return "Teléfono / Celular";
        case "contact_position": return "Cargo / Puesto";
        case "name": return "Nombre de Empresa";
        case "ruc": return "RUC / ID Fiscal";
        case "sector_id": return "Rubro de Negocio";
        case "subsector": return "Subrubro";
        case "workers": return "N° de Trabajadores";
        case "web_url": return "Sitio Web";
        case "notes": return "Notas Adicionales";
        case "custom_username": return "Nombre de Usuario";
        default: return key || "Dato";
    }
};

// 1. TRIGGER NODE (Start)
const TriggerNode = ({ data }) => {
    const label = getTriggerLabel(data.triggerType || data.triggerLabel);
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 220, borderTop: "3px solid #3b82f6" }}>
            <div className="card-body p-2 font-12 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-primary font-11">
                        <i className="mdi mdi-flash me-1"></i> INICIO
                    </span>
                    <span className="badge bg-soft-primary text-primary font-10">START</span>
                </div>
                <div className="fw-bold text-dark font-12 text-truncate">{data.title || "Inicio del Flujo"}</div>
                <div className="text-muted font-11 mt-1 text-truncate">
                    Origen: <span className="fw-semibold text-dark">{label}</span>
                </div>
                {data.manage_status_name && (
                    <div className="font-10 text-success fw-bold text-truncate mt-1">
                        <i className="mdi mdi-tag-sync me-1"></i> Al Cambiar Estado: {data.manage_status_name}
                    </div>
                )}
                {data.campaign_name && (
                    <div className="font-10 text-muted text-truncate">
                        Campaña: {data.campaign_name}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="bg-primary" style={{ width: 8, height: 8 }} />
        </div>
    );
};

const getDecisionSummary = (data) => {
    const type = data.rule_type || "keyword";
    switch (type) {
        case "keyword":
            return `Respuesta contiene "${data.expected_value || "cotización"}"`;
        case "lead_missing":
            return `¿Falta ${getFieldHumanLabel(data.condition_field || "contact_email")} en Lead?`;
        case "lead_channel":
            return `¿Origen es "${getTriggerLabel(data.expected_value || "fb_form")}"?`;
        case "business_hours":
            return `¿Atención en Horario Laboral?`;
        case "temperature":
            return `¿Temperatura es "${data.expected_value || "caliente"}"?`;
        default:
            return data.title || "¿Cumple Condición?";
    }
};

// 2. DECISION / CONDITION NODE (Si / No split)
const DecisionNode = ({ data }) => {
    const summary = getDecisionSummary(data);
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 230, borderTop: "3px solid #ef4444" }}>
            <Handle type="target" position={Position.Top} className="bg-danger" style={{ width: 8, height: 8 }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold text-danger font-11 mb-1">
                    <i className="mdi mdi-vector-split me-1"></i> TOMA DE DECISIÓN
                </div>
                <div className="fw-bold text-dark font-12 text-truncate" title={summary}>
                    {summary}
                </div>
                <div className="d-flex justify-content-between mt-2 pt-1 border-top font-10 fw-bold">
                    <span className="text-success"><i className="mdi mdi-check me-1"></i> SÍ (Cumple)</span>
                    <span className="text-danger">NO (No cumple) <i className="mdi mdi-close ms-1"></i></span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} id="yes" className="bg-success" style={{ left: "25%", width: 10, height: 10 }} />
            <Handle type="source" position={Position.Bottom} id="no" className="bg-danger" style={{ left: "75%", width: 10, height: 10 }} />
        </div>
    );
};

// 3. MESSAGE NODE (With formatted text)
const MessageNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 210, borderTop: "3px solid #22c55e" }}>
            <Handle type="target" position={Position.Top} className="bg-success" style={{ width: 8, height: 8 }} />
            <div className="card-body p-2 font-12 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-success font-11">
                        <i className="mdi mdi-message-text me-1"></i> MENSAJE
                    </span>
                    {data.is_meta_template && (
                        <span className="badge bg-soft-primary text-primary font-10">META</span>
                    )}
                </div>
                <div className="text-dark font-11 text-truncate" style={{ maxWidth: 190 }}>
                    {stripHtml(data.content) || "Enviar mensaje..."}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="bg-success" style={{ width: 8, height: 8 }} />
        </div>
    );
};

// 4. DATA REQUEST NODE (Petición de datos limpia)
const DataRequestNode = ({ data }) => {
    const fieldLabel = getFieldHumanLabel(data.field_key);
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 210, borderTop: "3px solid #0284c7" }}>
            <Handle type="target" position={Position.Top} className="bg-info" style={{ width: 8, height: 8 }} />
            <div className="card-body p-2 font-12 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-info font-11">
                        <i className="mdi mdi-account-question me-1"></i> PETICIÓN DE DATO
                    </span>
                    {data.skip_if_exists && (
                        <i className="mdi mdi-flash text-warning font-12" title="Omite si ya existe en Lead"></i>
                    )}
                </div>
                <div className="fw-bold text-dark font-12 text-truncate">
                    {data.question_text || fieldLabel}
                </div>
                <small className="text-muted font-11 d-block text-truncate mt-1">
                    Solicitar: <span className="fw-semibold text-dark">{fieldLabel}</span>
                </small>
            </div>
            <Handle type="source" position={Position.Bottom} className="bg-info" style={{ width: 8, height: 8 }} />
        </div>
    );
};

// 5. STATUS / TEMPERATURE NODE
const StatusNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 200, borderTop: "3px solid #f59e0b" }}>
            <Handle type="target" position={Position.Top} className="bg-warning" style={{ width: 8, height: 8 }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold text-warning font-11 mb-1">
                    <i className="mdi mdi-tag-outline me-1"></i> ESTADO DE GESTIÓN
                </div>
                <div className="fw-bold text-dark font-12 text-truncate">
                    {data.manageStatusName || "Seleccionar Estado..."}
                </div>
                {data.temperature && (
                    <span className="badge bg-soft-warning text-dark font-10 mt-1">
                        Temp: {data.temperature}
                    </span>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="bg-warning" style={{ width: 8, height: 8 }} />
        </div>
    );
};

// 6. TRANSFER NODE
const TransferNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 200, borderTop: "3px solid #64748b" }}>
            <Handle type="target" position={Position.Top} className="bg-secondary" style={{ width: 8, height: 8 }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold text-secondary font-11 mb-1">
                    <i className="mdi mdi-account-arrow-right me-1"></i> ASIGNAR LEAD
                </div>
                <div className="fw-bold text-dark font-12 text-truncate">
                    {data.userName || "Rotación Automática"}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="bg-secondary" style={{ width: 8, height: 8 }} />
        </div>
    );
};

// 7. WAIT RESPONSE NODE (Pausar flujo hasta respuesta del cliente)
const WaitResponseNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 210, borderTop: "3px solid #8b5cf6" }}>
            <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, backgroundColor: "#8b5cf6" }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold font-11 mb-1" style={{ color: "#8b5cf6" }}>
                    <i className="mdi mdi-clock-outline me-1"></i> ESPERAR RESPUESTA
                </div>
                <div className="text-muted font-11">
                    Pausar hasta que el cliente escriba
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, backgroundColor: "#8b5cf6" }} />
        </div>
    );
};

// 8. TIMER / TIMEOUT NODE (Temporizador de respuesta con bifurcación)
const TimerNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 220, borderTop: "3px solid #d97706" }}>
            <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, backgroundColor: "#d97706" }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold font-11 mb-1" style={{ color: "#d97706" }}>
                    <i className="mdi mdi-timer-sand me-1"></i> TEMPORIZADOR
                </div>
                <div className="fw-bold text-dark font-12">
                    Esperar {data.timeout_value || 30} {data.timeout_unit || "minutos"}
                </div>
                <div className="d-flex justify-content-between mt-2 pt-1 border-top font-10 fw-bold">
                    <span className="text-success"><i className="mdi mdi-message-check me-1"></i> Respondió</span>
                    <span className="text-danger">Expiró <i className="mdi mdi-clock-alert ms-1"></i></span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} id="replied" className="bg-success" style={{ left: "25%", width: 10, height: 10 }} />
            <Handle type="source" position={Position.Bottom} id="timeout" className="bg-danger" style={{ left: "75%", width: 10, height: 10 }} />
        </div>
    );
};

// 9. SUB-FLOW NODE (Conectar / Encadenar con otro flujo)
const SubFlowNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 210, borderTop: "3px solid #0891b2" }}>
            <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, backgroundColor: "#0891b2" }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold font-11 mb-1" style={{ color: "#0891b2" }}>
                    <i className="mdi mdi-routes me-1"></i> SUBFLUJO ENLAZADO
                </div>
                <div className="fw-bold text-dark font-12 text-truncate">
                    {data.target_flow_name || "Seleccionar Flujo..."}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, backgroundColor: "#0891b2" }} />
        </div>
    );
};

// 10. TASK / ACTIVITY CREATION NODE
const TaskNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 230, borderTop: "3px solid #7c3aed" }}>
            <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, backgroundColor: "#7c3aed" }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold font-11 mb-1" style={{ color: "#7c3aed" }}>
                    <i className="mdi mdi-hexagon-multiple me-1"></i> ASIGNAR PROCESO
                </div>
                <div className="fw-bold text-dark font-12 text-truncate">
                    {data.process_name || "Proceso del CRM"}
                </div>
                {data.status_name && (
                    <div className="font-10 text-muted mt-1 text-truncate">
                        Estado: <strong className="text-success">{data.status_name}</strong>
                    </div>
                )}
                {data.assigned_name && (
                    <div className="font-10 text-muted text-truncate">
                        Asesor: <strong>{data.assigned_name}</strong>
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, backgroundColor: "#7c3aed" }} />
        </div>
    );
};

// 11. END NODE (Fin del Flujo)
const EndNode = ({ data }) => {
    return (
        <div className="card shadow-sm m-0 rounded-3 border" style={{ minWidth: 180, borderTop: "3px solid #ef4444" }}>
            <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, backgroundColor: "#ef4444" }} />
            <div className="card-body p-2 font-12 bg-white text-center">
                <div className="fw-bold font-11 mb-1 text-danger">
                    <i className="mdi mdi-stop-circle me-1"></i> FIN DEL FLUJO
                </div>
                <div className="fw-bold text-dark font-11 text-truncate">
                    {data.title || "Flujo Completado"}
                </div>
                <span className="badge bg-soft-danger text-danger font-10 mt-1">END</span>
            </div>
        </div>
    );
};

// MAIN FLOWS COMPONENT
const Flows = ({
    flows: initialFlows = [],
    leadStatuses = [],
    manageStatuses = [],
    chatStatuses = [],
    defaultMessages = [],
    users = [],
    metaForms = [],
    hasFormsIntegration = false,
    campaigns = [],
    adSets = [],
    ads = [],
    processes = [],
    noteTypes = [],
}) => {
    const [flows, setFlows] = useState(initialFlows);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTrigger, setFilterTrigger] = useState("all");
    const [selectedFlow, setSelectedFlow] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Flow Metadata
    const [flowName, setFlowName] = useState("");
    const [flowDescription, setFlowDescription] = useState("");
    const [flowStatus, setFlowStatus] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [triggerType, setTriggerType] = useState("all");
    const [triggerConditions, setTriggerConditions] = useState({
        meta_form_id: "",
        campaign_id: "",
        campaign_name: "",
        adset_id: "",
        adset_name: "",
        ad_id: "",
        ad_name: "",
        chat_status_id: "",
        manage_status_id: "",
        temperature: "",
    });

    // Filtered AdSets and Ads based on selection
    const filteredAdSets = useMemo(() => {
        if (!triggerConditions.campaign_id) return adSets;
        const selectedCamp = campaigns.find((c) => String(c.id) === String(triggerConditions.campaign_id));
        return adSets.filter(
            (as) =>
                String(as.campaign_id) === String(triggerConditions.campaign_id) ||
                (selectedCamp && selectedCamp.meta_id && String(as.campaign_id) === String(selectedCamp.meta_id))
        );
    }, [adSets, campaigns, triggerConditions.campaign_id]);

    const filteredAds = useMemo(() => {
        if (!triggerConditions.adset_id) return ads;
        const selectedAdSet = adSets.find((as) => String(as.id) === String(triggerConditions.adset_id));
        return ads.filter(
            (a) =>
                String(a.ad_set_id) === String(triggerConditions.adset_id) ||
                (selectedAdSet && selectedAdSet.meta_id && String(a.ad_set_id) === String(selectedAdSet.meta_id))
        );
    }, [ads, adSets, triggerConditions.adset_id]);

    // ReactFlow States
    const nodeTypes = useMemo(() => ({
        TRIGGER: TriggerNode,
        DECISION: DecisionNode,
        MENSAJE: MessageNode,
        PETICION_DATOS: DataRequestNode,
        ESTADO: StatusNode,
        TRANSFERIR: TransferNode,
        ESPERAR_RESPUESTA: WaitResponseNode,
        TEMPORIZADOR: TimerNode,
        SUBFLUJO: SubFlowNode,
        CREAR_TAREA: TaskNode,
        END: EndNode,
    }), []);

    // Edge deletion handler on click
    const onEdgeClick = (event, edge) => {
        event.stopPropagation();
        Swal.fire({
            title: "¿Eliminar conexión?",
            text: "Se eliminará la línea de conexión entre estos dos bloques.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar línea",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280"
        }).then((res) => {
            if (res.isConfirmed) {
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
            }
        });
    };

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    const designerModalRef = useRef();
    const quillRef = useRef();

    // Default template nodes for new flows
    const createInitialFlowchart = (tType = "all") => {
        const initialNodes = [
            {
                id: "node_trigger",
                type: "TRIGGER",
                position: { x: 280, y: 30 },
                data: {
                    title: "Inicio del Flujo",
                    triggerLabel: tType === "click_to_whatsapp" ? "Click to WhatsApp" : tType === "meta_form" ? "Formulario Meta" : "General",
                },
            },
            {
                id: "node_decision_1",
                type: "DECISION",
                position: { x: 250, y: 150 },
                data: {
                    title: "¿Cliente Caliente?",
                    condition_field: "temperature",
                    operator: "equals",
                    expected_value: "caliente",
                },
            },
            {
                id: "node_msg_yes",
                type: "MENSAJE",
                position: { x: 80, y: 320 },
                data: {
                    title: "Mensaje Asesor VIP",
                    content: "¡Hola! Un asesor prioritario te atenderá inmediatamente.",
                },
            },
            {
                id: "node_ask_no",
                type: "PETICION_DATOS",
                position: { x: 420, y: 320 },
                data: {
                    title: "Solicitar Datos",
                    question_text: "Por favor, cuéntanos tu nombre completo y correo:",
                    field_key: "full_name",
                },
            },
        ];

        const initialEdges = [
            {
                id: "edge_t_d",
                source: "node_trigger",
                target: "node_decision_1",
                animated: true,
                style: { stroke: "#3b82f6", strokeWidth: 2 },
            },
            {
                id: "edge_d_yes",
                source: "node_decision_1",
                sourceHandle: "yes",
                target: "node_msg_yes",
                label: "SÍ",
                labelStyle: { fill: "#10b981", fontWeight: 700 },
                style: { stroke: "#10b981", strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
            },
            {
                id: "edge_d_no",
                source: "node_decision_1",
                sourceHandle: "no",
                target: "node_ask_no",
                label: "NO",
                labelStyle: { fill: "#ef4444", fontWeight: 700 },
                style: { stroke: "#ef4444", strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" },
            },
        ];

        return { initialNodes, initialEdges };
    };

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges]
    );

    // Sync trigger node data live on canvas when trigger properties change
    useEffect(() => {
        const label = getTriggerLabel(triggerType);
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === "node_trigger" || n.type === "TRIGGER") {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            triggerLabel: label,
                            temperature: triggerConditions.temperature,
                            metaFormId: triggerConditions.meta_form_id,
                        },
                    };
                }
                return n;
            })
        );
    }, [triggerType, triggerConditions, setNodes]);

    // Open Modal for creation
    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedFlow(null);
        setFlowName("");
        setFlowDescription("");
        setFlowStatus(false);
        setTriggerType("all");
        setTriggerConditions({
            meta_form_id: "",
            chat_status_id: "",
            manage_status_id: "",
            temperature: "",
        });

        const { initialNodes, initialEdges } = createInitialFlowchart("all");
        setNodes(initialNodes);
        setEdges(initialEdges);
        setSelectedNodeId("node_decision_1");

        $(designerModalRef.current).modal("show");
    };

    // Open Modal for editing existing flow
    const openEditModal = (flow) => {
        setIsEditing(true);
        setSelectedFlow(flow);
        setFlowName(flow.name || "");
        setFlowDescription(flow.description || "");
        setFlowStatus(Boolean(Number(flow.status)));
        setTriggerType(flow.trigger_type || "all");
        setTriggerConditions(flow.trigger_conditions || {
            meta_form_id: "",
            chat_status_id: "",
            manage_status_id: "",
            temperature: "",
        });

        const treeData = flow.tree || {};
        if (treeData.nodes && treeData.nodes.length > 0) {
            setNodes(treeData.nodes);
            setEdges(treeData.edges || []);
        } else {
            const { initialNodes, initialEdges } = createInitialFlowchart(flow.trigger_type);
            setNodes(initialNodes);
            setEdges(initialEdges);
        }

        setSelectedNodeId(null);
        $(designerModalRef.current).modal("show");
    };

    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const type = event.dataTransfer.getData("application/reactflow");
            if (!type) return;

            if (reactFlowInstance) {
                const position = reactFlowInstance.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });
                addVisualNode(type, position);
            }
        },
        [reactFlowInstance, nodes]
    );

    // Add a new Node to Visual Diagram
    const addVisualNode = (type, customPosition = null) => {
        const id = "node_" + Date.now();
        const offsetX = 200 + (nodes.length % 3) * 60;
        const offsetY = 180 + nodes.length * 40;

        let newNode = {
            id,
            type,
            position: customPosition || { x: offsetX, y: offsetY },
            data: { title: "Nuevo Bloque" },
        };

        switch (type) {
            case "DECISION":
                newNode.data = {
                    title: "Evaluación de Decisión",
                    rule_type: "keyword",
                    expected_value: "cotización",
                    condition_field: "contact_email",
                };
                break;
            case "MENSAJE":
                newNode.data = {
                    title: "Enviar Mensaje",
                    content: "Escribe tu mensaje aquí...",
                    is_meta_template: false,
                };
                break;
            case "PETICION_DATOS":
                newNode.data = {
                    title: "Petición de Datos",
                    question_text: "¿Podrías indicarnos tu correo electrónico?",
                    field_key: "contact_email",
                    skip_if_exists: true,
                };
                break;
            case "ESTADO":
                newNode.data = {
                    title: "Cambiar Estado",
                    manage_status_id: "",
                    temperature: "",
                };
                break;
            case "TRANSFERIR":
                newNode.data = {
                    title: "Asignar Lead",
                    assigned_to: "",
                };
                break;
            case "ESPERAR_RESPUESTA":
                newNode.data = {
                    title: "Esperar Respuesta del Cliente",
                    save_reply_key: "last_response",
                };
                break;
            case "TEMPORIZADOR":
                newNode.data = {
                    title: "Temporizador de Respuesta",
                    timeout_value: 30,
                    timeout_unit: "minutos",
                };
                break;
            case "SUBFLUJO":
                newNode.data = {
                    title: "Conectar con otro Flujo",
                    target_flow_id: "",
                    target_flow_name: "",
                };
                break;
            case "CREAR_TAREA":
                newNode.data = {
                    title: "Crear Tarea / Actividad",
                    task_title: "Llamar a prospecto de Meta Ads",
                    task_type: "Llamada",
                    assigned_to: "lead_owner",
                    due_offset: "1_day",
                };
                break;
            case "END":
                newNode.data = {
                    title: "Fin del Flujo",
                };
                break;
            default:
                break;
        }

        setNodes((nds) => nds.concat(newNode));
        setSelectedNodeId(id);
    };

    // Selected node data reference
    const selectedNode = useMemo(() => {
        return nodes.find((n) => n.id === selectedNodeId);
    }, [nodes, selectedNodeId]);

    // Update selected node data
    const updateSelectedNodeData = (fields) => {
        if (!selectedNodeId) return;
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === selectedNodeId) {
                    return {
                        ...n,
                        data: { ...n.data, ...fields },
                    };
                }
                return n;
            })
        );
    };

    // Flow Simulator State & Logic
    const [showSimulator, setShowSimulator] = useState(false);
    const [simLogs, setSimLogs] = useState([]);
    const [simMessages, setSimMessages] = useState([]);
    const [activeSimNodeId, setActiveSimNodeId] = useState(null);
    const [userInputText, setUserInputText] = useState("");
    const [simCountdown, setSimCountdown] = useState(null);

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const simTimeoutRef = useRef(null);
    const simIntervalRef = useRef(null);

    const clearSimTimeout = () => {
        if (simTimeoutRef.current) {
            clearTimeout(simTimeoutRef.current);
            simTimeoutRef.current = null;
        }
        if (simIntervalRef.current) {
            clearInterval(simIntervalRef.current);
            simIntervalRef.current = null;
        }
        setSimCountdown(null);
    };

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    // Canvas node glow highlight when active in simulation
    useEffect(() => {
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                style: {
                    ...n.style,
                    boxShadow: activeSimNodeId && String(n.id) === String(activeSimNodeId)
                        ? "0 0 0 3px #a855f7, 0 0 18px rgba(168, 85, 247, 0.7)"
                        : undefined,
                    transition: "all 0.3s ease",
                },
            }))
        );
    }, [activeSimNodeId]);

    const handleStartSimulation = () => {
        clearSimTimeout();
        setSimLogs([]);
        setSimMessages([]);
        const triggerNode = nodesRef.current.find((n) => n.type === "TRIGGER") || nodesRef.current[0];
        if (!triggerNode) {
            Swal.fire("Sin disparador", "Debes tener al menos un nodo en el lienzo para simular.", "info");
            return;
        }
        setActiveSimNodeId(triggerNode.id);
        const tLog = `[${new Date().toLocaleTimeString()}] Avanzando desde Disparador Inicial...`;
        setSimLogs([tLog]);
        executeNextSimStep(triggerNode.id, null);
    };

    const handleResetSimulation = () => {
        clearSimTimeout();
        setSimLogs([]);
        setSimMessages([]);
        setActiveSimNodeId(null);
        setUserInputText("");
    };

    const executeNextSimStep = (currentNodeId, userResponseText = null) => {
        setSimMessages((prev) => prev.map((m) => ({ ...m, isTimerPrompt: false })));
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;

        const currentNode = currentNodes.find((n) => String(n.id) === String(currentNodeId));
        if (!currentNode) {
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ Nodo finalizado o no encontrado (${currentNodeId})`]);
            return;
        }

        setActiveSimNodeId(currentNode.id);

        // Filter valid outgoing edges whose target node actually exists in nodes!
        const outgoingEdges = currentEdges.filter(
            (e) => String(e.source) === String(currentNodeId) &&
            currentNodes.some((n) => String(n.id) === String(e.target))
        );

        if (currentNode.type === "TRIGGER") {
            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Avanzando desde Disparador Inicial...`]);
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 600);
            } else {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Disparador no conectado a ningún bloque.`]);
            }
        } else if (currentNode.type === "MENSAJE") {
            const msgContent = currentNode.data.content || currentNode.data.title || "¡Hola! Gracias por escribir a Atalaya CRM.";
            setSimMessages((prev) => [...prev, { sender: "bot", text: msgContent }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] MENSAJE enviado: "${msgContent.substring(0, 45)}"`]);

            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 700);
            } else {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Fin del flujo alcanzado.`]);
            }
        } else if (currentNode.type === "ESPERAR_RESPUESTA") {
            const nextEdge = outgoingEdges[0];
            const targetNode = nextEdge ? nodesRef.current.find((n) => String(n.id) === String(nextEdge.target)) : null;

            if (targetNode && targetNode.type === "TEMPORIZADOR") {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ESPERAR RESPUESTA: Conectado a Temporizador. Pasando al temporizador...`]);
                setTimeout(() => executeNextSimStep(targetNode.id, userResponseText), 400);
                return;
            }

            if (userResponseText) {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Respuesta recibida del cliente. Avanzando al siguiente bloque...`]);
                if (nextEdge) {
                    setTimeout(() => executeNextSimStep(nextEdge.target, null), 600);
                } else {
                    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Fin del flujo tras recibir respuesta.`]);
                }
                return;
            }
            setSimMessages((prev) => [...prev, { sender: "system", text: "Pausa: Esperando respuesta del cliente..." }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Pausa activa. Escribe una respuesta abajo en el chat para continuar.`]);
            return;
        } else if (currentNode.type === "TEMPORIZADOR") {
            clearSimTimeout();
            const val = Number(currentNode.data.timeout_value) || 1;
            const unit = currentNode.data.timeout_unit || "minutos";
            const timeoutEdge = outgoingEdges.find((e) => e.sourceHandle === "timeout" || String(e.label).toLowerCase().includes("expir") || String(e.sourceHandle).toLowerCase().includes("timeout")) || outgoingEdges[1] || outgoingEdges[0];
            const repliedEdge = outgoingEdges.find((e) => e.sourceHandle === "replied" || String(e.label).toLowerCase().includes("respondi")) || outgoingEdges[0];

            if (userResponseText === "timeout" || userResponseText === "expirado") {
                setSimMessages((prev) => [...prev, { sender: "system", text: `⏰ Temporizador Expirado (${val} ${unit}): Sin respuesta del cliente.` }]);
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ⏰ Temporizador expirado -> Avanzando por la opción 'Expiró'`]);
                if (timeoutEdge) {
                    setTimeout(() => executeNextSimStep(timeoutEdge.target, null), 600);
                } else {
                    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Opción 'Expiró' no conectada a ningún bloque.`]);
                }
                return;
            } else if (userResponseText && userResponseText !== "timeout") {
                setSimMessages((prev) => [...prev, { sender: "system", text: `💬 Cliente respondió a tiempo durante el temporizador (${val} ${unit}).` }]);
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Cliente respondió -> Avanzando por la opción 'Respondió'`]);
                if (repliedEdge) {
                    setTimeout(() => executeNextSimStep(repliedEdge.target, userResponseText), 600);
                } else {
                    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Opción 'Respondió' no conectada a ningún bloque.`]);
                }
                return;
            }

            // Calculate duration in seconds based on unit
            let durationSec = val * 60;
            if (unit === "segundos") durationSec = val;
            else if (unit === "horas") durationSec = val * 3600;

            let remaining = durationSec;
            setSimCountdown(remaining);

            setSimMessages((prev) => [
                ...prev,
                {
                    sender: "system",
                    text: `⏱️ Temporizador activo: Esperando ${val} ${unit}. Escuchando en tiempo real...`,
                    isTimerPrompt: true,
                },
            ]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ⏱️ Temporizador en curso (${val} ${unit} / ${durationSec}s). Conteo escuchando en tiempo real...`]);

            simIntervalRef.current = setInterval(() => {
                remaining -= 1;
                if (remaining <= 0) {
                    clearSimTimeout();
                    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ⏰ ¡Tiempo cumplido! (${val} ${unit} transcurridos sin respuesta).`]);
                    executeNextSimStep(currentNode.id, "timeout");
                } else {
                    setSimCountdown(remaining);
                }
            }, 1000);

            return;
        } else if (currentNode.type === "PETICION_DATOS") {
            const promptMsg = currentNode.data.question_text || currentNode.data.prompt_message;
            if (promptMsg) {
                setSimMessages((prev) => [...prev, { sender: "bot", text: promptMsg }]);
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] PETICION_DATOS: "${promptMsg}"`]);
            } else {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] PETICION_DATOS (Sin pregunta extra): Aguardando respuesta para guardar en ${getFieldHumanLabel(currentNode.data.field_key)}...`]);
            }
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] En espera de respuesta del cliente...`]);
        } else if (currentNode.type === "DECISION") {
            const expectedVal = (currentNode.data.expected_value || "").toLowerCase();
            const ruleType = currentNode.data.rule_type || "keyword";
            let decisionResult = false;

            if (ruleType === "keyword") {
                if (!userResponseText) {
                    const promptMsg = `Evaluación de Decisión: ¿Tu respuesta contiene la palabra "${expectedVal || "cotización"}"? Responde en el chat abajo...`;
                    setSimMessages((prev) => [...prev, { sender: "bot", text: promptMsg }]);
                    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] DECISION: Esperando respuesta para evaluar palabra clave "${expectedVal}"...`]);
                    return;
                }
                const textToEval = (userResponseText || "").toLowerCase();
                decisionResult = textToEval.includes(expectedVal);
                setSimLogs((prev) => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] DECISION ("${expectedVal}"): Coincidencia en "${textToEval}" -> Resultado: ${decisionResult ? "SÍ (COINCIDE)" : "NO"}`,
                ]);
            } else if (ruleType === "ai_evaluation") {
                if (!userResponseText) {
                    const promptMsg = `Evaluación por IA: Analizando si tu respuesta coincide con el criterio: "${expectedVal || "Intención real de compra o interés"}"... Responde abajo para evaluar.`;
                    setSimMessages((prev) => [...prev, { sender: "bot", text: promptMsg }]);
                    setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] DECISION (IA): Esperando respuesta para procesar con Inteligencia Artificial...`]);
                    return;
                }
                const textToEval = (userResponseText || "").toLowerCase();
                const positiveKeywords = ["sí", "si", "claro", "deseo", "quiero", "interesad", "cotiz", "precio", "agendar", "comprar", "por favor", "me interesa", "bueno", "ok", "vamos"];
                decisionResult = positiveKeywords.some((kw) => textToEval.includes(kw));
                setSimLogs((prev) => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] DECISION IA ("${expectedVal || "Intención de compra"}"): Respuesta analizada: "${userResponseText}" ➔ Clasificación IA: ${decisionResult ? "SÍ (CUMPLE CRITERIO)" : "NO (NO CUMPLE)"}`,
                ]);
            } else {
                decisionResult = true;
                setSimLogs((prev) => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] DECISION (${ruleType}) -> Evaluado: SÍ`,
                ]);
            }

            const yesEdge = outgoingEdges.find((e) => e.sourceHandle === "yes" || String(e.label).toUpperCase().includes("SÍ") || String(e.label).toUpperCase().includes("SI")) || outgoingEdges[0];
            const noEdge = outgoingEdges.find((e) => e.sourceHandle === "no" || String(e.label).toUpperCase().includes("NO")) || outgoingEdges[1] || outgoingEdges[0];

            const targetEdge = decisionResult ? yesEdge : noEdge;
            if (targetEdge) {
                setTimeout(() => executeNextSimStep(targetEdge.target, userResponseText), 700);
            } else {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Fin de la rama de decisión.`]);
            }
        } else if (currentNode.type === "ESTADO") {
            const stName = currentNode.data.status_name || "Nuevo Estado";
            setSimMessages((prev) => [...prev, { sender: "system", text: `Estado del Lead cambiado a "${stName}"` }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ESTADO: Lead actualizado a ${stName}`]);
            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 600);
            }
        } else if (currentNode.type === "TRANSFERIR") {
            const mode = currentNode.data.assigned_name || "Asesor Comercial";
            setSimMessages((prev) => [...prev, { sender: "system", text: `Asignado a ${mode}` }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] TRANSFERIR: Asignado a ${mode}`]);
            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 600);
            }
        } else if (currentNode.type === "CREAR_TAREA") {
            const procName = currentNode.data.process_name || currentNode.data.task_title || "Proceso del CRM";
            setSimMessages((prev) => [...prev, { sender: "system", text: `Proceso registrado "${procName}"` }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] CREAR_TAREA: Proceso "${procName}" registrado`]);
            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 600);
            } else {
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Fin de la rama (Sin más conexiones).`]);
            }
        } else if (currentNode.type === "SUBFLUJO") {
            const targetName = currentNode.data.target_flow_name || "Subflujo";
            setSimMessages((prev) => [...prev, { sender: "system", text: `Ejecutando ${targetName}` }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] SUBFLUJO: Derivado a ${targetName}`]);
            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 600);
            }
        } else if (currentNode.type === "END") {
            const endTitle = currentNode.data.title || "Flujo Completado";
            setActiveSimNodeId(currentNode.id);
            setSimMessages((prev) => [...prev, { sender: "system", text: `FIN DEL FLUJO: "${endTitle}"` }]);
            setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] FIN DEL FLUJO: Ejecución completada exitosamente.`]);
            return;
        } else {
            const nextEdge = outgoingEdges[0];
            if (nextEdge) {
                setTimeout(() => executeNextSimStep(nextEdge.target, userResponseText), 600);
            } else {
                setActiveSimNodeId(currentNode.id);
                setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Fin del flujo (Sin más bloques conectados). La atención pasa a asesor manual.`]);
            }
        }
    };

    const handleSendSimUserMessage = () => {
        if (!userInputText.trim()) return;
        const userMsg = userInputText.trim();
        setUserInputText("");
        setSimMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
        setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] 📱 CLIENTE: Respondió "${userMsg}"`]);

        if (activeSimNodeId) {
            const currentNode = nodesRef.current.find((n) => String(n.id) === String(activeSimNodeId));
            const outgoingEdges = edgesRef.current.filter(
                (e) => String(e.source) === String(activeSimNodeId) &&
                nodesRef.current.some((n) => String(n.id) === String(e.target))
            );

            if (currentNode && (currentNode.type === "DECISION" || currentNode.type === "TEMPORIZADOR" || currentNode.type === "ESPERAR_RESPUESTA" || currentNode.type === "PETICION_DATOS")) {
                executeNextSimStep(activeSimNodeId, userMsg);
            } else if (outgoingEdges.length > 0) {
                executeNextSimStep(outgoingEdges[0].target, userMsg);
            }
        }
    };

    // Save Flow to API
    const handleSaveFlow = async (e) => {
        e.preventDefault();

        if (!flowName.trim()) {
            Swal.fire("Campo requerido", "Ingresa un nombre para el flujo", "warning");
            return;
        }

        const payload = {
            id: isEditing ? selectedFlow.id : undefined,
            name: flowName,
            description: flowDescription,
            trigger_type: triggerType,
            trigger_conditions: triggerConditions,
            tree: { nodes, edges },
            status: flowStatus ? 1 : 0,
        };

        try {
            const { status, result } = await Fetch("/api/flows", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (status) {
                const savedFlow = result?.data || result;

                Swal.fire({
                    title: "Flujo Guardado",
                    text: "El diagrama de toma de decisiones ha sido almacenado correctamente.",
                    icon: "success",
                    timer: 1500,
                }).then(() => {
                    location.reload();
                });

                if (savedFlow && savedFlow.id) {
                    if (isEditing) {
                        setFlows((prev) => prev.map((f) => (f.id === savedFlow.id ? savedFlow : f)));
                    } else {
                        setFlows((prev) => [savedFlow, ...prev]);
                    }
                }

                $(designerModalRef.current).modal("hide");
            } else {
                Swal.fire("Error", result?.message || "No se pudo guardar el flujo", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Error al conectar con el servidor", "error");
        }
    };

    // Toast mixin without dark backdrop overlay
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        backdrop: false,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });

    // Toggle Active Status
    const handleToggleStatus = async (flow) => {
        const currentBool = Boolean(Number(flow.status));
        const newBool = !currentBool;
        try {
            const { status } = await Fetch("/api/flows/status", {
                method: "PATCH",
                body: JSON.stringify({
                    id: flow.id,
                    status: newBool ? 1 : 0,
                }),
            });

            if (status) {
                setFlows((prev) =>
                    prev.map((f) => (f.id === flow.id ? { ...f, status: newBool ? 1 : 0 } : f))
                );

                Toast.fire({
                    icon: newBool ? "success" : "info",
                    title: newBool ? "Flujo Publicado" : "Flujo Despublicado (Borrador)",
                });
            }
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "No se pudo cambiar el estado del flujo",
            });
        }
    };

    // Delete Flow
    const handleDeleteFlow = async (flow) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar Flujo?",
            text: `¿Eliminar "${flow.name}"? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
        });

        if (confirm.isConfirmed) {
            try {
                const { status } = await Fetch(`/api/flows/${flow.id}`, {
                    method: "DELETE",
                });
                if (status) {
                    setFlows((prev) => prev.filter((f) => f.id !== flow.id));
                    Swal.fire("Eliminado", "Flujo eliminado", "success");
                }
            } catch (error) {
                Swal.fire("Error", "Error al eliminar", "error");
            }
        }
    };

    // Filter flows
    const filteredFlows = flows.filter((f) => {
        const matchesSearch =
            (f.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.description || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTrigger =
            filterTrigger === "all" || f.trigger_type === filterTrigger;
        return matchesSearch && matchesTrigger;
    });

    const getTriggerLabel = (type) => {
        switch (type) {
            case "click_to_whatsapp":
                return "Click to WhatsApp";
            case "meta_form":
                return "Formulario Meta";
            case "lead_status":
                return "Estado del Lead";
            case "chat_temperature":
                return "Temperatura del Chat";
            default:
                return "Todos los orígenes";
        }
    };

    return (
        <div className="container-fluid py-3">
            {/* Header Section */}
            <div className="row mb-3 align-items-center">
                <div className="col-md-6">
                    <h3 className="m-0 font-20 text-dark fw-bold">
                        <i className="mdi mdi-source-branch me-2 text-primary"></i>
                        Diseñador Visual de Flujos & Toma de Decisiones
                    </h3>
                    <p className="text-muted mb-0 font-13">
                        Crea diagramas de flujo interactivos con bifurcaciones de decisión (SÍ / NO) para WhatsApp, Meta Forms y atención al cliente.
                    </p>
                </div>
                <div className="col-md-6 text-md-end mt-2 mt-md-0">
                    <button
                        className="btn btn-primary waves-effect waves-light shadow-sm"
                        onClick={openCreateModal}
                    >
                        <i className="mdi mdi-plus-circle me-1"></i> Diseñar Nuevo Flujo
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card mb-3">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="mdi mdi-magnify text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 bg-light"
                                    placeholder="Buscar flujo por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-select bg-light"
                                value={filterTrigger}
                                onChange={(e) => setFilterTrigger(e.target.value)}
                            >
                                <option value="all">Todos los orígenes</option>
                                <option value="click_to_whatsapp">Click to WhatsApp</option>
                                <option value="meta_form">Formulario Meta</option>
                                <option value="lead_status">Estado del Lead</option>
                                <option value="chat_temperature">Temperatura del Chat</option>
                            </select>
                        </div>
                        <div className="col-md-2 text-end">
                            <span className="badge bg-soft-primary text-primary fs-6 py-2 px-3 w-100">
                                Total: {filteredFlows.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flows Grid */}
            {filteredFlows.length === 0 ? (
                <div className="card text-center py-5">
                    <div className="card-body">
                        <i className="mdi mdi-sitemap text-muted" style={{ fontSize: "48px" }}></i>
                        <h4 className="mt-3">No hay diagramas de flujo creados</h4>
                        <button className="btn btn-outline-primary mt-2" onClick={openCreateModal}>
                            <i className="mdi mdi-plus me-1"></i> Diseñar primer flujo visual
                        </button>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {filteredFlows.map((flow) => {
                        const nodeCount = flow.tree?.nodes?.length || 0;
                        return (
                            <div key={flow.id} className="col-lg-4 col-md-6 mb-3">
                                <div className="card h-100 shadow-sm border-soft hover-shadow">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <span className="badge bg-soft-primary text-primary">
                                                {getTriggerLabel(flow.trigger_type)}
                                            </span>
                                            <div className="d-flex align-items-center gap-1">
                                                <span className={`font-11 fw-semibold ${Boolean(Number(flow.status)) ? "text-success" : "text-muted"}`}>
                                                    {Boolean(Number(flow.status)) ? "Publicado" : "No Publicado"}
                                                </span>
                                                <div className="form-check form-switch m-0" title={Boolean(Number(flow.status)) ? "Flujo Publicado en Producción" : "Borrador (No Publicado)"}>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={Boolean(Number(flow.status))}
                                                        onChange={() => handleToggleStatus(flow)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <h4 className="card-title text-dark fw-bold mb-1 text-truncate">
                                            {flow.name}
                                        </h4>
                                        <p className="text-muted font-13 mb-3 flex-grow-1">
                                            {flow.description || "Sin descripción."}
                                        </p>

                                        <div className="bg-light p-2 rounded mb-3 font-12 d-flex justify-content-between">
                                            <span className="text-muted">Nodos en diagrama:</span>
                                            <span className="fw-bold text-primary">{nodeCount} bloques</span>
                                        </div>

                                        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                                            <button
                                                className="btn btn-sm btn-soft-primary"
                                                onClick={() => openEditModal(flow)}
                                            >
                                                <i className="mdi mdi-sitemap me-1"></i> Abrir Diagrama Visual
                                            </button>
                                            <button
                                                className="btn btn-sm btn-soft-danger"
                                                onClick={() => handleDeleteFlow(flow)}
                                            >
                                                <i className="mdi mdi-trash-can-outline me-1"></i> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FLOW DESIGNER MODAL */}
            <div className="modal fade" id="designerModal" tabIndex="-1" ref={designerModalRef} data-bs-backdrop="static">
                <div className="modal-dialog modal-fullscreen">
                    <div className="modal-content border-0">
                        {/* MODAL HEADER */}
                        <div className="modal-header bg-white border-bottom py-2 px-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3 flex-grow-1 me-3">
                                <span className="badge bg-primary font-12 px-2 py-1">
                                    <i className="mdi mdi-sitemap me-1"></i> Editor de Flujo Visual
                                </span>

                                {/* TITLE EDITABLE AREA */}
                                <div className="position-relative d-flex align-items-center" style={{ minWidth: "200px" }}>
                                    {editingTitle ? (
                                        <input
                                            type="text"
                                            autoFocus
                                            className="form-control form-control-sm font-14 fw-bold text-dark border-0 border-bottom border-primary rounded-0 shadow-none px-1 py-0 bg-white"
                                            value={flowName}
                                            onChange={(e) => setFlowName(e.target.value)}
                                            onBlur={() => setEditingTitle(false)}
                                            onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                                        />
                                    ) : (
                                        <div
                                            className="d-flex align-items-center gap-1 px-1 py-0 rounded cursor-pointer"
                                            style={{ cursor: "pointer", borderBottom: "1px dashed #cbd5e1" }}
                                            onClick={() => setEditingTitle(true)}
                                            title="Haz clic para editar el nombre"
                                        >
                                            <span className="font-14 fw-bold text-dark text-truncate">
                                                {flowName.trim() || "Nombre del Flujo..."}
                                            </span>
                                            <i className="mdi mdi-pencil-outline text-muted font-12 ms-1"></i>
                                        </div>
                                    )}
                                </div>

                                {/* SEPARATOR */}
                                <span className="text-muted opacity-50 font-14 d-none d-md-inline">|</span>

                                {/* DESCRIPTION EDITABLE AREA */}
                                <div className="position-relative d-flex align-items-center d-none d-md-flex" style={{ minWidth: "280px", maxWidth: "380px" }}>
                                    {editingDesc ? (
                                        <input
                                            type="text"
                                            autoFocus
                                            className="form-control form-control-sm font-13 text-secondary border-0 border-bottom border-primary rounded-0 shadow-none px-1 py-0 bg-white"
                                            placeholder="Descripción u objetivo del flujo..."
                                            value={flowDescription}
                                            onChange={(e) => setFlowDescription(e.target.value)}
                                            onBlur={() => setEditingDesc(false)}
                                            onKeyDown={(e) => e.key === "Enter" && setEditingDesc(false)}
                                        />
                                    ) : (
                                        <div
                                            className="d-flex align-items-center gap-1 px-1 py-0 rounded cursor-pointer text-truncate"
                                            style={{ cursor: "pointer", borderBottom: "1px dashed #cbd5e1" }}
                                            onClick={() => setEditingDesc(true)}
                                            title="Haz clic para editar la descripción"
                                        >
                                            <span className="font-13 text-muted text-truncate">
                                                {flowDescription.trim() || "Agregar descripción..."}
                                            </span>
                                            <i className="mdi mdi-pencil-outline text-muted font-12 ms-1"></i>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                {/* STATUS TOGGLE IN MODAL HEADER */}
                                <div className="d-flex align-items-center gap-2 me-2 border-end pe-2">
                                    <span className={`font-12 fw-semibold ${flowStatus ? "text-success" : "text-muted"}`}>
                                        <i className={`mdi ${flowStatus ? "mdi-check-circle text-success" : "mdi-circle-outline text-muted"} me-1`}></i>
                                        {flowStatus ? "Flujo Publicado" : "Borrador (No Publicado)"}
                                    </span>
                                    <div className="form-check form-switch m-0" title="Publicar / Despublicar Flujo">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={Boolean(flowStatus)}
                                            onChange={(e) => setFlowStatus(e.target.checked)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={`btn btn-sm ${showSimulator ? "btn-info" : "btn-outline-info"} fw-bold px-3 py-1 font-12`}
                                    onClick={() => setShowSimulator(!showSimulator)}
                                >
                                    <i className="mdi mdi-play-circle-outline me-1"></i> {showSimulator ? "Ocultar Simulador" : "Simular / Probar Flujo"}
                                </button>
                                <button className="btn btn-sm btn-primary fw-bold px-3 py-1 font-12" onClick={handleSaveFlow}>
                                    <i className="mdi mdi-check-circle me-1"></i> Guardar Diagrama
                                </button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                ></button>
                            </div>
                        </div>

                        <div className="modal-body p-0 d-flex overflow-hidden" style={{ height: "700px", maxHeight: "80vh" }}>
                            {/* LEFT SIDEBAR: PALETTE OF NODES */}
                            <div className="bg-light border-end p-3 overflow-auto d-flex flex-column" style={{ width: "250px", minWidth: "250px", height: "100%", zIndex: 10 }}>
                                <h6 className="fw-bold text-dark font-12 text-uppercase mb-3">
                                    <i className="mdi mdi-plus-box-multiple-outline text-primary me-1"></i> Bloques de Flujo
                                </h6>

                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-danger text-start font-12 fw-bold py-2"
                                        style={{ cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "DECISION")}
                                        onClick={() => addVisualNode("DECISION")}
                                    >
                                        <i className="mdi mdi-vector-split me-1 font-14"></i> Toma de Decisión (SI / NO)
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-success text-start font-12 fw-bold py-2"
                                        style={{ cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "MENSAJE")}
                                        onClick={() => addVisualNode("MENSAJE")}
                                    >
                                        <i className="mdi mdi-message-text me-1 font-14"></i> Enviar Mensaje / Plantilla
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-info text-start font-12 fw-bold py-2"
                                        style={{ cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "PETICION_DATOS")}
                                        onClick={() => addVisualNode("PETICION_DATOS")}
                                    >
                                        <i className="mdi mdi-account-question me-1 font-14"></i> Petición de Datos
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-warning text-start font-12 text-dark fw-bold py-2"
                                        style={{ cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "ESTADO")}
                                        onClick={() => addVisualNode("ESTADO")}
                                    >
                                        <i className="mdi mdi-tag-outline me-1 font-14"></i> Cambiar Estado / Temp.
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary text-start font-12 fw-bold py-2"
                                        style={{ cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "TRANSFERIR")}
                                        onClick={() => addVisualNode("TRANSFERIR")}
                                    >
                                        <i className="mdi mdi-account-arrow-right me-1 font-14"></i> Asignar / Transferir
                                    </button>
                                    <button
                                        className="btn btn-sm text-start font-12 fw-bold py-2"
                                        style={{ color: "#8b5cf6", borderColor: "#8b5cf6", cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "ESPERAR_RESPUESTA")}
                                        onClick={() => addVisualNode("ESPERAR_RESPUESTA")}
                                    >
                                        <i className="mdi mdi-clock-outline me-1 font-14"></i> Esperar Respuesta
                                    </button>
                                    <button
                                        className="btn btn-sm text-start font-12 fw-bold text-dark py-2"
                                        style={{ borderColor: "#d97706", backgroundColor: "#fffbe6", cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "TEMPORIZADOR")}
                                        onClick={() => addVisualNode("TEMPORIZADOR")}
                                    >
                                        <i className="mdi mdi-timer-sand text-warning me-1 font-14"></i> Temporizador / Límite
                                    </button>
                                    <button
                                        className="btn btn-sm text-start font-12 fw-bold py-2"
                                        style={{ color: "#0891b2", borderColor: "#0891b2", backgroundColor: "#ecfeff", cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "SUBFLUJO")}
                                        onClick={() => addVisualNode("SUBFLUJO")}
                                    >
                                        <i className="mdi mdi-routes me-1 font-14"></i> Conectar con otro Flujo
                                    </button>
                                    <button
                                        className="btn btn-sm text-start font-12 fw-bold py-2"
                                        style={{ color: "#7c3aed", borderColor: "#7c3aed", backgroundColor: "#f3e8ff", cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "CREAR_TAREA")}
                                        onClick={() => addVisualNode("CREAR_TAREA")}
                                    >
                                        <i className="mdi mdi-hexagon-multiple me-1 font-14"></i> Programar Proceso / Actividad
                                    </button>
                                    <button
                                        className="btn btn-sm text-start font-12 fw-bold py-2"
                                        style={{ color: "#ef4444", borderColor: "#ef4444", backgroundColor: "#fef2f2", cursor: "grab" }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "END")}
                                        onClick={() => addVisualNode("END")}
                                    >
                                        <i className="mdi mdi-stop-circle me-1 font-14"></i> Fin del Flujo (Completado)
                                    </button>
                                </div>

                                <div className="mt-auto pt-3 border-top text-center text-muted font-11">
                                    <i className="mdi mdi-drag-variant me-1"></i> Haz clic o arrastra los bloques
                                </div>
                            </div>

                            {/* CENTER: REACT FLOW CANVAS */}
                            <div className="flex-grow-1 bg-light position-relative" style={{ height: "100%" }} ref={reactFlowWrapper}>
                                <div className="position-absolute top-0 start-0 m-2" style={{ zIndex: 5 }}>
                                    <span className="badge bg-white text-muted border shadow-sm font-11 px-2 py-1">
                                        <i className="mdi mdi-hand-pointing-up text-primary me-1"></i> Haz clic o arrastra los bloques al lienzo
                                    </span>
                                </div>
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    onConnect={onConnect}
                                    onEdgeClick={onEdgeClick}
                                    nodeTypes={nodeTypes}
                                    onInit={setReactFlowInstance}
                                    onDrop={onDrop}
                                    onDragOver={onDragOver}
                                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                                    deleteKeyCode={["Backspace", "Delete"]}
                                    fitView
                                >
                                    <Background color="#cbd5e1" gap={16} size={1} />
                                    <Controls />
                                    <MiniMap nodeStrokeWidth={3} zoomable pannable />
                                </ReactFlow>
                            </div>

                            {/* RIGHT SIDEBAR: SELECTED NODE CONFIGURATION DRAWER */}
                            {selectedNode && (
                                <div className="bg-white border-start p-3 overflow-auto" style={{ width: "350px", minWidth: "350px", height: "100%", zIndex: 10 }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold text-dark font-14 m-0">
                                            <i className="mdi mdi-square-edit-outline text-primary me-1"></i> Configurar Bloque Seleccionado
                                        </h6>
                                        <button className="btn-close" onClick={() => setSelectedNodeId(null)}></button>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label font-12 fw-bold mb-1">Título del Bloque</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={selectedNode.data.title || ""}
                                            onChange={(e) => updateSelectedNodeData({ title: e.target.value })}
                                        />
                                    </div>

                                    {/* TRIGGER CONFIGURATION */}
                                    {selectedNode.type === "TRIGGER" && (
                                        <div className="bg-light p-2 rounded border mb-3">
                                            <h6 className="font-12 fw-bold text-primary mb-2">
                                                <i className="mdi mdi-flash me-1"></i> Disparador / Inicio del Flujo
                                            </h6>

                                            {/* 1. Origen / Canal */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Origen / Canal del Prospecto</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={triggerType}
                                                    onChange={(e) => setTriggerType(e.target.value)}
                                                >
                                                    <option value="all">Todos los Canales (General)</option>
                                                    <option value="status_change">Al Cambiar Estado de Gestión (Estatus CRM)</option>
                                                    <option value="meta_lead_ads">Formularios de Meta (Facebook / Instagram Lead Ads)</option>
                                                    <option value="click_to_whatsapp">Anuncio Click to WhatsApp (CTWA)</option>
                                                    <option value="messenger">Facebook Messenger</option>
                                                    <option value="instagram_dm">Instagram Direct (DM)</option>
                                                    <option value="whatsapp">WhatsApp API / Directo</option>
                                                    <option value="web_form">Formulario Sitio Web</option>
                                                </select>
                                            </div>

                                            {/* 2. Estado de Gestión Inicial / Estatus (ALWAYS VISIBLE) */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">
                                                    <i className="mdi mdi-tag-sync me-1 text-success"></i> Estado de Gestión (Estatus Inicial)
                                                </label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Cualquier Estado de Gestión --" },
                                                        ...manageStatuses.map((s) => ({ value: s.id, label: s.name })),
                                                    ]}
                                                    value={triggerConditions.manage_status_id || ""}
                                                    placeholder="Buscar estado (ej. Recién Llegado, En Cotización)..."
                                                    onChange={(val) => {
                                                        const st = manageStatuses.find((s) => s.id == val);
                                                        setTriggerConditions({
                                                            ...triggerConditions,
                                                            manage_status_id: val,
                                                            manage_status_name: st ? st.name : "",
                                                        });
                                                        updateSelectedNodeData({
                                                            manage_status_id: val,
                                                            manage_status_name: st ? st.name : "",
                                                        });
                                                    }}
                                                />
                                                <small className="text-muted font-10 d-block mt-1">
                                                    Filtra o dispara la ejecución si el Lead ingresa o cambia a este estado en el CRM.
                                                </small>
                                            </div>

                                            {/* 3. Formulario Meta (if Meta channel selected) */}
                                            {["meta_lead_ads", "fb_form", "ig_form", "meta_form"].includes(triggerType) && (
                                                <div className="mb-2">
                                                    <label className="form-label font-11 fw-bold mb-1">Formulario de Meta Específico</label>
                                                    {(!hasFormsIntegration || metaForms.length === 0) ? (
                                                        <div className="alert alert-warning p-2 font-11 border-warning m-0">
                                                            <i className="mdi mdi-alert-circle-outline text-warning me-1 font-14"></i>
                                                            <strong>No hay Formularios Meta integrados</strong>. Conecta tu cuenta en el módulo de Integraciones para activar tus formularios.
                                                        </div>
                                                    ) : (
                                                        <SearchableSelect
                                                            options={[
                                                                { value: "", label: "-- Cualquier Formulario de Meta --" },
                                                                ...metaForms.map((f) => ({ value: f.id, label: `${f.name} (ID: ${f.id})` })),
                                                            ]}
                                                            value={triggerConditions.meta_form_id || ""}
                                                            placeholder="Buscar formulario Meta..."
                                                            onChange={(val) => {
                                                                const f = metaForms.find((mf) => mf.id == val);
                                                                setTriggerConditions({
                                                                    ...triggerConditions,
                                                                    meta_form_id: val,
                                                                    meta_form_name: f ? f.name : "",
                                                                });
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* 4. Campaña Publicitaria (SearchableSelect) */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Campaña Publicitaria (Módulo Campaigns)</label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Todas las Campañas --" },
                                                        ...campaigns.map((c) => ({ value: c.id, label: c.title || c.code || `Campaña #${c.id}` })),
                                                    ]}
                                                    value={triggerConditions.campaign_id || ""}
                                                    placeholder="Buscar campaña registrada..."
                                                    onChange={(val) => {
                                                        const selectedCamp = campaigns.find((c) => c.id == val);
                                                        setTriggerConditions({
                                                            ...triggerConditions,
                                                            campaign_id: val,
                                                            campaign_name: selectedCamp ? (selectedCamp.title || selectedCamp.code) : "",
                                                            adset_id: "",
                                                            adset_name: "",
                                                            ad_id: "",
                                                            ad_name: "",
                                                        });
                                                    }}
                                                />
                                            </div>

                                            {/* 5. Grupo de Anuncios / AdSet (SearchableSelect) */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Grupo de Anuncios (AdSet)</label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Todos los Grupos de Anuncios --" },
                                                        ...filteredAdSets.map((as) => ({
                                                            value: as.id,
                                                            label: as.name || as.title || `Grupo Meta (${as.meta_id || as.id})`,
                                                        })),
                                                    ]}
                                                    value={triggerConditions.adset_id || ""}
                                                    placeholder="Buscar grupo de anuncios..."
                                                    onChange={(val) => {
                                                        const selectedAdSet = adSets.find((as) => as.id == val || as.meta_id == val);
                                                        setTriggerConditions({
                                                            ...triggerConditions,
                                                            adset_id: val,
                                                            adset_name: selectedAdSet ? (selectedAdSet.name || selectedAdSet.title || selectedAdSet.meta_id) : "",
                                                            ad_id: "",
                                                            ad_name: "",
                                                        });
                                                    }}
                                                />
                                            </div>

                                            {/* 6. Anuncio Específico / Ad (SearchableSelect) */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Anuncio Específico (Ad)</label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Todos los Anuncios --" },
                                                        ...filteredAds.map((a) => ({
                                                            value: a.id,
                                                            label: a.name || a.title || `Anuncio Meta (${a.meta_id || a.id})`,
                                                        })),
                                                    ]}
                                                    value={triggerConditions.ad_id || ""}
                                                    placeholder="Buscar anuncio..."
                                                    onChange={(val) => {
                                                        const selectedAd = ads.find((a) => a.id == val || a.meta_id == val);
                                                        setTriggerConditions({
                                                            ...triggerConditions,
                                                            ad_id: val,
                                                            ad_name: selectedAd ? (selectedAd.name || selectedAd.title || selectedAd.meta_id) : "",
                                                        });
                                                    }}
                                                />
                                            </div>

                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Filtrar por Temperatura Inicial</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={triggerConditions.temperature || ""}
                                                    onChange={(e) =>
                                                        setTriggerConditions({
                                                            ...triggerConditions,
                                                            temperature: e.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="">Cualquier Temperatura</option>
                                                    <option value="caliente">Caliente (Alta Intención)</option>
                                                    <option value="tibio">Tibio (Media Intención)</option>
                                                    <option value="frio">Frío (Baja Intención)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* DECISION CONFIGURATION */}
                                    {selectedNode.type === "DECISION" && (
                                        <div className="bg-light p-2 rounded border mb-3">
                                            <h6 className="font-12 fw-bold text-danger mb-2">
                                                <i className="mdi mdi-vector-split me-1"></i> Configurar Evaluación de Decisión
                                            </h6>
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Tipo de Regla a Evaluar</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={selectedNode.data.rule_type || "keyword"}
                                                    onChange={(e) => updateSelectedNodeData({ rule_type: e.target.value })}
                                                >
                                                    <option value="keyword">Palabra Clave en Respuesta del Cliente</option>
                                                    <option value="ai_evaluation">Evaluación Inteligente con IA (Intención / Sentimiento)</option>
                                                    <option value="lead_missing">Verificar si Falta Dato en Lead</option>
                                                    <option value="lead_channel">Origen / Red Social del Prospecto</option>
                                                    <option value="business_hours">Evaluar Horario Laboral de Atención</option>
                                                    <option value="temperature">Temperatura del Chat</option>
                                                </select>
                                            </div>

                                            {/* Rule 1: Keyword */}
                                            {(selectedNode.data.rule_type === "keyword" || !selectedNode.data.rule_type) && (
                                                <div className="mb-2">
                                                    <label className="form-label font-11 fw-bold mb-1">Palabra o Frase Clave</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={selectedNode.data.expected_value || ""}
                                                        onChange={(e) => updateSelectedNodeData({ expected_value: e.target.value })}
                                                        placeholder="ej. cotización, precio, catálogo, demo"
                                                    />
                                                    <small className="text-muted font-10">
                                                        Si el mensaje contiene esta palabra ➔ Toma la salida <strong className="text-success">SÍ</strong>. Si no la contiene ➔ Toma la salida <strong className="text-danger">NO</strong>.
                                                    </small>
                                                </div>
                                            )}

                                            {/* Rule 1.5: AI Evaluation */}
                                            {selectedNode.data.rule_type === "ai_evaluation" && (
                                                <div className="mb-2">
                                                    <label className="form-label font-11 fw-bold mb-1" style={{ color: "#7c3aed" }}>
                                                        <i className="mdi mdi-robot me-1"></i> Criterio de Análisis de la IA (Prompt de Intención)
                                                    </label>
                                                    <textarea
                                                        className="form-control form-control-sm font-11"
                                                        rows="3"
                                                        value={selectedNode.data.expected_value || ""}
                                                        onChange={(e) => updateSelectedNodeData({ expected_value: e.target.value })}
                                                        placeholder="ej. Analiza si la respuesta del cliente expresa interés real en cotizar, comprar o agendar una cita de demostración."
                                                    />
                                                    <small className="text-muted font-10 d-block mt-1">
                                                        La Inteligencia Artificial evaluará el contexto del mensaje enviado por el cliente:
                                                        <br />
                                                        • Si coincide con tu criterio ➔ Toma la salida <strong className="text-success">SÍ</strong>.
                                                        <br />
                                                        • Si no coincide o es negativo ➔ Toma la salida <strong className="text-danger">NO</strong>.
                                                    </small>
                                                </div>
                                            )}

                                            {/* Rule 2: Lead Data Missing */}
                                            {selectedNode.data.rule_type === "lead_missing" && (
                                                <div className="mb-2">
                                                    <label className="form-label font-11 fw-bold mb-1">Campo del Lead a Verificar</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={selectedNode.data.condition_field || "contact_email"}
                                                        onChange={(e) => updateSelectedNodeData({ condition_field: e.target.value })}
                                                    >
                                                        <option value="contact_email">Correo electrónico</option>
                                                        <option value="contact_phone">Teléfono / Celular</option>
                                                        <option value="contact_name">Nombre del contacto</option>
                                                        <option value="name">Empresa / Razón Social</option>
                                                        <option value="ruc">RUC / ID Fiscal</option>
                                                        <option value="sector_id">Rubro de Negocio</option>
                                                    </select>
                                                    <small className="text-muted font-10 d-block mt-1">
                                                        Si al Lead le <strong className="text-danger">FALTA</strong> este dato ➔ Toma la salida <strong className="text-success">SÍ</strong> (para pedirlo). Si <strong className="text-success">YA LO TIENE</strong> ➔ Toma la salida <strong className="text-danger">NO</strong>.
                                                    </small>
                                                </div>
                                            )}

                                            {/* Rule 3: Channel */}
                                            {selectedNode.data.rule_type === "lead_channel" && (
                                                <div className="mb-2">
                                                    <label className="form-label font-11 fw-bold mb-1">Origen Esperado</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={selectedNode.data.expected_value || "meta_lead_ads"}
                                                        onChange={(e) => updateSelectedNodeData({ expected_value: e.target.value })}
                                                    >
                                                        <option value="meta_lead_ads">Formularios de Meta (Lead Ads)</option>
                                                        <option value="click_to_whatsapp">Click to WhatsApp (CTWA)</option>
                                                        <option value="messenger">Facebook Messenger</option>
                                                        <option value="instagram_dm">Instagram Direct (DM)</option>
                                                        <option value="whatsapp">WhatsApp Directo / API</option>
                                                        <option value="web_form">Formulario Sitio Web</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* Rule 4: Business Hours */}
                                            {selectedNode.data.rule_type === "business_hours" && (
                                                <small className="text-muted font-11 d-block bg-white p-2 rounded border">
                                                    <i className="mdi mdi-clock-check-outline text-primary me-1"></i>
                                                    Evalúa si la hora de recepción del mensaje está dentro del horario laboral del CRM.
                                                </small>
                                            )}

                                            {/* Rule 5: Temperature */}
                                            {selectedNode.data.rule_type === "temperature" && (
                                                <div className="mb-2">
                                                    <label className="form-label font-11 fw-bold mb-1">Temperatura Esperada</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={selectedNode.data.expected_value || "caliente"}
                                                        onChange={(e) => updateSelectedNodeData({ expected_value: e.target.value })}
                                                    >
                                                        <option value="caliente">Caliente</option>
                                                        <option value="tibio">Tibio</option>
                                                        <option value="frio">Frío</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* MESSAGE CONFIGURATION (With Quill Rich Editor) */}
                                    {selectedNode.type === "MENSAJE" && (
                                        <div className="mb-3">
                                            <label className="form-label font-12 fw-bold mb-1">Seleccionar Plantilla o Mensaje</label>
                                            <select
                                                className="form-select form-select-sm mb-2"
                                                value={selectedNode.data.default_message_id || ""}
                                                onChange={(e) => {
                                                    const selected = defaultMessages.find(m => m.id == e.target.value);
                                                    const cleanText = selected ? stripHtml(selected.message) : selectedNode.data.content;
                                                    updateSelectedNodeData({
                                                        default_message_id: e.target.value,
                                                        content: cleanText,
                                                        is_meta_template: selected?.is_meta || false,
                                                        template_name: selected?.template_name || "",
                                                    });
                                                }}
                                            >
                                                <option value="">-- Texto Personalizado Libre --</option>
                                                {defaultMessages.some(m => m.is_meta) && (
                                                    <optgroup label="♾️ Plantillas de Meta WhatsApp">
                                                        {defaultMessages.filter(m => m.is_meta).map((dm) => (
                                                            <option key={dm.id} value={dm.id}>
                                                                ♾️ {dm.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                <optgroup label="💬 Mensajes Predeterminados Locales">
                                                    {defaultMessages.filter(m => !m.is_meta).map((dm) => (
                                                        <option key={dm.id} value={dm.id}>
                                                            💬 {dm.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>

                                            <label className="form-label font-12 fw-bold mb-1">Editor Formateado del Mensaje</label>
                                            <QuillFormGroup
                                                eRef={quillRef}
                                                value={selectedNode.data.content || ""}
                                                theme="snow"
                                            />
                                            <button
                                                className="btn btn-xs btn-outline-primary w-100 mt-1"
                                                onClick={() => {
                                                    const val = quillRef.current?.value || "";
                                                    updateSelectedNodeData({ content: val });
                                                    Swal.fire("Actualizado", "Contenido del mensaje guardado en el bloque", "success");
                                                }}
                                            >
                                                Aplicar Texto del Editor
                                            </button>
                                        </div>
                                    )}

                                    {/* DATA REQUEST CONFIGURATION */}
                                    {selectedNode.type === "PETICION_DATOS" && (
                                        <>
                                            <div className="mb-2">
                                                <label className="form-label font-12 fw-bold mb-1">Pregunta al Cliente</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={selectedNode.data.question_text || ""}
                                                    onChange={(e) => updateSelectedNodeData({ question_text: e.target.value })}
                                                    placeholder="ej. ¿Cuál es tu correo electrónico de contacto?"
                                                />
                                            </div>
                                            <div className="mb-2">
                                                <label className="form-label font-12 fw-bold mb-1">Guardar en Campo del Lead</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={selectedNode.data.field_key || "contact_email"}
                                                    onChange={(e) => updateSelectedNodeData({ field_key: e.target.value })}
                                                >
                                                    <optgroup label="Datos Personales y Contacto">
                                                        <option value="contact_name">Nombre completo del contacto</option>
                                                        <option value="contact_email">Correo electrónico</option>
                                                        <option value="contact_phone">Teléfono / Celular de contacto</option>
                                                        <option value="contact_position">Cargo / Puesto</option>
                                                    </optgroup>
                                                    <optgroup label="Datos de Empresa y Rubro">
                                                        <option value="name">Nombre de Empresa / Razón Social</option>
                                                        <option value="ruc">RUC / Documento Fiscal</option>
                                                        <option value="sector_id">Rubro de Negocio / Sector</option>
                                                        <option value="subsector">Subrubro / Especialidad</option>
                                                        <option value="workers">Número de Trabajadores</option>
                                                        <option value="web_url">Sitio Web / Enlace</option>
                                                    </optgroup>
                                                    <optgroup label="Otros Campos">
                                                        <option value="notes">Notas adicionales / Requerimiento</option>
                                                        <option value="custom_username">Nombre de usuario</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="form-check form-switch my-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="skipIfExistsSwitch"
                                                    checked={selectedNode.data.skip_if_exists ?? true}
                                                    onChange={(e) => updateSelectedNodeData({ skip_if_exists: e.target.checked })}
                                                />
                                                <label className="form-check-label font-11 fw-bold text-dark" htmlFor="skipIfExistsSwitch">
                                                    ⚡ Omitir si el lead ya cuenta con este dato
                                                </label>
                                            </div>
                                            <small className="text-muted font-11 d-block bg-light p-2 rounded border mb-3">
                                                <i className="mdi mdi-information-outline text-info me-1"></i>
                                                Si el contacto ya cuenta con este dato en el CRM (ej. WhatsApp ya envió nombre o el lead de Meta ya incluyó correo), el bot se salta este paso de forma inteligente y continúa al siguiente bloque.
                                            </small>
                                        </>
                                    )}

                                    {/* STATUS CONFIGURATION */}
                                    {selectedNode.type === "ESTADO" && (
                                        <>
                                            <div className="mb-2">
                                                <label className="form-label font-12 fw-bold mb-1">
                                                    Estado de Gestión <span className="text-danger">*</span>
                                                </label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Seleccionar Estado de Gestión --" },
                                                        ...manageStatuses.map((s) => ({ value: s.id, label: s.name })),
                                                    ]}
                                                    value={selectedNode.data.manage_status_id || ""}
                                                    placeholder="Buscar estado de gestión..."
                                                    onChange={(val) => {
                                                        const s = manageStatuses.find((st) => st.id == val);
                                                        updateSelectedNodeData({
                                                            manage_status_id: val,
                                                            manageStatusName: s ? s.name : "Seleccionar Estado...",
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="mb-2">
                                                <label className="form-label font-12 fw-bold mb-1">
                                                    Temperatura del Chat <span className="text-muted font-11 fw-normal">(Opcional)</span>
                                                </label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={selectedNode.data.temperature || ""}
                                                    onChange={(e) => updateSelectedNodeData({ temperature: e.target.value })}
                                                >
                                                    <option value="">-- Sin cambio de temperatura --</option>
                                                    <option value="caliente">Caliente</option>
                                                    <option value="tibio">Tibio</option>
                                                    <option value="frio">Frío</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* TRANSFER CONFIGURATION */}
                                    {selectedNode.type === "TRANSFERIR" && (
                                        <div className="mb-2">
                                            <label className="form-label font-12 fw-bold mb-1">Asignar a Asesor</label>
                                            <SearchableSelect
                                                options={[
                                                    { value: "", label: "Rotación Automática (Round-Robin)" },
                                                    ...users.map((u) => ({ value: u.id, label: `${u.name} ${u.lastname}` })),
                                                ]}
                                                value={selectedNode.data.assigned_to || ""}
                                                placeholder="Buscar asesor comercial..."
                                                onChange={(val) => {
                                                    const u = users.find((usr) => usr.id == val);
                                                    updateSelectedNodeData({
                                                        assigned_to: val,
                                                        userName: u ? `${u.name} ${u.lastname}` : "Rotación Automática",
                                                    });
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* ESPERAR RESPUESTA CONFIGURATION */}
                                    {selectedNode.type === "ESPERAR_RESPUESTA" && (
                                        <div className="bg-light p-2 rounded border mb-3">
                                            <h6 className="font-12 fw-bold mb-2" style={{ color: "#8b5cf6" }}>
                                                <i className="mdi mdi-clock-outline me-1"></i> Pausa Simple de Flujo
                                            </h6>
                                            <p className="text-muted font-11 mb-1">
                                                Este bloque detiene temporalmente el flujo tras enviar el mensaje anterior. En cuanto el cliente envíe cualquier respuesta por chat, la automatización se reanudará inmediatamente pasando al siguiente bloque.
                                            </p>
                                            <small className="text-primary font-10 fw-bold d-block bg-white p-2 rounded border">
                                                💡 Tip: Si deseas solicitar y validar datos específicos (como Correo, Teléfono o Nombre), utiliza el bloque <strong>Petición de Datos</strong>.
                                            </small>
                                        </div>
                                    )}

                                    {/* TEMPORIZADOR CONFIGURATION */}
                                    {selectedNode.type === "TEMPORIZADOR" && (
                                        <div className="bg-light p-2 rounded border mb-3">
                                            <h6 className="font-12 fw-bold mb-2" style={{ color: "#d97706" }}>
                                                <i className="mdi mdi-timer-sand me-1"></i> Temporizador & Límite de Tiempo
                                            </h6>
                                            <p className="text-muted font-11 mb-2">
                                                Evalúa si el cliente responde antes de expirar el tiempo. Si responde a tiempo, avanzará por la salida <strong className="text-success">SÍ RESPONDIÓ (Verde)</strong>. Si expira el tiempo sin respuesta, avanzará automáticamente por la salida <strong className="text-danger">EXPIRÓ (Roja)</strong> para enviar seguimiento o catálogo.
                                            </p>
                                            <div className="row g-2 mb-2">
                                                <div className="col-6">
                                                    <label className="form-label font-11 fw-bold mb-1">Tiempo Límite</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="form-control form-control-sm"
                                                        value={selectedNode.data.timeout_value || 30}
                                                        onChange={(e) => updateSelectedNodeData({ timeout_value: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label font-11 fw-bold mb-1">Unidad</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={selectedNode.data.timeout_unit || "minutos"}
                                                        onChange={(e) => updateSelectedNodeData({ timeout_unit: e.target.value })}
                                                    >
                                                        <option value="minutos">Minutos</option>
                                                        <option value="horas">Horas</option>
                                                        <option value="dias">Días</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBFLUJO CONFIGURATION */}
                                    {selectedNode.type === "SUBFLUJO" && (
                                        <div className="bg-light p-2 rounded border mb-3">
                                            <h6 className="font-12 fw-bold mb-2" style={{ color: "#0891b2" }}>
                                                <i className="mdi mdi-routes me-1"></i> Conectar con otro Flujo Existente
                                            </h6>
                                            <p className="text-muted font-11 mb-2">
                                                Al llegar a este bloque, el bot derivará la conversación automáticamente hacia el flujo seleccionado.
                                            </p>
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">Seleccionar Flujo de Destino</label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Selecciona un Flujo --" },
                                                        ...flows
                                                            .filter((f) => !selectedFlow || f.id !== selectedFlow.id)
                                                            .map((f) => ({ value: f.id, label: f.name })),
                                                    ]}
                                                    value={selectedNode.data.target_flow_id || ""}
                                                    placeholder="Buscar flujo..."
                                                    onChange={(val) => {
                                                        const target = flows.find((f) => f.id == val);
                                                        updateSelectedNodeData({
                                                            target_flow_id: val,
                                                            target_flow_name: target ? target.name : "Flujo no seleccionado",
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TASK / ACTIVITY / PROCESS CONFIGURATION */}
                                    {selectedNode.type === "CREAR_TAREA" && (
                                        <div className="bg-light p-2 rounded border mb-3">
                                            <h6 className="font-12 fw-bold mb-2" style={{ color: "#7c3aed" }}>
                                                <i className="mdi mdi-hexagon-multiple me-1"></i> Asignar Proceso del CRM
                                            </h6>

                                            {/* 1. Process Selection */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">
                                                    Proceso del CRM (Módulo Procesos)
                                                </label>
                                                {processes.length > 0 ? (
                                                    <SearchableSelect
                                                        options={[
                                                            { value: "", label: "-- Seleccionar Proceso --" },
                                                            ...processes.map((p) => ({ value: p.id, label: p.name })),
                                                        ]}
                                                        value={selectedNode.data.process_id || ""}
                                                        placeholder="Buscar proceso del CRM..."
                                                        onChange={(val) => {
                                                            const p = processes.find((proc) => proc.id == val);
                                                            updateSelectedNodeData({
                                                                process_id: val,
                                                                process_name: p ? p.name : "",
                                                                note_type_id: "8e895346-3d87-4a87-897a-4192b917c211",
                                                            });
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="alert alert-warning p-2 font-11 border-warning mb-2">
                                                        <i className="mdi mdi-alert-circle-outline text-warning me-1"></i>
                                                        No hay procesos registrados. Créalos en el módulo de Procesos.
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. New Lead Status when process triggers */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">
                                                    Estado de Gestión al Ejecutar Proceso
                                                </label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "-- Mantener Estado Actual --" },
                                                        ...manageStatuses.map((s) => ({ value: s.id, label: s.name })),
                                                    ]}
                                                    value={selectedNode.data.status_id || ""}
                                                    placeholder="Buscar estado de gestión..."
                                                    onChange={(val) => {
                                                        const st = manageStatuses.find((s) => s.id == val);
                                                        updateSelectedNodeData({
                                                            status_id: val,
                                                            status_name: st ? st.name : "",
                                                        });
                                                    }}
                                                />
                                            </div>

                                            {/* 3. Assign Advisor */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">
                                                    Asesor Comercial Asignado
                                                </label>
                                                <SearchableSelect
                                                    options={[
                                                        { value: "", label: "Mantener Asesor Actual del Lead" },
                                                        { value: "round_robin", label: "Rotación Automática (Round-Robin)" },
                                                        ...users.map((u) => ({ value: u.id, label: `${u.name} ${u.lastname}` })),
                                                    ]}
                                                    value={selectedNode.data.assigned_to || ""}
                                                    placeholder="Buscar asesor comercial..."
                                                    onChange={(val) => {
                                                        const u = users.find((usr) => usr.id == val);
                                                        updateSelectedNodeData({
                                                            assigned_to: val,
                                                            assigned_name: u ? `${u.name} ${u.lastname}` : val === "round_robin" ? "Rotación Automática" : "Asesor Actual",
                                                        });
                                                    }}
                                                />
                                            </div>

                                            {/* 4. Process Notes / Task Content */}
                                            <div className="mb-2">
                                                <label className="form-label font-11 fw-bold mb-1">
                                                    Detalle / Notas del Proceso
                                                </label>
                                                <textarea
                                                    rows="2"
                                                    className="form-control form-control-sm"
                                                    value={selectedNode.data.task_title || ""}
                                                    onChange={(e) => updateSelectedNodeData({ task_title: e.target.value })}
                                                    placeholder="Notas o instrucciones registradas en la bitácora del Lead..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* DELETE NODE BUTTON */}
                                    {selectedNode.type !== "TRIGGER" && (
                                        <div className="mt-4 pt-2 border-top">
                                            <button
                                                className="btn btn-sm btn-outline-danger w-100"
                                                onClick={() => {
                                                    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
                                                    setSelectedNodeId(null);
                                                }}
                                            >
                                                <i className="mdi mdi-delete me-1"></i> Eliminar este Bloque
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* RIGHT SIDEBAR: LIVE FLOW SIMULATOR */}
                            {showSimulator && (
                                <div className="bg-white border-start shadow-sm p-3 overflow-auto d-flex flex-column" style={{ width: "360px", minWidth: "360px", height: "100%", zIndex: 10 }}>
                                    {/* Header */}
                                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-xs me-2">
                                                <span className="avatar-title bg-soft-primary text-primary rounded-circle font-16">
                                                    <i className="mdi mdi-cellphone-play"></i>
                                                </span>
                                            </div>
                                            <div>
                                                <h6 className="fw-bold font-13 m-0 text-dark">Simulador en Vivo</h6>
                                                <small className="text-muted font-10">Prueba interactiva del flujo</small>
                                            </div>
                                        </div>
                                        <button className="btn-close" onClick={() => setShowSimulator(false)}></button>
                                    </div>

                                    {/* Action Controls */}
                                    <div className="d-flex gap-2 mb-3">
                                        <button className="btn btn-sm btn-success flex-grow-1 font-11 fw-bold py-1 shadow-sm" onClick={handleStartSimulation}>
                                            <i className="mdi mdi-play me-1"></i> Iniciar Prueba
                                        </button>
                                        <button className="btn btn-sm btn-light border text-muted font-11 py-1" onClick={handleResetSimulation} title="Reiniciar">
                                            <i className="mdi mdi-refresh me-1"></i> Reiniciar
                                        </button>
                                    </div>

                                    {/* Smartphone Chat Screen Mockup */}
                                    <div className="flex-grow-1 bg-light rounded-3 p-3 overflow-auto mb-3 d-flex flex-column border" style={{ maxHeight: "360px", minHeight: "220px", backgroundColor: "#f8fafc" }}>
                                        {simMessages.length === 0 ? (
                                            <div className="text-muted font-11 text-center my-auto p-3">
                                                <div className="avatar-md mx-auto mb-2 opacity-50">
                                                    <span className="avatar-title bg-soft-secondary text-secondary rounded-circle font-24">
                                                        <i className="mdi mdi-forum-outline"></i>
                                                    </span>
                                                </div>
                                                <span className="fw-bold text-dark font-12 d-block mb-1">Modo Prueba Listo</span>
                                                Haz clic en <strong>"Iniciar Prueba"</strong> para simular el recorrido por cada bloque.
                                            </div>
                                        ) : (
                                            simMessages.map((msg, idx) => (
                                                <div key={idx} className={`d-flex mb-2 ${msg.sender === "user" ? "justify-content-end" : msg.sender === "system" ? "justify-content-center w-100" : "justify-content-start"}`}>
                                                    <div className={`p-2 px-3 rounded-3 font-12 shadow-sm ${
                                                        msg.sender === "user" 
                                                            ? "bg-primary text-white" 
                                                            : msg.sender === "system" 
                                                            ? "bg-soft-primary border border-primary-subtle text-primary font-11 text-center" 
                                                            : "bg-white text-dark border"
                                                    }`} style={{ maxWidth: msg.sender === "system" ? "100%" : "85%" }}>
                                                        {msg.sender === "bot" && (
                                                            <div className="d-flex align-items-center gap-1 font-10 text-primary fw-bold mb-1 border-bottom pb-1">
                                                                Bot Atalaya
                                                            </div>
                                                        )}
                                                        {msg.sender === "system" && (
                                                            <div className="fw-bold font-10 text-uppercase text-primary mb-1 border-bottom border-primary-subtle pb-1">
                                                                Acción del CRM
                                                            </div>
                                                        )}
                                                        <div className={`lh-sm ${msg.sender === "system" ? "text-dark fw-medium" : ""}`}>{msg.text}</div>
                                                        {msg.isTimerPrompt && (
                                                            <div className="mt-2 pt-2 border-top border-primary-subtle text-center">
                                                                {simCountdown !== null && (
                                                                    <div className="badge bg-warning text-dark font-10 mb-2 px-2 py-1 fw-bold">
                                                                        <i className="mdi mdi-clock-outline me-1"></i> {simCountdown}s
                                                                    </div>
                                                                )}
                                                                <div className="d-flex gap-1 justify-content-center">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline-success font-10 py-1 px-2 fw-bold d-flex align-items-center"
                                                                        onClick={() => {
                                                                            clearSimTimeout();
                                                                            executeNextSimStep(activeSimNodeId, "Mensaje de cliente en tiempo");
                                                                        }}
                                                                    >
                                                                        <i className="mdi mdi-check-circle-outline me-1 font-12"></i> Respondió
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-xs btn-outline-danger font-10 py-1 px-2 fw-bold d-flex align-items-center"
                                                                        onClick={() => {
                                                                            clearSimTimeout();
                                                                            executeNextSimStep(activeSimNodeId, "timeout");
                                                                        }}
                                                                    >
                                                                        <i className="mdi mdi-clock-alert-outline me-1 font-12"></i> Expiró
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Client Response Input */}
                                    <div className="input-group input-group-sm mb-3">
                                        <input
                                            type="text"
                                            className="form-control font-11 shadow-none"
                                            placeholder="Escribe la respuesta del cliente..."
                                            value={userInputText}
                                            onChange={(e) => setUserInputText(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSendSimUserMessage()}
                                        />
                                        <button className="btn btn-primary font-11 px-3" onClick={handleSendSimUserMessage}>
                                            <i className="mdi mdi-send"></i>
                                        </button>
                                    </div>

                                    {/* Bitácora de Nodos Console */}
                                    <div className="bg-light border rounded-3 p-2 font-11 overflow-auto flex-grow-1" style={{ maxHeight: "150px" }}>
                                        <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                                            <span className="fw-bold text-dark font-11">
                                                <i className="mdi mdi-timeline-text-outline me-1 text-primary"></i> Bitácora de Nodos
                                            </span>
                                            <span className="badge bg-soft-secondary text-secondary font-10">{simLogs.length} eventos</span>
                                        </div>
                                        {simLogs.length === 0 ? (
                                            <div className="text-muted font-10 italic opacity-75">Sin eventos registrados aún.</div>
                                        ) : (
                                            simLogs.map((log, i) => (
                                                <div key={i} className="font-11 py-1 border-bottom border-light text-dark">
                                                    {typeof log === "string" ? log : log.text}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <Adminto {...properties} title="Flujos de Automatización">
            <Flows {...properties} />
        </Adminto>
    );
});

export default Flows;
