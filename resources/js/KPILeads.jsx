import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Adminto from "./components/Adminto";
import CreateReactScript from "./Utils/CreateReactScript";
import { renderToString } from "react-dom/server";
import KPILeadsRest from "./actions/KPILeadsRest";
import Global from "./Utils/Global";
import "../css/kpileads.css";
import Tippy from "@tippyjs/react";
import { GET } from "sode-extend-react";
import Swal from "sweetalert2";
import { TrafficSourceAnalysis } from "./Reutilizables/KPSLeads/TrafficSourceAnalysis";
import { DirectCampaignPerformance } from "./Reutilizables/KPSLeads/DirectCampaignPerformance";
import { FunnelChart } from "./Reutilizables/KPSLeads/FunnelChart";
import { ChannelDistribution } from "./Reutilizables/KPSLeads/ChannelDistribution";
import { ConversionComparison } from "./Reutilizables/KPSLeads/ConversionComparison";
import { PipelineChart } from "./Reutilizables/KPSLeads/PipelineChart";
import { ArchivedAnalysis } from "./Reutilizables/KPSLeads/ArchivedAnalysis";
import {
    Tooltip,
    ResponsiveContainer,
    Cell,
    Funnel,
    FunnelChart as RechartsFunnelChart,
    LabelList,
    Legend,
} from "recharts";

// Lista de 10 colores aleatorios
const colors = [
    "#71b6f9",
    "#f1556c",
    "#1abc9c",
    "#4a81d4",
    "#f7b84b",
    "#5b6be8",
    "#34c38f",
    "#50a5f1",
    "#ffbb78",
    "#aec7e8",
];

