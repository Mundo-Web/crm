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
                    <div className="col-12">
                        <div
                            className="card border-0 shadow-lg"
                            style={{ borderRadius: "20px", overflow: "hidden" }}
                        >
                            <div className="card-header bg-white border-0 py-4 px-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="mb-1 fw-bold text-dark">
                                            <i className="mdi mdi-rocket-launch text-primary me-2"></i>
                                            Rendimiento Publicitario (Cierres)
                                        </h4>
                                        <p className="text-muted small mb-0">
                                            Detalle granular de ventas agrupado
                                            por estructura de pauta
                                        </p>
                                    </div>
                                    <div className="badge bg-soft-success text-success p-2 px-3 rounded-pill">
                                        <i className="mdi mdi-check-decagram me-1"></i>
                                        Datos Sincronizados
                                    </div>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div
                                    className="table-responsive"
                                    style={{
                                        maxHeight: "800px",
                                        overflowY: "auto",
                                    }}
                                >
                                    <table className="table table-hover align-middle mb-0">
                                        <thead
                                            className="table-light sticky-top"
                                            style={{
                                                top: "0",
                                                zIndex: 10,
                                                boxShadow:
                                                    "0 2px 4px rgba(0,0,0,0.05)",
                                            }}
                                        >
                                            <tr
                                                className="text-uppercase"
                                                style={{
                                                    fontSize: "11px",
                                                    letterSpacing: "1px",
                                                }}
                                            >
                                                <th className="border-0 px-4 py-3 text-muted">
                                                    Lead / Cliente
                                                </th>
                                                <th className="border-0 py-3 text-muted">
                                                    Asesor Responsable
                                                </th>
                                                <th className="border-0 py-3 text-muted">
                                                    Productos & Servicios
                                                </th>
                                                <th className="border-0 text-end px-4 py-3 text-muted">
                                                    Total Venta
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientsList.map((campaign, ci) => (
                                                <React.Fragment key={`c-${ci}`}>
                                                    {campaign.adsets.map(
                                                        (adset, ai) => (
                                                            <React.Fragment
                                                                key={`as-${ci}-${ai}`}
                                                            >
                                                                {adset.ads.map(
                                                                    (
                                                                        ad,
                                                                        adi,
                                                                    ) => (
                                                                        <React.Fragment
                                                                            key={`ad-${ci}-${ai}-${adi}`}
                                                                        >
                                                                            {/* Fila de Jerarquía con Fondo Opaco */}
                                                                            <tr
                                                                                style={{
                                                                                    background:
                                                                                        "rgba(85, 110, 230, 0.08)", // Un azul primario muy suave y opaco
                                                                                }}
                                                                            >
                                                                                <td
                                                                                    colSpan="4"
                                                                                    className="py-2 px-4 shadow-sm"
                                                                                >
                                                                                    <div className="d-flex align-items-center flex-wrap gap-4">
                                                                                        <div className="d-flex align-items-center">
                                                                                            <div className="avatar-xs me-2">
                                                                                                <span className="avatar-title rounded bg-soft-primary text-primary">
                                                                                                    <i className="mdi mdi-bullhorn-variant"></i>
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <small
                                                                                                    className="text-muted d-block"
                                                                                                    style={{
                                                                                                        fontSize:
                                                                                                            "9px",
                                                                                                        fontWeight: 800,
                                                                                                    }}
                                                                                                >
                                                                                                    CAMPAÑA
                                                                                                </small>
                                                                                                <span className="fw-bold text-dark">
                                                                                                    {
                                                                                                        campaign.name
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="d-flex align-items-center">
                                                                                            <div className="avatar-xs me-2">
                                                                                                <span className="avatar-title rounded bg-soft-info text-info">
                                                                                                    <i className="mdi mdi-layers-triple"></i>
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <small
                                                                                                    className="text-muted d-block"
                                                                                                    style={{
                                                                                                        fontSize:
                                                                                                            "9px",
                                                                                                        fontWeight: 800,
                                                                                                    }}
                                                                                                >
                                                                                                    ADSET
                                                                                                </small>
                                                                                                <span className="fw-semibold text-dark">
                                                                                                    {
                                                                                                        adset.name
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="d-flex align-items-center">
                                                                                            <div className="avatar-xs me-2">
                                                                                                <span className="avatar-title rounded bg-soft-success text-success">
                                                                                                    <i className="mdi mdi-advertisements"></i>
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <small
                                                                                                    className="text-muted d-block"
                                                                                                    style={{
                                                                                                        fontSize:
                                                                                                            "9px",
                                                                                                        fontWeight: 800,
                                                                                                    }}
                                                                                                >
                                                                                                    ANUNCIO
                                                                                                    (ADS)
                                                                                                </small>
                                                                                                <span className="fw-medium text-dark">
                                                                                                    {
                                                                                                        ad.name
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            {/* Leads con Estética Premium */}
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
                                                                                            className="animate__animated animate__fadeIn"
                                                                                        >
                                                                                            <td className="px-4 py-3">
                                                                                                <div className="d-flex align-items-center">
                                                                                                    <div className="flex-grow-1">
                                                                                                        <h6
                                                                                                            className="mb-0 fw-bold text-dark"
                                                                                                            style={{
                                                                                                                fontSize:
                                                                                                                    "16px",
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                client.name
                                                                                                            }
                                                                                                        </h6>
                                                                                                        <div className="text-muted small d-flex align-items-center mt-1">
                                                                                                            <span className="badge bg-soft-success text-success p-1 rounded me-2 fs-6">
                                                                                                                <i className="mdi mdi-whatsapp me-1"></i>
                                                                                                                {
                                                                                                                    client.contact_phone
                                                                                                                }
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-3">
                                                                                                <div className="d-flex align-items-center">
                                                                                                    <div className="position-relative">
                                                                                                        <img
                                                                                                            src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${client.assigned?.relative_id}`}
                                                                                                            className="rounded-circle avatar-sm me-2 shadow-sm border border-2 border-white"
                                                                                                            onError={(
                                                                                                                e,
                                                                                                            ) => {
                                                                                                                e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                                                                            }}
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span
                                                                                                            className="fw-semibold text-dark d-block"
                                                                                                            style={{
                                                                                                                fontSize:
                                                                                                                    "16px",
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                client
                                                                                                                    .assigned
                                                                                                                    ?.name
                                                                                                            }
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-3">
                                                                                                <div className="d-flex flex-wrap gap-2">
                                                                                                    {client.products?.map(
                                                                                                        (
                                                                                                            p,
                                                                                                            pi,
                                                                                                        ) => (
                                                                                                            <div
                                                                                                                key={
                                                                                                                    pi
                                                                                                                }
                                                                                                                className="d-flex align-items-center bg-soft-primary border border-primary border-opacity-10 rounded px-2 py-1 shadow-sm"
                                                                                                                style={{
                                                                                                                    fontSize:
                                                                                                                        "14px",
                                                                                                                }}
                                                                                                            >
                                                                                                                <i className="mdi mdi-package-variant-closed text-primary me-1"></i>
                                                                                                                <span className="text-dark fw-medium">
                                                                                                                    {
                                                                                                                        p.name
                                                                                                                    }
                                                                                                                </span>
                                                                                                                {/**        <span className="mx-1 text-muted">|</span>
                                                                                                <span className="text-primary fw-bold">S/.{Number(p.pivot.price).toLocaleString("es-PE")}</span> */}
                                                                                                            </div>
                                                                                                        ),
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="text-end px-4 py-3">
                                                                                                <div className="d-flex flex-column align-items-end">
                                                                                                    <span
                                                                                                        className="text-success fw-bold fs-5"
                                                                                                        style={{
                                                                                                            letterSpacing:
                                                                                                                "-0.5px",
                                                                                                        }}
                                                                                                    >
                                                                                                        S/.{" "}
                                                                                                        {totalClient.toLocaleString(
                                                                                                            "es-PE",
                                                                                                            {
                                                                                                                minimumFractionDigits: 2,
                                                                                                            },
                                                                                                        )}
                                                                                                    </span>
                                                                                                    <small
                                                                                                        className="text-muted"
                                                                                                        style={{
                                                                                                            fontSize:
                                                                                                                "9px",
                                                                                                        }}
                                                                                                    >
                                                                                                        TOTAL
                                                                                                        LIQUIDADO
                                                                                                    </small>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </React.Fragment>
                                                                    ),
                                                                )}
                                                            </React.Fragment>
                                                        ),
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
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
