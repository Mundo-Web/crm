import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Adminto from "./components/Adminto";
import CreateReactScript from "./Utils/CreateReactScript";
import { renderToString } from "react-dom/server";
import KPICampaignsRest from "./actions/KPICampaignsRest";
import Global from "./Utils/Global";
import "../css/KPILeads.css";
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
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
} from "recharts";

const AdSetPerformanceCard = ({ adSet, campaignId, campaignName, onViewLeads }) => {
    const chartData = adSet.ads.map((ad) => ({
        name: ad.name,
        "TOTAL LEADS": ad.total,
        CONTACTADOS: ad.contacted,
        DESESTIMADOS: ad.archived,
        "VENTAS CONCRETADAS": ad.sales,
    }));

    return (
        <div
            className="card border-0 shadow-sm mb-4"
            style={{ borderRadius: "16px" }}
        >
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title mb-0 fw-bold text-dark text-truncate" title={adSet.name}>
                        <i className="mdi mdi-folder-outline me-2 text-primary"></i>
                        {adSet.name}
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                        <Tippy content="Ver registros">
                            <button
                                className="btn btn-sm btn-light-primary rounded-circle"
                                onClick={() => onViewLeads(campaignId, campaignName, adSet.name)}
                                style={{ width: 32, height: 32, padding: 0 }}
                            >
                                <i className="mdi mdi-eye-outline"></i>
                            </button>
                        </Tippy>
                        <span className="badge bg-light text-dark rounded-pill px-3 border">
                            {adSet.ads.length} Ads
                        </span>
                    </div>
                </div>

                <div style={{ width: "100%", height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                height={60}
                                tick={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    fill: "#475569",
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis hide axisLine={false} tickLine={false} />
                            <RechartsTooltip
                                cursor={{ fill: "#f1f5f9" }}
                                contentStyle={{
                                    borderRadius: "16px",
                                    border: "none",
                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={60}
                                content={() => (
                                    <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
                                        {[
                                            { label: "TOTAL LEADS", color: "#1E40AF" },
                                            { label: "CONTACTADOS", color: "#F97316" },
                                            { label: "DESESTIMADOS", color: "#EF4444" },
                                            { label: "VENTAS CONCRETADAS", color: "#22C55E" },
                                        ].map((item, i) => (
                                            <div key={i} className="d-flex align-items-center">
                                                <div
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        backgroundColor: item.color,
                                                        borderRadius: "50%",
                                                        marginRight: 6,
                                                    }}
                                                ></div>
                                                <span
                                                    style={{
                                                        fontSize: "10px",
                                                        fontWeight: "700",
                                                        color: "#475569",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                            <Bar
                                dataKey="TOTAL LEADS"
                                fill="#1E40AF"
                                radius={[4, 4, 0, 0]}
                                barSize={35}
                            />
                            <Bar
                                dataKey="CONTACTADOS"
                                fill="#F97316"
                                radius={[4, 4, 0, 0]}
                                barSize={35}
                            />
                            <Bar
                                dataKey="DESESTIMADOS"
                                fill="#EF4444"
                                radius={[4, 4, 0, 0]}
                                barSize={35}
                            />
                            <Bar
                                dataKey="VENTAS CONCRETADAS"
                                fill="#22C55E"
                                radius={[4, 4, 0, 0]}
                                barSize={35}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

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

const KPICampaigns = ({ months = [], currentMonth, currentYear }) => {
    const [selectedMonth, setSelectedMonth] = useState(
        `${currentYear}-${currentMonth}`,
    );
    const [grouped, setGrouped] = useState([]);
    const [groupedByManageStatus, setGroupedByManageStatus] = useState([]);

    const [totalCount, setTotalCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [clientsCount, setClientsCount] = useState(0);
    const [archivedCount, setArchivedCount] = useState(0);
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
    const [hierarchy, setHierarchy] = useState([]);

    const [modalLeads, setModalLeads] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [isModalLoading, setIsModalLoading] = useState(false);

    const handleViewLeads = (campaignId, campaignName, adSetName) => {
        setModalTitle(`${campaignName} - ${adSetName}`);
        setIsModalOpen(true);
        setIsModalLoading(true);
        setModalLeads([]);

        KPICampaignsRest.leads(selectedMonth, campaignId, adSetName)
            .then((leads) => {
                setModalLeads(leads);
                setIsModalLoading(false);
            })
            .catch(() => {
                setIsModalLoading(false);
                setIsModalOpen(false);
            });
    };

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

        KPICampaignsRest.kpi(selectedMonth).then(({ data, summary }) => {
            setGroupedByManageStatus(data);
            setGrouped(summary.grouped ?? []);

            setTotalCount(summary.totalCount ?? 0);
            setPendingCount(summary.pendingCount ?? 0);
            setClientsCount(summary.clientsCount ?? 0);
            setArchivedCount(summary.archivedCount ?? 0);
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

            setTopUsers(summary.usersAssignation ?? []);
            setHierarchy(summary.hierarchy ?? []);
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
                        <div className="col-md-6 col-xl">
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
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#1E40AF15",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-account-multiple fs-4"
                                                style={{ color: "#1E40AF" }}
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
                                                Contactados
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(totalCount - pendingCount)}
                                            </h2>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#F9731615",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-phone fs-4"
                                                style={{ color: "#F97316" }}
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
                                                Desestimados
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
                                                backgroundColor: "#EF444415",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-account-remove fs-4"
                                                style={{ color: "#EF4444" }}
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
                                                Ventas Concretadas
                                            </p>
                                            <h2 className="mb-0 fw-bold">
                                                {formatNumber(clientsCount)}
                                            </h2>
                                        </div>
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "56px",
                                                height: "56px",
                                                backgroundColor: "#22C55E15",
                                            }}
                                        >
                                            <i
                                                className="mdi mdi-trophy fs-4"
                                                style={{ color: "#22C55E" }}
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

            {hierarchy.map((campaign, cIdx) => (
                <div key={cIdx} className="mb-5">
                    <div className="d-flex align-items-center mb-4 mt-5 px-1">
                        <div className="flex-grow-1 border-bottom pb-2">
                            <h2
                                className="mb-0 fw-bold text-primary"
                                style={{ letterSpacing: "-1px" }}
                            >
                                <i className="mdi mdi-bullhorn-outline me-2"></i>
                                CAMPAÑA: {campaign.name}
                            </h2>
                            <p className="text-muted small mb-0 mt-1">
                                Análisis de rendimiento publicitario por grupo
                                de anuncios
                            </p>
                        </div>
                    </div>

                    <div className="row">
                        {campaign.adSets.map((adSet, asIdx) => (
                            <div className="col-lg-4" key={asIdx}>
                                <AdSetPerformanceCard
                                    adSet={adSet}
                                    campaignId={campaign.id}
                                    campaignName={campaign.name}
                                    onViewLeads={handleViewLeads}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
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
                                            formatter={(value) =>
                                                value.toLocaleString("es-PE")
                                            }
                                        />
                                        <Funnel
                                            dataKey="count"
                                            data={[
                                                {
                                                    name: "TOTAL LEADS",
                                                    count: totalCount,
                                                    fill: "#1E40AF",
                                                },
                                                {
                                                    name: "CONTACTADOS",
                                                    count: managingCount,
                                                    fill: "#F97316",
                                                },
                                                {
                                                    name: "DESESTIMADOS",
                                                    count: archivedLabelsCount,
                                                    fill: "#22C55E",
                                                },
                                                {
                                                    name: "VENTAS CONCRETADAS",
                                                    count: clientsCount,
                                                    fill: "#EF4444",
                                                },
                                            ]}
                                            isAnimationActive
                                        ></Funnel>
                                    </RechartsFunnelChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                                {[
                                    {
                                        name: "TOTAL LEADS",
                                        count: totalCount,
                                        fill: "#1E40AF",
                                    },
                                    {
                                        name: "CONTACTADOS",
                                        count: managingCount,
                                        fill: "#F97316",
                                    },
                                    {
                                        name: "DESESTIMADOS",
                                        count: archivedLabelsCount,
                                        fill: "#22C55E",
                                    },
                                    {
                                        name: "VENTAS CONCRETADAS",
                                        count: clientsCount,
                                        fill: "#EF4444",
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
            </div>

            {/* Leads Modal */}
            <div
                className={`modal fade ${isModalOpen ? "show d-block" : ""}`}
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold text-dark pt-2 px-2">
                                <i className="mdi mdi-account-group me-2 text-primary"></i>
                                Registros: {modalTitle}
                            </h5>
                            <button
                                type="button"
                                className="btn-close me-2"
                                onClick={() => setIsModalOpen(false)}
                            ></button>
                        </div>
                        <div className="modal-body p-4">
                            {isModalLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted">Cargando registros...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="border-0">Nombre</th>
                                                <th className="border-0">Contacto</th>
                                                <th className="border-0 text-center">Campaign ID</th>
                                                <th className="border-0 text-center">Origen</th>
                                                <th className="border-0">Fecha</th>
                                                <th className="border-0 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalLeads.length > 0 ? (
                                                modalLeads.map((lead, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-medium">
                                                            {lead.name}
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <a href={`tel:${lead.contact_phone}`} className="text-decoration-none d-block">
                                                                    <i className="mdi mdi-phone me-1"></i>
                                                                    {lead.contact_phone}
                                                                </a>
                                                                <small className="text-muted d-block mt-1">
                                                                    <i className="mdi mdi-email-outline me-1"></i>
                                                                    {lead.contact_email}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td className="small text-muted font-monospace text-center" style={{ fontSize: '0.75rem' }}>
                                                            {lead.campaign_id || <span className="text-danger italic">N/A</span>}
                                                        </td>
                                                        <td className="small text-center">
                                                            <span className="badge bg-light text-dark border">
                                                                {lead.origin || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="small text-muted">
                                                            {moment(lead.created_at).format('DD/MM/YYYY HH:mm')}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="badge rounded-pill px-3"
                                                                style={{
                                                                    backgroundColor: `${lead.status_color}15`,
                                                                    color: lead.status_color,
                                                                    border: `1px solid ${lead.status_color}33`
                                                                }}
                                                            >
                                                                {lead.status_name}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-muted">
                                                        No se encontraron registros en este periodo.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button
                                type="button"
                                className="btn btn-light rounded-pill px-4"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

CreateReactScript((el, properties) => {
    if (!properties.can("dashboard", "leads")) return (location.href = "/");
    createRoot(el).render(
        <Adminto {...properties} title={`KPI - Campañas`}>
            <KPICampaigns {...properties} />
        </Adminto>,
    );
});