const KPILeads = ({ months = [], currentMonth, currentYear }) => {
    const [selectedMonth, setSelectedMonth] = useState(
        `${currentYear}-${currentMonth}`,
    );
    const [grouped, setGrouped] = useState([]);
    const [groupedByManageStatus, setGroupedByManageStatus] = useState([]);

    const [totalCount, setTotalCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [clientsCount, setClientsCount] = useState(0);
    const [archivedCount, setArchivedCount] = useState(0);
    const [trueManagingCount, setTrueManagingCount] = useState(0);
    const [managingCount, setManagingCount] = useState(0);

    const [totalSum, setTotalSum] = useState(0);
    const [clientsSum, setClientsSum] = useState(0);
    const [archivedSum, setArchivedSum] = useState(0);
    const [managingSum, setManagingSum] = useState(0);

    const [leadSources, setLeadSources] = useState({});
    const [originCounts, setOriginCounts] = useState([]);
    const [originCampaignCounts, setOriginCampaignCounts] = useState([]);
    const [breakdowns, setBreakdowns] = useState(0);
    const [funnelCounts, setFunnelCounts] = useState({});
    const [originLandingCampaignCounts, setOriginLandingCampaignCounts] =
        useState([]);
    const [totalArchivedCounts, setTotalArchivedCounts] = useState([]);
    const [archivedLabelsCount, setArchivedLabelsCount] = useState(0);
    const [convertedLabelsCount, setConvertedLabelsCount] = useState(0);
    const [archivedBreakdown, setArchivedBreakdown] = useState([]);
    const [totalConversionPercent, setTotalConversionPercent] = useState(0);

    const [topUsers, setTopUsers] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [usersRanking, setUsersRanking] = useState([]);

    const monthTemplate = ({ id, text, element }) => {
        if (!id) return text;
        const data = $(element).data("option");
        return $(
            renderToString(
                <div>
                    <b className="d-block">{text}</b>
                    <small>
                        <i className="me-1 fa fa-users"></i>
                        {data.quantity} entradas
                    </small>
                </div>,
            ),
        );
    };

    const fetchGraph = (selectedMonth) => {
        setLeadSources({});
        setOriginCounts([]);

        KPILeadsRest.kpi(selectedMonth).then(({ data, summary }) => {
            setGroupedByManageStatus(data);
            setGrouped(summary.grouped ?? []);

            setTotalCount(summary.totalCount ?? 0);
            setPendingCount(summary.pendingCount ?? 0);
            setClientsCount(summary.clientsCount ?? 0);
            setArchivedCount(summary.archivedCount ?? 0);
            setTrueManagingCount(summary.trueManagingCount ?? 0);
            setManagingCount(summary.managingCount ?? 0);

            setTotalSum(summary.totalSum ?? 0);
            setClientsSum(summary.clientsSum ?? 0);
            setArchivedSum(summary.archivedSum ?? 0);
            setManagingSum(summary.managingSum ?? 0);

            setLeadSources(summary.leadSources ?? {});
            setOriginCounts(summary.originCounts ?? []);
            setOriginCampaignCounts(summary.originCampaignCounts ?? []);
            setFunnelCounts(summary.funnelCounts ?? {});
            setOriginLandingCampaignCounts(
                summary.originLandingCampaignCounts ?? [],
            );
            setTotalArchivedCounts(summary.totalArchivedCounts ?? []);
            setArchivedLabelsCount(summary.archivedLabelsCount ?? 0);
            setConvertedLabelsCount(summary.convertedLabelsCount ?? 0);
            setArchivedBreakdown(summary.archivedBreakdown || []);
            setTotalConversionPercent(summary.totalConversionPercent ?? 0);

            setBreakdowns(summary.breakdownCounts ?? 0);

            setTopUsers(summary.usersAssignation ?? []);
            setClientsList(summary.clientsList ?? []);
            setUsersRanking(summary.usersRanking ?? []);
        });
    };

    useEffect(() => {
        fetchGraph(selectedMonth);
    }, [selectedMonth]);

    useEffect(() => {
        const ctx = document.getElementById("leadsStatusPie");
        let chart;

        if (ctx) {
            // Destroy existing chart if it exists
            if (window.leadsStatusChart) {
                window.leadsStatusChart.destroy();
            }

            // Create new chart
            chart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: [Global.APP_NAME, "WhatsApp", "Integración"],
                    datasets: [
                        {
                            data: [
                                leadSources.crm_count,
                                leadSources.whatsapp_count,
                                leadSources.integration_count,
                            ],
                            backgroundColor: ["#f1556c", "#1abc9c", "#4a81d4"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                        },
                    },
                },
            });

            // Store chart reference globally
            window.leadsStatusChart = chart;
        }
        // Cleanup function to destroy chart when component unmounts
        return () => {
            if (window.leadsStatusChart) {
                window.leadsStatusChart.destroy();
            }
        };
    }, [leadSources]);

    useEffect(() => {
        $('[data-plugin="knob"]').knob({
            draw: function () {
                const count = this.i.attr("data-count");
                $(this.i).val(count);
            },
        });

        return () => {
            $('[data-plugin="knob"]').trigger("change");
        };
    }, [leadSources, originCounts]);

    useEffect(() => {
        if (GET.message) {
            Swal.fire({
                icon: "success",
                title: "Operación exitosa",
                text: GET.message,
            });
            history.pushState(null, null, "/home");
        }
    }, [null]);

    return (
        <>
            <div className="row">
                <div className="col-xxl-2 col-xl-3 col-lg-4 col-md-6 col-sm-8 col-12 mb-0">
                    <div className="d-flex gap-2">
                        <div className="dropdown flex-grow-1">
                            <button
                                className="btn btn-light bg-white dropdown-toggle w-100 text-start rounded-pill"
                                type="button"
                                id="monthDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                {(() => {
                                    const selected = months.find(
                                        (m) => m.id === selectedMonth,
                                    );
                                    if (!selected) return "Seleccione un mes";
                                    const month = moment({
                                        month: selected.month - 1,
                                        year: selected.year,
                                    });
                                    return month
                                        .format("MMMM YYYY")
                                        .toTitleCase();
                                })()}
                            </button>
                            <ul
                                className="dropdown-menu w-100"
                                aria-labelledby="monthDropdown"
                            >
                                {months.map((row, index) => {
                                    const month = moment({
                                        month: row.month - 1,
                                        year: row.year,
                                    });
                                    return (
                                        <li key={index}>
                                            <a
                                                className="dropdown-item"
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedMonth(row.id);
                                                }}
                                            >
                                                <b className="d-block">
                                                    {month
                                                        .format("MMMM YYYY")
                                                        .toTitleCase()}
                                                </b>
                                                <small>
                                                    <i className="me-1 fa fa-users"></i>
                                                    {row.quantity} entradas
                                                </small>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <button
                            className="btn btn-light rounded-pill"
                            type="button"
                            onClick={() => fetchGraph(selectedMonth)}
                            title="Refrescar"
                        >
                            <i className="mdi mdi-refresh"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Dummy data for kpiData */}

            <div className="d-flex align-items-center mt-4 px-1">
                <div>
                    <h3
                        className="mb-0 fw-bold text-dark"
                        style={{ letterSpacing: "-0.5px" }}
                    >
                        Cards de conversión
                    </h3>
                </div>
            </div>

            {(() => {
                const formatNumber = (n) => n.toLocaleString("es-PE");
                const formatPercentage = (n) => {
                    return `${n.toFixed(1)}%`;
                };

                return (
                    <div className="row g-3 mb-3 mt-0">
                        <div className="col-md-6 col-xl ">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Total Leads
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(totalCount)}
                                            </h2>
                                            {/* <div className="mt-2">
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <i className="mdi mdi-arrow-up me-1"></i>
                          12.5%
                        </span>
                      </div> */}
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#6366F115",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-account-multiple fs-4"
                                                style={{ color: "#6366F1" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl ">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Leads Nuevos
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(pendingCount)}
                                            </h2>
                                            {/* <div className="mt-2">
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <i className="mdi mdi-arrow-up me-1"></i>
                          8.3%
                        </span>
                      </div> */}
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#3B82F615",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-account-plus fs-4"
                                                style={{ color: "#3B82F6" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl ">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Leads Contactados
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(managingCount)}
                                            </h2>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#F59E0B15",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-phone fs-4"
                                                style={{ color: "#F59E0B" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl ">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Leads en Gestión
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(
                                                    trueManagingCount,
                                                )}
                                            </h2>
                                            <div className="mt-1">
                                                <span className="text-primary fw-semibold fs-13">
                                                    S/.{" "}
                                                    {Number(
                                                        managingSum,
                                                    ).toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#3B82F615",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-account-clock fs-4"
                                                style={{ color: "#3B82F6" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Leads Archivados
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(archivedCount)}
                                            </h2>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#64748B15",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-account-off fs-4"
                                                style={{ color: "#64748B" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Ventas Cerradas
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(clientsCount)}
                                            </h2>
                                            <div className="mt-1">
                                                <span className="text-success fw-semibold fs-13">
                                                    S/.{" "}
                                                    {Number(
                                                        clientsSum,
                                                    ).toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#10B98115",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-trophy fs-4"
                                                style={{ color: "#10B981" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-xl">
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "16px" }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-1 small text-uppercase fw-semibold">
                                                Tasa de Conversión
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatPercentage(
                                                    (clientsCount /
                                                        totalCount) *
                                                        100 || 0,
                                                )}
                                            </h2>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#8B5CF615",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-percent fs-4"
                                                style={{ color: "#8B5CF6" }}
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {clientsList.length > 0 && (
                <div className="row g-4 mb-4">
                    <div className="col-12 ">
                        <div>
                            <h3
                                className="mb-0 fw-bold text-dark"
                                style={{ letterSpacing: "-0.5px" }}
                            >
                                Análisis de Cierre de Ventas
                            </h3>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{ borderRadius: "16px" }}
                        >
                            <div className="card-body">
                                <h5 className="card-title mb-4">
                                    <i className="mdi mdi-trophy-variant me-2 text-warning"></i>
                                    Ranking de Asesores (Cierres)
                                </h5>

                                {(() => {
                                    const firstPlace = usersRanking[0] || null;
                                    const rest = usersRanking.slice(1);

                                    return (
                                        <>
                                            {firstPlace && (
                                                <div className="text-center mb-4 pt-3 animate__animated animate__zoomIn">
                                                    <div className="position-relative d-inline-block mb-3">
                                                        <div
                                                            className="position-absolute"
                                                            style={{
                                                                top: "-30px",
                                                                left: "50%",
                                                                transform:
                                                                    "translateX(-50%)",
                                                                zIndex: 1,
                                                            }}
                                                        >
                                                            <i className="mdi mdi-crown text-warning mdi-48px"></i>
                                                        </div>
                                                        <img
                                                            src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${firstPlace.assigned.relative_id}`}
                                                            className="rounded-circle shadow-lg border border-4 border-warning"
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            onError={(e) => {
                                                                e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                            }}
                                                        />
                                                        <div
                                                            className="position-absolute bottom-0 start-50 translate-middle-x badge rounded-pill bg-warning shadow"
                                                            style={{
                                                                marginBottom:
                                                                    "-10px",
                                                                padding:
                                                                    "5px 12px",
                                                            }}
                                                        >
                                                            1st Place
                                                        </div>
                                                    </div>
                                                    <h4 className="mt-2 mb-1 fw-bold text-dark">
                                                        {
                                                            firstPlace.assigned
                                                                .name
                                                        }{" "}
                                                        {
                                                            firstPlace.assigned
                                                                .lastname
                                                        }
                                                    </h4>
                                                    <div className="d-flex justify-content-center gap-3 align-items-center">
                                                        <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold">
                                                            {firstPlace.count}{" "}
                                                            ventas
                                                        </span>
                                                        <span className="text-success fw-bold fs-15">
                                                            S/.{" "}
                                                            {Number(
                                                                firstPlace.total_amount,
                                                            ).toLocaleString(
                                                                "es-PE",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="inbox-widget mt-2">
                                                {rest.map((row, index) => {
                                                    const fullname = `${row.assigned.name} ${row.assigned.lastname}`;
                                                    const pos = index + 2;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="inbox-item py-2 px-2 border-bottom border-light hover-bg-light transition-all"
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="me-3 fw-bold text-muted"
                                                                    style={{
                                                                        width: "25px",
                                                                    }}
                                                                >
                                                                    {pos < 10
                                                                        ? `0${pos}`
                                                                        : pos}
                                                                </div>
                                                                <div className="flex-shrink-0 me-3">
                                                                    <img
                                                                        src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${row.assigned.relative_id}`}
                                                                        className="rounded-circle avatar-sm border"
                                                                        alt={
                                                                            fullname
                                                                        }
                                                                        onError={(
                                                                            e,
                                                                        ) => {
                                                                            e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex-grow-1 overflow-hidden">
                                                                    <h5 className="my-0 fs-14 fw-semibold text-dark text-truncate">
                                                                        {
                                                                            fullname
                                                                        }
                                                                    </h5>
                                                                    <p className="text-muted mb-0 small">
                                                                        Asesor
                                                                    </p>
                                                                </div>
                                                                <div className="flex-shrink-0 text-end ms-2">
                                                                    <div className="fw-bold text-dark fs-13">
                                                                        {
                                                                            row.count
                                                                        }{" "}
                                                                        ventas
                                                                    </div>
                                                                    <div
                                                                        className="text-success fw-semibold"
                                                                        style={{
                                                                            fontSize:
                                                                                "11px",
                                                                        }}
                                                                    >
                                                                        S/.{" "}
                                                                        {Number(
                                                                            row.total_amount,
                                                                        ).toLocaleString(
                                                                            "es-PE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {usersRanking.length === 0 && (
                                                    <div className="text-center p-5">
                                                        <i className="mdi mdi-account-off-outline mdi-48px text-muted d-block mb-3 opacity-25"></i>
                                                        <span className="text-muted">
                                                            No hay datos de
                                                            asesores para este
                                                            mes
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-8">
                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{ borderRadius: "16px" }}
                        >
                            <div className="card-body">
                                <h5 className="card-title mb-4">
                                    <i className="mdi mdi-table me-2 text-success"></i>
                                    Detalle de Ventas Cerradas
                                </h5>
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="border-0">
                                                    Cliente
                                                </th>
                                                <th className="border-0">
                                                    Producto(s)
                                                </th>
                                                <th className="border-0 text-end">
                                                    Monto
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientsList.map((client, idx) => {
                                                const totalAmount =
                                                    client.products?.reduce(
                                                        (acc, p) =>
                                                            acc +
                                                            Number(
                                                                p.pivot.price,
                                                            ),
                                                        0,
                                                    ) || 0;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="align-middle">
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar-sm me-3">
                                                                    <div className="avatar-title rounded-circle bg-success bg-opacity-10 text-success">
                                                                        {client.contact_name?.charAt(
                                                                            0,
                                                                        ) ||
                                                                            "C"}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h5 className="my-0 fs-14 fw-semibold text-dark">
                                                                        {
                                                                            client.contact_name
                                                                        }
                                                                    </h5>
                                                                    <small className="text-muted">
                                                                        {client.contact_email ||
                                                                            "Sin correo"}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            {client.products?.map(
                                                                (p, pIdx) => (
                                                                    <span
                                                                        key={
                                                                            pIdx
                                                                        }
                                                                        className="badge bg-light text-dark border me-1"
                                                                    >
                                                                        {p.name}
                                                                    </span>
                                                                ),
                                                            ) || (
                                                                <i className="text-muted">
                                                                    Sin
                                                                    productos
                                                                </i>
                                                            )}
                                                        </td>
                                                        <td className="align-middle text-end fw-bold text-dark">
                                                            S/.{" "}
                                                            {totalAmount.toLocaleString(
                                                                "es-PE",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="d-flex align-items-center mb-4 mt-4 px-1">
                <div>
                    <h3
                        className="mb-0 fw-bold text-dark"
                        style={{ letterSpacing: "-0.5px" }}
                    >
                        Análisis total de leads
                    </h3>
                </div>
            </div>
            <div className="row g-4 mb-4">
                <div className="col-lg-4">
                    <div
                        className="card border-0 shadow-sm h-100"
                        style={{ borderRadius: "16px" }}
                    >
                        <div className="card-body">
                            <h5 className="card-title mb-4">
                                <i className="mdi mdi-filter-minus-outline me-2 text-danger"></i>
                                Funnel de Caída
                            </h5>
                            <div style={{ width: "100%", height: 600 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsFunnelChart>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (
                                                    active &&
                                                    payload &&
                                                    payload.length
                                                ) {
                                                    return (
                                                        <div
                                                            className="bg-white p-2 rounded shadow-lg border-0"
                                                            style={{
                                                                minWidth:
                                                                    "150px",
                                                                borderRadius:
                                                                    "16px",
                                                            }}
                                                        >
                                                            <p
                                                                className="mb-1 text-muted   text-uppercase"
                                                                style={{
                                                                    fontSize:
                                                                        "12px",
                                                                    letterSpacing:
                                                                        "0.5px",
                                                                }}
                                                            >
                                                                {
                                                                    payload[0]
                                                                        .payload
                                                                        .name
                                                                }
                                                            </p>
                                                            <div className="d-flex justify-content-between align-items-center border-top pt-1">
                                                                <span
                                                                    className="text-dark "
                                                                    style={{
                                                                        fontSize:
                                                                            "14px",
                                                                    }}
                                                                >
                                                                    <strong className="text-dark">
                                                                        Cantidad:
                                                                    </strong>
                                                                </span>
                                                                <span
                                                                    className="text-dark"
                                                                    style={{
                                                                        fontSize:
                                                                            "14px",
                                                                    }}
                                                                >
                                                                    {payload[0].value.toLocaleString(
                                                                        "es-PE",
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Funnel
                                            dataKey="count"
                                            nameKey="name"
                                            data={[
                                                {
                                                    name: "TOTAL LEADS",
                                                    count: totalCount,
                                                    fill: "#6366F1",
                                                },
                                                {
                                                    name: "CONTACTADOS",
                                                    count: managingCount,
                                                    fill: "#F59E0B",
                                                },
                                                {
                                                    name: "DESESTIMADOS",
                                                    count: archivedLabelsCount,
                                                    fill: "#e66747",
                                                },
                                                {
                                                    name: "VENTAS CONCRETADAS",
                                                    count: clientsCount,
                                                    fill: "#10B981",
                                                },
                                            ]}
                                            isAnimationActive
                                        />
                                    </RechartsFunnelChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                                {[
                                    {
                                        name: "TOTAL LEADS",
                                        count: totalCount,
                                        fill: "#6366F1",
                                    },
                                    {
                                        name: "CONTACTADOS",
                                        count: managingCount,
                                        fill: "#F59E0B",
                                    },
                                    {
                                        name: "DESESTIMADOS",
                                        count: archivedLabelsCount,
                                        fill: "#e66747",
                                    },
                                    {
                                        name: "VENTAS CONCRETADAS",
                                        count: clientsCount,
                                        fill: "#10B981",
                                    },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="d-flex align-items-center"
                                    >
                                        <div
                                            style={{
                                                width: 12,
                                                height: 12,
                                                backgroundColor: item.fill,
                                                borderRadius: "50%",
                                                marginRight: 8,
                                            }}
                                        ></div>
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                color: "#475569",
                                            }}
                                        >
                                            {item.name}:{" "}
                                            {item.count.toLocaleString("es-PE")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-8">
                    <FunnelChart
                        title="Detalle de Desestimados"
                        showRates={false}
                        extraData={archivedBreakdown.map((item) => ({
                            stage: item.name,
                            count: item.quantity,
                            color: item.color,
                        }))}
                    />

                    <PipelineChart data={groupedByManageStatus} />
                </div>
                <div className="col-lg-8">
                    <DirectCampaignPerformance
                        originCounts={originCampaignCounts}
                    />
                </div>
                <div className="col-lg-4">
                    <ChannelDistribution data={originCounts} />
                </div>
            </div>
            <div className="d-flex align-items-center mb-4 mt-4 px-1">
                <div>
                    <h3
                        className="mb-0 fw-bold text-dark"
                        style={{ letterSpacing: "-0.5px" }}
                    >
                        Rendimiento de landing
                    </h3>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-lg-12">
                    <FunnelChart
                        data={{
                            impressions: breakdowns,
                            contacted: funnelCounts.managing,
                            salesClosed: funnelCounts.clients,
                        }}
                        extraData={Object.keys(funnelCounts)
                            .filter(
                                (funnel) =>
                                    funnel != "clients" && funnel != "managing",
                            )
                            .map((funnel, idx) => ({
                                stage: funnel,
                                count: funnelCounts[funnel],
                                color: colors[idx % colors.length],
                            }))}
                    />
                </div>
            </div>

            <div className="row mb-3 g-3">
                <div className="col-lg-6">
                    <TrafficSourceAnalysis data={originLandingCampaignCounts} />
                </div>
                <div className="col-lg-6">
                    <ArchivedAnalysis data={totalArchivedCounts} />
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-lg-5">
                    <ConversionComparison
                        data={Object.keys(funnelCounts)
                            .filter(
                                (funnel) =>
                                    funnel != "clients" && funnel != "managing",
                            )
                            .map((funnel) => ({
                                label: funnel,
                                count: funnelCounts[funnel],
                            }))}
                    />
                </div>
            </div>

            {/* <div className="row">
        <div className="col-12">
          <h4 className='mt-0 mb-2'>Vista general de leads</h4>
        </div>
      </div> */}
            {/* <div className="row">
        <div className="col-md-4">
          <div className="card card-body">
            <div style={{ height: '250px' }}>
              <canvas id="leadsStatusPie" width='100%' height='100%'></canvas>
            </div>
            <h4 className="mt-3 mb-2 text-center">Ingreso de leads</h4>
            <div className="d-flex flex-wrap gap-2 justify-content-evenly">
              <div className='text-center'>
                <input data-plugin="knob" data-width="60" data-height="60" data-graph="sources"
                  data-fgcolor="#f1556c" data-bgcolor="#f1556c33" value={(leadSources.crm_count / totalLeadSources * 100) || 0}
                  data-count={leadSources.crm_count || 0} data-skin="tron" data-angleloffset="180" data-readonly={true}
                  data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                <small className='text-muted d-block text-center'>{Global.APP_NAME}</small>
              </div>
              <div className='text-center'>
                <input data-plugin="knob" data-width="60" data-height="60" data-graph="sources"
                  data-fgcolor="#1abc9c" data-bgcolor="#1abc9c33" value={(leadSources.whatsapp_count / totalLeadSources * 100) || 0}
                  data-count={leadSources.whatsapp_count || 0} data-skin="tron" data-angleloffset="180" data-readonly={true}
                  data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                <small className='text-muted d-block text-center'>WhatsApp</small>
              </div>
              <div className='text-center'>
                <input data-plugin="knob" data-width="60" data-height="60" data-graph="sources"
                  data-fgcolor="#4a81d4" data-bgcolor="#4a81d433" value={(leadSources.integration_count / totalLeadSources * 100) || 0}
                  data-count={leadSources.integration_count || 0} data-skin="tron" data-angleloffset="180" data-readonly={true}
                  data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                <small className='text-muted d-block text-center'>Integracion</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-info" data-plugin="counterup">{totalCount}</h2>
                    <h5>Leads</h5>
                    <small>S/. {Number2Currency(totalSum)}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-success" data-plugin="counterup">{clientsCount}</h2>
                    <h5>Convertidos</h5>
                    <small>S/. {Number2Currency(clientsSum)}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-danger" data-plugin="counterup">{archivedCount}</h2>
                    <h5>No convertidos</h5>
                    <small>S/. {Number2Currency(archivedSum)}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-primary" data-plugin="counterup">{managingCount}</h2>
                    <h5>En gestion</h5>
                    <small>S/. {Number2Currency(managingSum)}</small>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="header-title text-center my-0">Ingreso de Leads por Integración</h4>
                </div>
                <div className=" card-body" style={{
                  minHeight: '160px'
                }}>
                  <div className="d-flex flex-wrap gap-2 justify-content-evenly">
                    {
                      originCounts.map((origin, index) => {
                        const count = origin.count || 0;
                        const percent = count / leadSources.integration_count * 100
                        const uniqueKey = `${count.origin}-${count.count}-${index}`
                        return <div id={uniqueKey} key={uniqueKey} className='text-center'>
                          <input data-plugin="knob" data-width="100" data-height="100"
                            data-fgcolor="#4a81d4" data-bgcolor="#4a81d433" value={percent}
                            data-count={count} data-skin="tron" data-angleloffset="180" data-readonly={true}
                            data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                          <small className='text-muted d-block text-center mt-1'>{origin.origin}</small>
                        </div>
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

            {/* <div className='row'>
        <div className="col-xl-3 col-lg-4 col-sm-6 col-xs-12">
          <div className="card">
            <div className="card-header bg-danger">
              <h4 className="header-title my-0 text-white">
                <i className='mdi mdi-podium-gold me-1'></i>
                Ranking de atenciones
              </h4>
            </div>
            <div className="card-body" style={{
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              <div className="inbox-widget">
                {
                  topUsers
                    .sort((a, b) => b.count - a.count)
                    .map((row, index) => {
                      const fullname = `${row.assigned.name.split(' ')[0]} ${row.assigned.lastname.split(' ')[0]}`
                      return <div key={index} className="inbox-item">
                        <div className="inbox-item-img position-relative">
                          {
                            index <= 1 &&
                            <i className={`user-featured position-absolute mdi mdi-star ${index == 0 && 'text-warning'}`} />
                          }
                          <img className={`rounded-circle aspect-square ${index == 0 && 'border-warning'}`}
                            src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${row.assigned.relative_id}`}
                            style={{
                              padding: index <= 1 ? '2px' : 0,
                              border: index <= 1 ? '2px solid' : 0,
                            }}
                            onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                          />
                        </div>
                        <h5 className="inbox-item-author mt-0 mb-2 text-truncate">{fullname}</h5>
                        <p className="inbox-item-text">
                          <div className='d-flex gap-1 flex-wrap w-100'>
                            <Tippy content={`${row.count} leads atendidos`}>
                              <div className='text-start' style={{ width: '50px' }}>
                                <i className='mdi mdi-account me-1'></i>
                                {row.count}
                              </div>
                            </Tippy>
                            <Tippy content={`${row.emails_sent} mails enviados`}>
                              <div className='text-start' style={{ width: '50px' }}>
                                <i className='mdi mdi-email-send me-1'></i>
                                {row.emails_sent}
                              </div>
                            </Tippy>
                            {
                              row.converted !== null &&
                              <Tippy content={`${row.converted} leads convertidos`}>
                                <div className='text-start' style={{ width: '50px' }}>
                                  <i className='mdi mdi-account-check me-1'></i>
                                  {row.converted}
                                </div>
                              </Tippy>
                            }
                          </div>
                        </p>
                      </div>
                    })
                }
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-9 col-lg-8 col-sm-6 col-xs-12">
          <div className='d-flex gap-3 mb-3' style={{
            overflowX: 'auto',
          }}>
            {
              grouped.map((kpi, index) => {
                return <div key={index} className="card" style={{
                  minWidth: '270px',
                  maxWidth: '270px'
                }}>
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="header-title my-0 text-truncate w-100" style={{ color: kpi.color }}>{kpi.name}</h4>
                    <small className='font-bold'><b>{kpi.quantity}</b></small>
                  </div>
                  <div className="card-body" style={{
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    <div className='d-flex gap-3 flex-column'>
                      {
                        groupedByManageStatus.filter(({ status_id }) => status_id == kpi.id).sort((a, b) => b.quantity - a.quantity).map((row, index) => {
                          const percent = ((row.quantity / kpi.quantity) * 100).toFixed(2);
                          return <div key={index}>
                            <h5 className="my-0">{row.manage_status_name} <span className="float-end" style={{ color: row.manage_status_color }}>{row.quantity}</span></h5>
                            <div className="progress progress-bar-alt-primary progress-sm mt-0" style={{
                              backgroundColor: `${row.manage_status_color}44`
                            }}>
                              <div className="progress-bar progress-animated wow animated animated" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" style={{ width: `${percent}%`, visibility: 'visible', animationName: 'animationProgress', backgroundColor: row.manage_status_color }}>
                              </div>
                            </div>
                          </div>
                        })
                      }
                    </div>
                  </div>
                </div>
              })
            }
          </div>
        </div>
      </div> */}
        </>
    );
};

CreateReactScript((el, properties) => {
    if (!properties.can("dashboard", "leads")) return (location.href = "/");
    createRoot(el).render(
        <Adminto {...properties} title={`KPI - Leads`}>
            <KPILeads {...properties} />
        </Adminto>,
    );
});
