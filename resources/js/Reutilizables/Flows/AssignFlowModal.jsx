import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal.jsx";
import { Fetch } from "sode-extend-react";
import Swal from "sweetalert2";

const AssignFlowModal = ({ modalRef, lead, onFlowExecuted = () => {} }) => {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFlowId, setSelectedFlowId] = useState("");
    const [executing, setExecuting] = useState(false);

    useEffect(() => {
        const fetchActiveFlows = async () => {
            setLoading(true);
            try {
                const { status, result } = await Fetch("/api/flows/active");
                if (status && result?.data) {
                    setFlows(result.data);
                }
            } catch (err) {
                console.error("Error fetching flows:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveFlows();
    }, []);

    const handleExecute = async (flowIdToRun) => {
        const flowId = flowIdToRun || selectedFlowId;
        if (!flowId) {
            Swal.fire("Selecciona un flujo", "Por favor elige un flujo para ejecutar", "warning");
            return;
        }

        if (!lead?.id) {
            Swal.fire("Error", "No hay un lead seleccionado", "error");
            return;
        }

        setExecuting(true);
        try {
            const { status, result } = await Fetch("/api/flows/execute", {
                method: "POST",
                body: JSON.stringify({
                    flow_id: flowId,
                    lead_id: lead.id,
                }),
            });

            if (status) {
                Swal.fire({
                    title: "¡Flujo Iniciado!",
                    text: result?.message || "El flujo ha sido asignado y disparado con éxito.",
                    icon: "success",
                    timer: 2000,
                });
                onFlowExecuted(result?.data);
                $(modalRef.current).modal("hide");
            } else {
                Swal.fire("Error", result?.message || "No se pudo iniciar el flujo", "error");
            }
        } catch (error) {
            Swal.fire("Error", "Error al conectar con el servidor", "error");
        } finally {
            setExecuting(false);
        }
    };

    return (
        <Modal
            modalRef={modalRef}
            title={`⚡ Asignar y Ejecutar Flujo a ${lead?.contact_name || "Lead"}`}
            hideFooter={true}
        >
            <div className="p-2">
                <p className="text-muted font-13 mb-3">
                    Selecciona uno de los flujos autónomos disponibles para iniciar la secuencia de mensajes y toma de decisiones con este cliente.
                </p>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="text-muted font-12 mt-2">Cargando flujos disponibles...</p>
                    </div>
                ) : flows.length === 0 ? (
                    <div className="alert alert-warning text-center">
                        <i className="mdi mdi-alert-outline me-1"></i> No hay flujos activos creados. Crea uno en el módulo <strong>Flujos</strong>.
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "350px", overflowY: "auto" }}>
                        {flows.map((flow) => (
                            <div
                                key={flow.id}
                                className="card border m-0 p-3 hover-shadow rounded-3 transition-all"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleExecute(flow.id)}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <h6 className="fw-bold text-dark m-0 font-14">
                                        <i className="mdi mdi-source-branch text-primary me-1"></i>
                                        {flow.name}
                                    </h6>
                                    <span className="badge bg-soft-primary text-primary font-10">
                                        {flow.trigger_type || "General"}
                                    </span>
                                </div>
                                {flow.description && (
                                    <p className="text-muted font-12 mb-2 text-truncate">
                                        {flow.description}
                                    </p>
                                )}
                                <div className="text-end">
                                    <button
                                        className="btn btn-xs btn-primary fw-bold px-3"
                                        disabled={executing}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExecute(flow.id);
                                        }}
                                    >
                                        <i className="mdi mdi-play me-1"></i>
                                        {executing ? "Iniciando..." : "Ejecutar Flujo"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AssignFlowModal;
