import React, { useEffect, useRef, useState } from "react";
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
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
    LabelList,
    Tooltip,
    Cell,
    Funnel,
    FunnelChart as RechartsFunnelChart,
} from "recharts";
import Table from "./components/Table";
import ReactAppend from "./Utils/ReactAppend";
import axios from "axios";

const AdSetPerformanceCard = ({
    adSet,
    campaignId,
    campaignName,
    onViewLeads,
}) => {
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
                    <h5
                        className="card-title mb-0 fw-bold text-dark text-truncate"
                        title={adSet.name}
                        style={{ maxWidth: "75%", fontSize: "15px" }}
                    >
                        <i className="mdi mdi-folder-heart-outline me-2 text-primary"></i>
                        {adSet.name}
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                        <Tippy content="Ver registros detallados">
                            <button
                                className="btn btn-sm btn-light-primary rounded-circle"
                                onClick={() =>
                                    onViewLeads(
                                        campaignId,
                                        campaignName,
                                        adSet.name,
                                    )
                                }
                                style={{ width: 32, height: 32, padding: 0 }}
                            >
                                <i className="mdi mdi-eye-outline"></i>
                            </button>
                        </Tippy>
                        <span
                            className="badge bg-soft-primary text-primary rounded-pill px-3 border"
                            style={{ fontSize: "10px" }}
                        >
                            {adSet.ads.length} Ads
                        </span>
                    </div>
                </div>

                <div style={{ width: "100%", height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 20,
                            }}
                            barGap={5}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f1f5f9"
                            />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                height={40}
                                tick={({ x, y, payload }) => (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={0}
                                            y={0}
                                            dy={16}
                                            textAnchor="middle"
                                            fill="#94a3b8"
                                            fontSize={10}
                                            fontWeight={600}
                                        >
                                            {payload.value.length > 12
                                                ? payload.value.substring(
                                                      0,
                                                      10,
                                                  ) + "..."
                                                : payload.value}
                                        </text>
                                    </g>
                                )}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: "#94a3b8" }}
                            />
                            <RechartsTooltip
                                shared={false}
                                animationDuration={0}
                                cursor={{ fill: "#f8fafc", radius: 8 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const entry = payload[0];
                                        return (
                                            <div
                                                className="bg-white p-3 rounded-4 shadow-lg border-0"
                                                style={{ minWidth: "250px" }}
                                            >
                                                <p
                                                    className="mb-2 text-muted fw-bold text-uppercase border-bottom pb-2"
                                                    style={{
                                                        fontSize: "10px",
                                                        letterSpacing: "0.8px",
                                                    }}
                                                >
                                                    {entry.payload.name}
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "#64748b",
                                                        }}
                                                    >
                                                        <strong className="text-dark">
                                                            {entry.name}:
                                                        </strong>
                                                    </span>
                                                    <span
                                                        className="fw-bold fs-6"
                                                        style={{
                                                            color: entry.fill,
                                                        }}
                                                    >
                                                        {entry.value.toLocaleString(
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
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{
                                    paddingTop: "20px",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                }}
                            />
                            <Bar
                                dataKey="TOTAL LEADS"
                                fill="#6366F1"
                                radius={[4, 4, 0, 0]}
                                barSize={22}
                            >
                                <LabelList
                                    dataKey="TOTAL LEADS"
                                    position="top"
                                    style={{
                                        fill: "#6366F1",
                                        fontSize: 10,
                                        fontWeight: "800",
                                    }}
                                />
                            </Bar>
                            <Bar
                                dataKey="CONTACTADOS"
                                fill="#F59E0B"
                                radius={[4, 4, 0, 0]}
                                barSize={22}
                            >
                                <LabelList
                                    dataKey="CONTACTADOS"
                                    position="top"
                                    style={{
                                        fill: "#F59E0B",
                                        fontSize: 10,
                                        fontWeight: "800",
                                    }}
                                />
                            </Bar>
                            <Bar
                                dataKey="DESESTIMADOS"
                                fill="#F43F5E"
                                radius={[4, 4, 0, 0]}
                                barSize={22}
                            >
                                <LabelList
                                    dataKey="DESESTIMADOS"
                                    position="top"
                                    style={{
                                        fill: "#F43F5E",
                                        fontSize: 10,
                                        fontWeight: "800",
                                    }}
                                />
                            </Bar>
                            <Bar
                                dataKey="VENTAS CONCRETADAS"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                                barSize={22}
                            >
                                <LabelList
                                    dataKey="VENTAS CONCRETADAS"
                                    position="top"
                                    style={{
                                        fill: "#10B981",
                                        fontSize: 10,
                                        fontWeight: "800",
                                    }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

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
    const [trueManagingCount, setTrueManagingCount] = useState(0);

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
    const [usersRanking, setUsersRanking] = useState([]);
    const [campaignsRanking, setCampaignsRanking] = useState([]);
    const [clientsList, setClientsList] = useState([]);

    const [winningCampaign, setWinningCampaign] = useState(null);
    const [winningAdset, setWinningAdset] = useState(null);
    const [winningAd, setWinningAd] = useState(null);

    const [leadWinningCampaign, setLeadWinningCampaign] = useState(null);
    const [leadWinningAdset, setLeadWinningAdset] = useState(null);
    const [leadWinningAd, setLeadWinningAd] = useState(null);

    const [modalLeads, setModalLeads] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [isModalLoading, setIsModalLoading] = useState(false);

    const gridRef = useRef();
    const modalRef = useRef();
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedAdSetName, setSelectedAdSetName] = useState(null);

    const leadsRest = {
        paginate: (params) => {
            return axios
                .post(`/api/dashboard/campaigns/leads/paginate`, {
                    ...params,
                    month: selectedMonth,
                    campaign_id: selectedCampaignId,
                    adset_name: selectedAdSetName,
                })
                .then((res) => res.data);
        },
    };

    const fetchLeads = (campaignId, campaignName, adSetName) => {
        setModalTitle(
            `Leads: ${campaignName} / ${adSetName ? adSetName : "Todos"}`,
        );

        setSelectedCampaignId(campaignId);
        setSelectedAdSetName(adSetName);

        setTimeout(() => {
            if (gridRef.current) {
                $(gridRef.current).dxDataGrid("instance").refresh();
            }
        }, 100);

        $(modalRef.current).modal("show");
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

            setTopUsers(summary.usersAssignation ?? []);
            setHierarchy(summary.hierarchy ?? []);
            setUsersRanking(summary.usersRanking ?? []);
            setCampaignsRanking(summary.campaignsRanking ?? []);
            setClientsList(summary.clientsList ?? []);

            setWinningCampaign(summary.winningCampaign ?? null);
            setWinningAdset(summary.winningAdset ?? null);
            setWinningAd(summary.winningAd ?? null);

            setLeadWinningCampaign(summary.leadWinningCampaign ?? null);
            setLeadWinningAdset(summary.leadWinningAdset ?? null);
            setLeadWinningAd(summary.leadWinningAd ?? null);
        });
    };

    useEffect(() => {
        fetchGraph(selectedMonth);
    }, [selectedMonth]);

    useEffect(() => {
        const ctx = document.getElementById("leadsStatusPie");
        let chart;

        if (ctx) {
            if (window.leadsStatusChart) {
                window.leadsStatusChart.destroy();
            }

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

            window.leadsStatusChart = chart;
        }
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
                        <div className="col-md-6 col-xl">
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
                        <div className="col-md-6 col-xl">
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
                <div className="row g-4 mb-5">
                    {/* Columna Principal (70%) */}
                    <div className="col-lg-8 col-xl-9">
                        <div
                            className="card border-0 shadow-sm mb-0"
                            style={{ borderRadius: "16px" }}
                        >
                            <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div>
                                        <h4
                                            className="mb-0 fw-bold text-dark"
                                            style={{
                                                fontSize: "20px",
                                                letterSpacing: "-0.5px",
                                            }}
                                        >
                                            Rendimiento Publicitario (Cierres)
                                        </h4>
                                        <p className="text-muted small mb-0">
                                            Rendimiento de Ventas por Campaña
                                        </p>
                                    </div>
                                    <div
                                        className="badge bg-soft-success text-success p-2 px-3 rounded-pill"
                                        style={{ fontSize: "11px" }}
                                    >
                                        <i className="mdi mdi-check-all me-1"></i>
                                        Datos Sincronizados
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <span className="text-muted small fw-medium">
                                        Filtro Activo:
                                    </span>
                                    <div className="dropdown">
                                        <button
                                            className="btn btn-sm btn-white border shadow-sm rounded-pill px-3 py-1 d-flex align-items-center gap-2 bg-light bg-opacity-25"
                                            type="button"
                                        >
                                            <i className="mdi mdi-bullhorn text-primary"></i>
                                            <span
                                                className="fw-bold"
                                                style={{ fontSize: "10px" }}
                                            >
                                                CAMPAÑA: {clientsList[0]?.name}{" "}
                                                | {selectedMonth}
                                            </span>
                                            <i className="mdi mdi-chevron-down text-muted"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h5
                                        className="mb-0 fw-bold text-dark"
                                        style={{ fontSize: "15px" }}
                                    >
                                        Detalle de Cierres de Ventas (70%)
                                    </h5>
                                </div>
                            </div>

                            <div className="card-body pt-0 px-4 pb-4">
                                {clientsList.map((campaign, ci) => (
                                    <React.Fragment key={`c-${ci}`}>
                                        {campaign.adsets.map((adset, ai) => (
                                            <React.Fragment
                                                key={`as-${ci}-${ai}`}
                                            >
                                                {adset.ads.map((ad, adi) => {
                                                    const totalAdSales =
                                                        ad.leads.reduce(
                                                            (sum, client) => {
                                                                return (
                                                                    sum +
                                                                    (client.products?.reduce(
                                                                        (
                                                                            s,
                                                                            p,
                                                                        ) =>
                                                                            s +
                                                                            Number(
                                                                                p
                                                                                    .pivot
                                                                                    .price,
                                                                            ),
                                                                        0,
                                                                    ) || 0)
                                                                );
                                                            },
                                                            0,
                                                        );

                                                    return (
                                                        <div
                                                            key={`ad-${ci}-${ai}-${adi}`}
                                                            className="mb-4 border border-light shadow-sm"
                                                            style={{
                                                                borderRadius:
                                                                    "12px",
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                        >
                                                            <div className="bg-light bg-opacity-25 px-3 py-2 d-flex align-items-center justify-content-between border-bottom border-light">
                                                                <div className="d-flex align-items-center">
                                                                    <div
                                                                        className="avatar-xs me-2"
                                                                        style={{
                                                                            width: "28px",
                                                                            height: "28px",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            className="avatar-title rounded bg-soft-warning text-warning"
                                                                            style={{
                                                                                fontSize:
                                                                                    "14px",
                                                                            }}
                                                                        >
                                                                            <i className="mdi mdi-package-variant"></i>
                                                                        </span>
                                                                    </div>
                                                                    <h6
                                                                        className="mb-0 fw-bold text-dark"
                                                                        style={{
                                                                            fontSize:
                                                                                "13px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            adset.name
                                                                        }{" "}
                                                                        |{" "}
                                                                        <span className="text-muted fw-normal">
                                                                            {
                                                                                ad.name
                                                                            }
                                                                        </span>
                                                                    </h6>
                                                                </div>
                                                                <div
                                                                    className="text-muted"
                                                                    style={{
                                                                        fontSize:
                                                                            "11px",
                                                                    }}
                                                                >
                                                                    Total de
                                                                    Cierres:{" "}
                                                                    <span className="text-dark fw-bold">
                                                                        {
                                                                            ad
                                                                                .leads
                                                                                .length
                                                                        }
                                                                    </span>
                                                                    <span className="mx-2 text-light">
                                                                        |
                                                                    </span>
                                                                    Venta Total:{" "}
                                                                    <span className="text-dark fw-bold">
                                                                        S/{" "}
                                                                        {totalAdSales.toLocaleString(
                                                                            "es-PE",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="table-responsive">
                                                                <table className="table table-hover align-middle mb-0">
                                                                    <thead>
                                                                        <tr
                                                                            className="bg-white"
                                                                            style={{
                                                                                fontSize:
                                                                                    "11px",
                                                                                color: "#6c757d",
                                                                            }}
                                                                        >
                                                                            <th className="border-0 px-3 py-3 fw-bold text-uppercase">
                                                                                Lead
                                                                                /
                                                                                Cliente
                                                                            </th>
                                                                            <th className="border-0 py-3 fw-bold text-uppercase">
                                                                                Contacto
                                                                            </th>
                                                                            <th className="border-0 py-3 fw-bold text-uppercase">
                                                                                Asesor
                                                                            </th>
                                                                            <th className="border-0 py-3 fw-bold text-uppercase">
                                                                                Producto
                                                                            </th>
                                                                            <th className="border-0 text-end px-3 py-3 fw-bold text-uppercase">
                                                                                Venta
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {ad.leads.map(
                                                                            (
                                                                                client,
                                                                                li,
                                                                            ) => {
                                                                                const totalClient =
                                                                                    client.products?.reduce(
                                                                                        (
                                                                                            sum,
                                                                                            p,
                                                                                        ) =>
                                                                                            sum +
                                                                                            Number(
                                                                                                p
                                                                                                    .pivot
                                                                                                    .price,
                                                                                            ),
                                                                                        0,
                                                                                    ) ||
                                                                                    0;
                                                                                return (
                                                                                    <tr
                                                                                        key={`l-${ci}-${ai}-${adi}-${li}`}
                                                                                        className="border-top border-light"
                                                                                    >
                                                                                        <td className="px-3 py-3">
                                                                                            <span
                                                                                                className="fw-bold text-dark"
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        "13px",
                                                                                                }}
                                                                                            >
                                                                                                {
                                                                                                    client.name
                                                                                                }
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-3">
                                                                                            <div className="d-flex align-items-center gap-2">
                                                                                                <i className="mdi mdi-whatsapp text-success fs-5"></i>
                                                                                                <span
                                                                                                    className="text-muted small"
                                                                                                    style={{
                                                                                                        fontSize:
                                                                                                            "11px",
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        client.contact_phone
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="py-3">
                                                                                            <div className="d-flex align-items-center">
                                                                                                <img
                                                                                                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${client.assigned?.relative_id}`}
                                                                                                    className="rounded-circle avatar-xs me-2 border border-white shadow-sm"
                                                                                                    style={{
                                                                                                        width: "24px",
                                                                                                        height: "24px",
                                                                                                    }}
                                                                                                    onError={(
                                                                                                        e,
                                                                                                    ) => {
                                                                                                        e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                                                                    }}
                                                                                                />
                                                                                                <span
                                                                                                    className="text-dark fw-medium"
                                                                                                    style={{
                                                                                                        fontSize:
                                                                                                            "12px",
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        client
                                                                                                            .assigned
                                                                                                            ?.name
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="py-3">
                                                                                            <div className="d-flex flex-wrap gap-1">
                                                                                                {client.products?.map(
                                                                                                    (
                                                                                                        p,
                                                                                                        pi,
                                                                                                    ) => (
                                                                                                        <span
                                                                                                            key={
                                                                                                                pi
                                                                                                            }
                                                                                                            className="badge bg-soft-success text-success rounded-pill px-2 py-1"
                                                                                                            style={{
                                                                                                                fontSize:
                                                                                                                    "9px",
                                                                                                                textTransform:
                                                                                                                    "uppercase",
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                p.name
                                                                                                            }
                                                                                                        </span>
                                                                                                    ),
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="text-end px-3 py-3">
                                                                                            <span
                                                                                                className="fw-bold text-dark"
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        "13px",
                                                                                                }}
                                                                                            >
                                                                                                S/{" "}
                                                                                                {totalClient.toLocaleString(
                                                                                                    "es-PE",
                                                                                                    {
                                                                                                        minimumFractionDigits: 2,
                                                                                                    },
                                                                                                )}
                                                                                            </span>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Columna Lateral (30%) */}
                    <div className="col-lg-4 col-xl-3">
                        <div className="sticky-top" style={{ top: "100px" }}>
                            <div className="mb-4">
                                {/* Top Asesores */}
                                <div
                                    className="card border-0 shadow-sm mb-4"
                                    style={{ borderRadius: "16px" }}
                                >
                                    <div className="card-body p-4">
                                        <h5
                                            className="card-title mb-4 fw-bold text-dark d-flex align-items-center"
                                            style={{ fontSize: "14px" }}
                                        >
                                            <i className="mdi mdi-trophy text-warning me-2 fs-4"></i>
                                            Top Asesores (Venta Total)
                                        </h5>
                                        <div className="vstack gap-3">
                                            {usersRanking
                                                .slice(0, 5)
                                                .map((user, idx) => {
                                                    const percentage =
                                                        Math.round(
                                                            ((user.total || 0) /
                                                                (usersRanking[0]
                                                                    ?.total ||
                                                                    1)) *
                                                                100,
                                                        );
                                                    const advisor =
                                                        user.assigned || {};
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="d-flex align-items-center"
                                                        >
                                                            <span
                                                                className="fw-bold text-dark me-2"
                                                                style={{
                                                                    width: "10px",
                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                            <img
                                                                src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${advisor.relative_id}`}
                                                                className="rounded-circle avatar-xs me-2 shadow-sm"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                                }}
                                                            />
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span
                                                                        className="fw-bold text-dark"
                                                                        style={{
                                                                            fontSize:
                                                                                "11px",
                                                                        }}
                                                                    >
                                                                        {advisor.name ||
                                                                            "Sin nombre"}{" "}
                                                                        <span className="text-muted fw-normal">
                                                                            ·{" "}
                                                                            {user.count ||
                                                                                0}{" "}
                                                                            cierres
                                                                        </span>
                                                                    </span>
                                                                    <span
                                                                        className="text-muted"
                                                                        style={{
                                                                            fontSize:
                                                                                "10px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            percentage
                                                                        }
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className="progress rounded-pill"
                                                                    style={{
                                                                        height: "5px",
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="progress-bar bg-primary"
                                                                        role="progressbar"
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>

                                {/* Top Anuncios */}
                                <div
                                    className="card border-0 shadow-sm mb-4"
                                    style={{ borderRadius: "16px" }}
                                >
                                    <div className="card-body p-4">
                                        <h5
                                            className="card-title mb-4 fw-bold text-dark d-flex align-items-center"
                                            style={{ fontSize: "14px" }}
                                        >
                                            <i className="mdi mdi-fire text-danger me-2 fs-4"></i>
                                            Top Anuncios (Ads)
                                        </h5>
                                        <div className="vstack gap-3">
                                            {campaignsRanking
                                                .slice(0, 5)
                                                .map((ad, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="d-flex justify-content-between align-items-center"
                                                    >
                                                        <div>
                                                            <span
                                                                className="fw-bold text-dark d-block"
                                                                style={{
                                                                    fontSize:
                                                                        "11px",
                                                                }}
                                                            >
                                                                {idx + 1}.{" "}
                                                                {ad.ad_name ||
                                                                    "Sin nombre"}
                                                            </span>
                                                            <small
                                                                className="text-muted"
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                }}
                                                            >
                                                                {ad.adset_name ||
                                                                    "Sin conjunto"}
                                                            </small>
                                                        </div>
                                                        <span
                                                            className="fw-bold text-dark"
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            S/{" "}
                                                            {(
                                                                ad.total_liquidated ||
                                                                0
                                                            ).toLocaleString(
                                                                "es-PE",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen */}
                                <div
                                    className="card border-0 shadow-sm"
                                    style={{ borderRadius: "16px" }}
                                >
                                    <div className="card-body p-4">
                                        <h5
                                            className="card-title mb-4 fw-bold text-dark d-flex align-items-center"
                                            style={{ fontSize: "14px" }}
                                        >
                                            <i className="mdi mdi-package-variant text-warning me-2 fs-4"></i>
                                            Resumen de la Campaña
                                        </h5>
                                        <div className="vstack gap-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted small">
                                                    Total Liquidado:
                                                </span>
                                                <span className="fw-bold text-dark">
                                                    S/{" "}
                                                    {(
                                                        clientsSum || 0
                                                    ).toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted small">
                                                    Leads Cerrados:
                                                </span>
                                                <span className="fw-bold text-dark">
                                                    {clientsCount || 0}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted small">
                                                    Ticket Promedio:
                                                </span>
                                                <span className="fw-bold text-dark">
                                                    S/{" "}
                                                    {(
                                                        (clientsSum || 0) /
                                                        (clientsCount || 1)
                                                    ).toLocaleString("es-PE", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    onViewLeads={fetchLeads}
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
                                                            }}
                                                        >
                                                            <p
                                                                className="mb-1 text-dark fw-bold text-uppercase"
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
                                                                    className="text-muted"
                                                                    style={{
                                                                        fontSize:
                                                                            "11px",
                                                                    }}
                                                                >
                                                                    <strong className="text-dark">
                                                                        Cantidad:
                                                                    </strong>
                                                                </span>
                                                                <span
                                                                    className="fw-bold text-primary"
                                                                    style={{
                                                                        fontSize:
                                                                            "12px",
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
            </div>

            <div className="modal fade" ref={modalRef} tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div
                        className="modal-content border-0 shadow-lg"
                        style={{ borderRadius: "20px" }}
                    >
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold text-dark pt-2 px-2">
                                <i className="mdi mdi-account-group me-2 text-primary"></i>
                                {modalTitle}
                            </h5>
                            <button
                                type="button"
                                className="btn-close me-2"
                                data-bs-dismiss="modal"
                            ></button>
                        </div>
                        <div className="modal-body p-0">
                            <Table
                                gridRef={gridRef}
                                title={modalTitle}
                                rest={leadsRest}
                                height="500px"
                                pageSize={10}
                                allowedPageSizes={[10, 25, 50, 100]}
                                toolBar={() => {}}
                                exportable={true}
                                showDatePicker={false}
                                reloadWith={[
                                    selectedMonth,
                                    selectedCampaignId,
                                    selectedAdSetName,
                                ]}
                                columns={[
                                    {
                                        dataField: "name",
                                        caption: "Lead",
                                        cellTemplate: (container, { data }) => {
                                            ReactAppend(
                                                container,
                                                <div className="d-flex align-items-center gap-2">
                                                    <div
                                                        style={{
                                                            width: "4px",
                                                            height: "24px",
                                                            backgroundColor:
                                                                data.status_color ||
                                                                "#e2e8f0",
                                                            borderRadius: "2px",
                                                        }}
                                                    />
                                                    <span className="fw-bold text-dark">
                                                        {data.name}
                                                    </span>
                                                </div>,
                                            );
                                        },
                                    },
                                    {
                                        dataField: "contact_phone",
                                        caption: "Contacto",
                                        cellTemplate: (container, { data }) => {
                                            container.html(
                                                renderToString(
                                                    <div>
                                                        <div className="text-primary small fw-bold">
                                                            <i className="mdi mdi-phone me-1"></i>
                                                            {data.contact_phone}
                                                        </div>
                                                        <div
                                                            className="text-muted"
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                            }}
                                                        >
                                                            {data.contact_email}
                                                        </div>
                                                    </div>,
                                                ),
                                            );
                                        },
                                    },
                                    {
                                        dataField: "assigned_name",
                                        caption: "Atendido por",
                                        width: 150,
                                        cellTemplate: (container, { data }) => {
                                            if (!data.assigned_name) {
                                                container.html(
                                                    '<span class="text-muted small italic">Sin asignar</span>',
                                                );
                                                return;
                                            }
                                            ReactAppend(
                                                container,
                                                <div className="d-flex align-items-center gap-2">
                                                    <img
                                                        src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned_relative_id}`}
                                                        className="avatar-xs rounded-circle"
                                                        style={{
                                                            width: "24px",
                                                            height: "24px",
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                        }}
                                                    />
                                                    <span className="small text-truncate">
                                                        {data.assigned_name}
                                                    </span>
                                                </div>,
                                            );
                                        },
                                    },
                                    {
                                        dataField: "created_at",
                                        caption: "Fecha",
                                        dataType: "datetime",
                                        format: "dd/MM/yyyy HH:mm",
                                        width: 140,
                                    },
                                    {
                                        dataField: "status_name",
                                        caption: "Estado",
                                        width: 130,
                                        cellTemplate: (container, { data }) => {
                                            ReactAppend(
                                                container,
                                                <span
                                                    className="badge rounded-pill px-2"
                                                    style={{
                                                        backgroundColor: `${data.status_color}15`,
                                                        color: data.status_color,
                                                        border: `1px solid ${data.status_color}33`,
                                                        fontSize: "10px",
                                                    }}
                                                >
                                                    {data.status_name}
                                                </span>,
                                            );
                                        },
                                    },
                                ]}
                            />
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button
                                type="button"
                                className="btn btn-light rounded-pill px-4"
                                data-bs-dismiss="modal"
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
