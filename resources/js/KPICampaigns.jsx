import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Adminto from "./components/Adminto";
import CreateReactScript from "./Utils/CreateReactScript";
import { renderToString } from "react-dom/server";
import KPICampaignsRest from "./actions/KPICampaignsRest";
import SettingsRest from "./actions/SettingsRest";
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
import { DateRange } from 'react-date-range';
import es from 'date-fns/locale/es';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import ReactAppend from "./Utils/ReactAppend";
import axios from "axios";

const settingsRest = new SettingsRest();

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

// ─── Utilidades de fecha ────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, n) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};
const startOfWeek = (weekStartDay = 1) => {
    // weekStartDay: 0=Dom, 1=Lun, ..., 6=Sáb
    const now = new Date();
    const day = now.getDay(); // 0-6
    const diff = (day - weekStartDay + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    return start.toISOString().slice(0, 10);
};

const PLATFORM_OPTIONS = [
    { value: "all", label: "Todos", icon: "mdi-earth", color: "#6366F1" },
    { value: "fb", label: "Facebook", icon: "mdi-facebook", color: "#1877F2" },
    { value: "ig", label: "Instagram", icon: "mdi-instagram", color: "#E4405F" },
    { value: "wa", label: "WhatsApp", icon: "mdi-whatsapp", color: "#25D366" },
];

const KPICampaigns = ({ months = [], currentMonth, currentYear, advisors = [], weekStartDay = 1, exchangeRate = 3.80 }) => {
    const [localWeekStartDay, setLocalWeekStartDay] = useState(weekStartDay);
    const [localExchangeRate, setLocalExchangeRate] = useState(exchangeRate);

    // ─── Estado de filtros ──────────────────────────────────────────────────
    const [dateFrom, setDateFrom] = useState(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
    const [dateTo, setDateTo] = useState(today());
    const [showNoContestanModal, setShowNoContestanModal] = useState(false);
    const [showArchivadosModal, setShowArchivadosModal] = useState(false);
    const [activePreset, setActivePreset] = useState("month");
    
    // Funciones de formato
    const formatNumber = (n) => n.toLocaleString("es-PE");
    const formatCurrency = (n) => `S/ ${(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
    const formatPercentage = (n) => `${n.toFixed(1)}%`;
    const [platform, setPlatform] = useState("all");
    const [advisorId, setAdvisorId] = useState("all");

    // DateRange picker (igual que Table.jsx)
    const datePickerRef = useRef(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [dateRange, setDateRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);

    // ─── Estado de datos ────────────────────────────────────────────────────
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

    // Gasto publicitario
    const [totalSpend, setTotalSpend] = useState(0);
    const [cpl, setCpl] = useState(0);
    const [cpa, setCpa] = useState(0);
    const [roas, setRoas] = useState(0);
    const [syncingSpend, setSyncingSpend] = useState(false);

    // Variaciones vs periodo anterior
    const [variations, setVariations] = useState({});
    const [previousPeriod, setPreviousPeriod] = useState(null);

    // Meta de leads
    const [goalProgress, setGoalProgress] = useState(null);

    // Timeline
    const [leadsByDay, setLeadsByDay] = useState([]);

    const [leadSources, setLeadSources] = useState({});
    const [originCounts, setOriginCounts] = useState([]);
    const [originCampaignCounts, setOriginCampaignCounts] = useState([]);
    const [breakdowns, setBreakdowns] = useState(0);
    const [funnelCounts, setFunnelCounts] = useState({});
    const [originLandingCampaignCounts, setOriginLandingCampaignCounts] = useState([]);
    const [totalArchivedCounts, setTotalArchivedCounts] = useState([]);
    const [archivedLabelsCount, setArchivedLabelsCount] = useState(0);
    const [convertedLabelsCount, setConvertedLabelsCount] = useState(0);
    const [archivedBreakdown, setArchivedBreakdown] = useState([]);
    const [totalConversionPercent, setTotalConversionPercent] = useState(0);

    // Calcular "No Respondieron" basado en fórmula: Contactados - Respondieron
    const noRespondieronCount = managingCount - trueManagingCount;
    const inactivosEnGestion = noRespondieronCount - archivedCount;

    // Seguimos calculando cuántos archivados fueron estrictamente por "no contesta" para dar más detalle
    const noContestanArchived = (archivedBreakdown || [])
        .filter(item => {
            const n = (item.name || "").toLowerCase();
            return n.includes("no contesta") || n.includes("no responde");
        })
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [isModalLoading, setIsModalLoading] = useState(false);

    const gridRef = useRef();
    const modalRef = useRef();
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedAdSetName, setSelectedAdSetName] = useState(null);

    // ─── Computed label del rango activo (Muestra siempre el rango de fechas para evitar redundancias) ───
    const dateRangeLabel = `${dateFrom} → ${dateTo}`;

    // ─── Aplicar preset de fecha ─────────────────────────────────────────────
    const applyPreset = (preset) => {
        setActivePreset(preset);
        const t = today();
        if (preset === "today") {
            setDateFrom(t); setDateTo(t);
        } else if (preset === "yesterday") {
            const y = addDays(t, -1);
            setDateFrom(y); setDateTo(y);
        } else if (preset === "week") {
            const ws = startOfWeek(localWeekStartDay);
            setDateFrom(ws); setDateTo(t);
        } else if (preset === "last_week") {
            const ws = startOfWeek(localWeekStartDay);
            const prevEnd = addDays(ws, -1);
            const prevStart = addDays(ws, -7);
            setDateFrom(prevStart); setDateTo(prevEnd);
        } else if (preset === "month") {
            const d = new Date();
            setDateFrom(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
            setDateTo(t);
        } else if (preset === "last_month") {
            const d = new Date();
            d.setDate(0);
            const lastDay = d.toISOString().slice(0, 10);
            d.setDate(1);
            setDateFrom(d.toISOString().slice(0, 10));
            setDateTo(lastDay);
        }
    };

    // ─── REST: paginación de leads con nuevos filtros ────────────────────────
    const leadsRest = {
        paginate: (params) => {
            return axios
                .post(`/api/dashboard/campaigns/leads/paginate`, {
                    ...params,
                    date_from: dateFrom,
                    date_to: dateTo,
                    platform,
                    advisor_id: advisorId !== "all" ? advisorId : null,
                    campaign_id: selectedCampaignId,
                    adset_name: selectedAdSetName,
                })
                .then((res) => res.data);
        },
    };

    const fetchLeads = (campaignId, campaignName, adSetName) => {
        setModalTitle(`Leads: ${campaignName} / ${adSetName ? adSetName : "Todos"}`);
        setSelectedCampaignId(campaignId);
        setSelectedAdSetName(adSetName);
        setTimeout(() => {
            if (gridRef.current) $(gridRef.current).dxDataGrid("instance").refresh();
        }, 100);
        $(modalRef.current).modal("show");
    };

    // ─── Fetch principal ──────────────────────────────────────────────────────
    const fetchGraph = (from, to, plt, adv) => {
        setLeadSources({});
        setOriginCounts([]);

        KPICampaignsRest.kpi({
            date_from: from,
            date_to: to,
            platform: plt !== "all" ? plt : null,
            advisor_id: adv !== "all" ? adv : null,
        }).then(({ data, summary }) => {
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

            // Gasto
            setTotalSpend(summary.totalSpend ?? 0);
            setCpl(summary.cpl ?? 0);
            setCpa(summary.cpa ?? 0);
            setRoas(summary.roas ?? 0);

            // Comparativa
            setVariations(summary.variations ?? {});
            setPreviousPeriod(summary.previousPeriod ?? null);

            // Meta
            setGoalProgress(summary.goalProgress ?? null);

            // Timeline
            setLeadsByDay(summary.leadsByDay ?? []);

            setLeadSources(summary.leadSources ?? {});
            setOriginCounts(summary.originCounts ?? []);
            setOriginCampaignCounts(summary.originCampaignCounts ?? []);
            setFunnelCounts(summary.funnelCounts ?? {});
            setOriginLandingCampaignCounts(summary.originLandingCampaignCounts ?? []);
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

    // ─── Sync Gasto desde Meta ────────────────────────────────────────────────
    const handleSyncSpend = async () => {
        setSyncingSpend(true);
        try {
            const result = await KPICampaignsRest.syncSpend({ date_from: dateFrom, date_to: dateTo });
            Swal.fire({
                icon: "success",
                title: "Gasto Sincronizado",
                html: `<b>${result?.data?.updated ?? 0}</b> campañas actualizadas.<br/><small class="text-muted">Periodo: ${dateFrom} → ${dateTo}</small>`,
                confirmButtonText: "Recargar datos",
            }).then(() => fetchGraph(dateFrom, dateTo, platform, advisorId));
        } catch (e) {
            Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.message ?? "No se pudo sincronizar." });
        } finally {
            setSyncingSpend(false);
        }
    };

    useEffect(() => {
        fetchGraph(dateFrom, dateTo, platform, advisorId);
    }, [dateFrom, dateTo, platform, advisorId]);

    // Click fuera del DateRange picker — igual que Table.jsx
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // ─── Indicador de variación ↑↓ ─────────────────────────────────────────
    const VariationBadge = ({ value }) => {
        if (value === undefined || value === null) return null;
        const positive = value >= 0;
        return (
            <span
                className={`badge rounded-pill px-2 py-1 ms-2`}
                style={{
                    fontSize: "9px",
                    backgroundColor: positive ? "#10B98115" : "#F43F5E15",
                    color: positive ? "#10B981" : "#F43F5E",
                    border: `1px solid ${positive ? "#10B98133" : "#F43F5E33"}`,
                    fontWeight: 700,
                }}
            >
                {positive ? "↑" : "↓"} {Math.abs(value)}% vs anterior
            </span>
        );
    };

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════
                BARRA DE FILTROS PRO (Premium Toolbar)
            ═══════════════════════════════════════════════════════════════ */}
            <style>{`
                .premium-toolbar {
                    background: #ffffff;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px;
                    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.01);
                    padding: 16px 20px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    transition: all 0.3s ease;
                }
                .segmented-control {
                    display: inline-flex;
                    background: #f8fafc;
                    padding: 4px;
                    border-radius: 14px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                }
                .segmented-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 11.5px;
                    padding: 8px 16px;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .segmented-btn:hover {
                    color: #334155;
                }
                .segmented-btn.active {
                    background: #ffffff;
                    color: #4f46e5;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
                    font-weight: 700;
                }
                .toolbar-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #ffffff;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    color: #475569;
                    font-weight: 600;
                    font-size: 12px;
                    padding: 9px 16px;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
                }
                .toolbar-btn:hover {
                    background: #f8fafc;
                    color: #0f172a;
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 6px rgba(15, 23, 42, 0.04);
                }
                .toolbar-btn:active {
                    transform: translateY(1px);
                }
                .toolbar-btn-primary {
                    background: #4F46E5;
                    border: none;
                    color: #ffffff !important;
                    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
                }
                .toolbar-btn-primary:hover {
                    background: #4338CA;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(79, 70, 229, 0.35);
                }
                .toolbar-btn-primary:active {
                    transform: translateY(1px);
                }
                .toolbar-dropdown .dropdown-menu {
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    background: #ffffff;
                    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
                    padding: 8px;
                    margin-top: 8px !important;
                }
                .toolbar-dropdown .dropdown-item {
                    border-radius: 10px;
                    padding: 8px 12px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                    transition: all 0.2s ease;
                }
                .toolbar-dropdown .dropdown-item:hover {
                    background: #f8fafc;
                    color: #4f46e5;
                }
                .toolbar-divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                    margin: 0 12px;
                    border-radius: 1px;
                }
                .custom-date-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #ffffff;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    padding: 5px 12px;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.02);
                    animation: slideIn 0.3s ease;
                }
                .custom-date-input {
                    border: none;
                    background: transparent;
                    font-size: 11px;
                    font-weight: 600;
                    color: #475569;
                    outline: none;
                    padding: 2px;
                    cursor: pointer;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-15px) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
            
            <div className="row mb-4 align-items-center g-2">

                {/* Selector de Mes — mismo patrón que KPILeads */}
                <div className="col-xxl-2 col-xl-3 col-lg-4 col-md-5 col-sm-6 col-12">
                    <div className="dropdown">
                        <button
                            className="btn btn-light bg-white dropdown-toggle w-100 text-start rounded-pill"
                            type="button"
                            id="monthDropdownCampaigns"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {(() => {
                                const target = months.find(m => {
                                    const [y, mo] = (dateFrom || '').split('-');
                                    return parseInt(m.year) === parseInt(y) && parseInt(m.month) === parseInt(mo);
                                }) || months[0];
                                if (!target) return 'Seleccione un mes';
                                return moment({ month: target.month - 1, year: target.year })
                                    .format('MMMM YYYY')
                                    .toTitleCase();
                            })()}
                        </button>
                        <ul className="dropdown-menu w-100" aria-labelledby="monthDropdownCampaigns" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {months.map((row, index) => {
                                const month = moment({ month: row.month - 1, year: row.year });
                                const mFrom = `${row.year}-${String(row.month).padStart(2, '0')}-01`;
                                const mTo   = month.clone().endOf('month').format('YYYY-MM-DD');
                                return (
                                    <li key={index}>
                                        <a
                                            className="dropdown-item"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setDateFrom(mFrom);
                                                setDateTo(mTo);
                                                setActivePreset(null);
                                            }}
                                        >
                                            <b className="d-block">{month.format('MMMM YYYY').toTitleCase()}</b>
                                            <small><i className="me-1 fa fa-users"></i>{row.quantity} entradas</small>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Hoy / Ayer / Periodo — igual que Table.jsx */}
                <div className="col-auto">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                        {[
                            { key: 'today',     label: 'Hoy' },
                            { key: 'yesterday', label: 'Ayer' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                className={`btn rounded-pill btn-sm fw-semibold ${activePreset === key ? 'btn-primary' : 'btn-light bg-white'}`}
                                style={{ fontSize: '12px', padding: '5px 14px' }}
                                onClick={() => applyPreset(key)}
                            >
                                {label}
                            </button>
                        ))}

                        {/* Botón Periodo con DateRange calendar (igual que Table.jsx) */}
                        <div className="dropdown position-relative" ref={datePickerRef}>
                            <button
                                className={`btn btn-sm rounded-pill fw-semibold position-relative ${isDatePickerOpen || activePreset === 'custom' ? 'btn-primary' : 'btn-light bg-white'}`}
                                style={{ fontSize: '12px', padding: '5px 14px', zIndex: isDatePickerOpen ? 10000 : undefined }}
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            >
                                <i className="mdi mdi-calendar-range me-1"></i>
                                Periodo
                            </button>

                            {isDatePickerOpen && (
                                <>
                                    {/* Overlay oscuro */}
                                    <div
                                        className='position-fixed'
                                        style={{ top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
                                        onClick={() => setIsDatePickerOpen(false)}
                                    ></div>

                                    {/* Calendario flotante */}
                                    <div className="dropdown-menu p-2 show mt-1" style={{ minWidth: '650px', position: 'absolute', left: 0, zIndex: 10000 }}>
                                        <DateRange
                                            editableDateInputs={true}
                                            onChange={item => {
                                                const { startDate, endDate } = item.selection;
                                                setDateRange([item.selection]);
                                                setDateFrom(startDate ? startDate.toISOString().slice(0, 10) : dateFrom);
                                                setDateTo(endDate   ? endDate.toISOString().slice(0, 10)   : dateTo);
                                            }}
                                            moveRangeOnFirstSelection={false}
                                            ranges={dateRange}
                                            locale={es}
                                            months={2}
                                            direction="horizontal"
                                            showDateDisplay={false}
                                        />
                                        <div className="d-flex justify-content-end gap-2 mt-2">
                                            <button className="btn btn-sm btn-danger" onClick={() => {
                                                setIsDatePickerOpen(false);
                                                applyPreset('month');
                                            }}>
                                                <i className="mdi mdi-filter-remove me-1"></i>Limpiar
                                            </button>
                                            <button className="btn btn-sm btn-primary" onClick={() => {
                                                setActivePreset('custom');
                                                setIsDatePickerOpen(false);
                                                fetchGraph(dateFrom, dateTo, platform, advisorId);
                                            }}>
                                                <i className="mdi mdi-filter me-1"></i>Filtrar
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Acciones: Refresh + Settings + Sync — al extremo derecho */}
                <div className="col-auto ms-auto">
                    <div className="d-flex gap-2 align-items-center">

                        {/* Botón Refrescar */}
                        <button
                            className="btn btn-light rounded-pill"
                            type="button"
                            onClick={() => fetchGraph(dateFrom, dateTo, platform, advisorId)}
                            title="Refrescar"
                        >
                            <i className="mdi mdi-refresh"></i>
                        </button>

                        {/* Engranaje de Configuración */}
                        <div className="dropdown">
                            <button className="btn btn-light rounded-pill dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Configuración">
                                <i className="mdi mdi-cog"></i>
                            </button>
                            <div className="dropdown-menu shadow-lg p-3" style={{ minWidth: '240px', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '16px', right: 0, left: 'auto' }}>
                                <h6 className="dropdown-header px-0 py-1 text-dark fw-bold mb-2">Configuración</h6>
                                <div className="mb-2">
                                    <label className="form-label text-muted mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Inicio de Semana</label>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
                                        value={localWeekStartDay}
                                        onChange={async (e) => {
                                            const val = parseInt(e.target.value);
                                            setLocalWeekStartDay(val);
                                            await SettingsRest.save({ 'campaign-week-start-day': val });
                                        }}
                                    >
                                        <option value="0">Domingo</option>
                                        <option value="1">Lunes</option>
                                        <option value="2">Martes</option>
                                        <option value="3">Miércoles</option>
                                        <option value="4">Jueves</option>
                                        <option value="5">Viernes</option>
                                        <option value="6">Sábado</option>
                                    </select>
                                </div>
                                <hr className="my-2" style={{ opacity: 0.1 }} />
                                <div>
                                    <label className="form-label text-muted mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Tipo de Cambio (1 USD = PEN)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control form-control-sm"
                                        style={{ fontSize: '12px', borderRadius: '8px' }}
                                        value={localExchangeRate}
                                        onChange={(e) => setLocalExchangeRate(e.target.value)}
                                        onBlur={async () => {
                                            const val = parseFloat(localExchangeRate);
                                            if (val > 0) {
                                                await SettingsRest.save({ 'exchange-rate-usd-pen': val });
                                                fetchGraph(dateFrom, dateTo, platform, advisorId);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sync Gasto */}
                        <button
                            className="btn btn-primary rounded-pill btn-sm fw-semibold px-3"
                            onClick={handleSyncSpend}
                            disabled={syncingSpend}
                        >
                            {syncingSpend
                                ? <><i className="mdi mdi-loading mdi-spin me-1"></i>Syncing...</>
                                : <><i className="mdi mdi-currency-usd me-1"></i>Sync Gasto</>
                            }
                        </button>

                        {/* Plataforma — temporalmente oculto */}
                        <div style={{ display: 'none' }}>
                            {PLATFORM_OPTIONS.map(({ value }) => (
                                <span key={value} onClick={() => setPlatform(value)}></span>
                            ))}
                        </div>
                        {/* Asesor — temporalmente oculto */}
                        <span style={{ display: 'none' }} onClick={() => setAdvisorId('all')}></span>
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

            {/* ═══════════════════════════════════════════════════════════════
                BARRA DE PROGRESO DE META
            ═══════════════════════════════════════════════════════════════ */}
            {goalProgress && (
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)" }}>
                    <div className="card-body py-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <i className="mdi mdi-flag-checkered text-primary fs-5"></i>
                                <span className="fw-bold text-dark" style={{ fontSize: "13px" }}>Meta del periodo</span>
                                <span className="badge bg-soft-primary text-primary rounded-pill px-2" style={{ fontSize: "10px" }}>
                                    {goalProgress.target.toLocaleString("es-PE")} leads objetivo
                                </span>
                            </div>
                            <span className="fw-bold" style={{ fontSize: "22px", color: goalProgress.percent >= 100 ? "#10B981" : "#6366F1" }}>
                                {goalProgress.percent}%
                            </span>
                        </div>
                        <div className="progress rounded-pill" style={{ height: "10px", backgroundColor: "#e2e8f0" }}>
                            <div
                                className="progress-bar rounded-pill"
                                style={{
                                    width: `${Math.min(goalProgress.percent, 100)}%`,
                                    background: goalProgress.percent >= 100
                                        ? "linear-gradient(90deg, #10B981, #059669)"
                                        : "linear-gradient(90deg, #6366F1, #8B5CF6)",
                                    transition: "width 0.8s ease",
                                }}
                            ></div>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                            <small className="text-muted" style={{ fontSize: "10px" }}>
                                {goalProgress.current.toLocaleString("es-PE")} leads captados
                            </small>
                            <small className="text-muted" style={{ fontSize: "10px" }}>
                                Faltan {Math.max(0, goalProgress.target - goalProgress.current).toLocaleString("es-PE")} leads
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {(() => {
                
                // ─── Modal No Contestan ──────────────────────────────────────────────────

                return (
                    <>
                        <style>{`
                            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
                            .bento-card {
                                font-family: 'Plus Jakarta Sans', sans-serif;
                                border-radius: 24px;
                                padding: 24px;
                                color: #ffffff !important;
                                position: relative;
                                overflow: hidden;
                                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                                z-index: 1;
                                border: 1px solid rgba(255,255,255,0.2);
                            }
                            .bento-card.clickable:hover { transform: translateY(-8px) scale(1.02); cursor: pointer; }
                            .bento-card:hover:not(.clickable) { transform: translateY(-8px) scale(1.02); }
                            .bento-title {
                                color: #ffffff !important;
                                font-size: 16px;
                                font-weight: 800;
                                text-transform: uppercase;
                                letter-spacing: 1.5px;
                                opacity: 0.95;
                                margin-bottom: 16px;
                                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            .bento-value {
                                color: #ffffff !important;
                                font-size: 38px;
                                font-weight: 800;
                                letter-spacing: -1.5px;
                                line-height: 1.1;
                                margin-bottom: 4px;
                                text-shadow: 0 2px 10px rgba(0,0,0,0.15);
                            }
                            .bento-subtitle {
                                color: #ffffff !important;
                                font-size: 12px;
                                font-weight: 600;
                                opacity: 0.8;
                            }
                            .bento-icon-bg {
                                position: absolute;
                                right: -15px;
                                bottom: -20px;
                                font-size: 110px;
                                opacity: 0.15;
                                transform: rotate(-10deg);
                                z-index: -1;
                            }
                            .bento-icon-sm {
                                width: 42px;
                                height: 42px;
                                border-radius: 12px;
                                background: rgba(255,255,255,0.25);
                                backdrop-filter: blur(10px);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 22px;
                                color: #ffffff !important;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            }
                        `}</style>
                        
                        <div className="row g-3 mb-3 mt-0">
                            {[
                                { title: "Total Leads", value: formatNumber(totalCount), icon: "mdi-account-multiple", grad: "linear-gradient(135deg, #6366F1, #818CF8)", shadow: "rgba(99, 102, 241, 0.4)" },
                                { title: "Contactados", value: formatNumber(managingCount), icon: "mdi-phone", grad: "linear-gradient(135deg, #F59E0B, #FBBF24)", shadow: "rgba(245, 158, 11, 0.4)" },
                                { title: "Respondieron", value: formatNumber(trueManagingCount), icon: "mdi-account-clock", grad: "linear-gradient(135deg, #0EA5E9, #38BDF8)", shadow: "rgba(14, 165, 233, 0.4)" },
                                { title: "No Respondieron", value: formatNumber(noRespondieronCount), icon: "mdi-phone-missed", grad: "linear-gradient(135deg, #EF4444, #F87171)", shadow: "rgba(239, 68, 68, 0.4)", onClick: () => setShowNoContestanModal(true) },
                                /* { title: "Archivados", value: formatNumber(archivedCount), icon: "mdi-account-off", grad: "linear-gradient(135deg, #64748B, #94A3B8)", shadow: "rgba(100, 116, 139, 0.4)" }, */
                                { title: "Ventas", value: formatNumber(clientsCount), icon: "mdi-trophy", grad: "linear-gradient(135deg, #10B981, #34D399)", shadow: "rgba(16, 185, 129, 0.4)" },
                                { title: "Conversión", value: formatPercentage((clientsCount / totalCount) * 100 || 0), icon: "mdi-percent", grad: "linear-gradient(135deg, #8B5CF6, #A78BFA)", shadow: "rgba(139, 92, 246, 0.4)" },
                            ].map((k, i) => (
                                <div key={i} className="col-md-6 col-xl">
                                    <div 
                                        className={`bento-card h-100 ${k.onClick ? 'clickable' : ''}`} 
                                        style={{ background: k.grad, boxShadow: `0 15px 35px -10px ${k.shadow}` }}
                                        onClick={k.onClick}
                                    >
                                        <i className={`mdi ${k.icon} bento-icon-bg`}></i>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h3 className="mb-0 bento-title">{k.title}</h3>
                                            <div className="bento-icon-sm">
                                                <i className={`mdi ${k.icon}`}></i>
                                            </div>
                                        </div>
                                        <h2 className="bento-value">{k.value}</h2>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ─── Fila 2: Cards de Gasto Publicitario (Meta Ads) ─── */}
                        {(totalSpend > 0 || cpl > 0) && (
                            <div className="row g-3 mb-3">
                                {[
                                    { title: "Gasto Meta Ads", value: formatCurrency(totalSpend), sub: "", icon: "mdi-currency-usd", grad: "linear-gradient(135deg, #3B82F6, #60A5FA)", shadow: "rgba(59, 130, 246, 0.4)" },
                                    { title: "CPL (Costo por Lead)", value: formatCurrency(cpl), sub: "Gasto / Total Leads", icon: "mdi-account-cash", grad: "linear-gradient(135deg, #F59E0B, #FBBF24)", shadow: "rgba(245, 158, 11, 0.4)" },
                                    { title: "CPA (Costo por Venta)", value: formatCurrency(cpa), sub: "Gasto / Ventas Cerradas", icon: "mdi-handshake", grad: "linear-gradient(135deg, #10B981, #34D399)", shadow: "rgba(16, 185, 129, 0.4)" },
                                    { title: "ROAS", value: `${(roas || 0).toFixed(2)}x`, sub: `S/ ${(totalSpend || 0).toLocaleString("es-PE", { minimumFractionDigits: 0 })} gastados`, icon: "mdi-chart-line", grad: "linear-gradient(135deg, #8B5CF6, #A78BFA)", shadow: "rgba(139, 92, 246, 0.4)" },
                                ].map((k, i) => (
                                    <div key={i} className="col-md-6 col-xl-3">
                                        <div className="bento-card h-100" style={{ background: k.grad, boxShadow: `0 15px 35px -10px ${k.shadow}` }}>
                                            <i className={`mdi ${k.icon} bento-icon-bg`}></i>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h3 className="mb-0 bento-title">{k.title}</h3>
                                                <div className="bento-icon-sm">
                                                    <i className={`mdi ${k.icon}`}></i>
                                                </div>
                                            </div>
                                            <h2 className="bento-value">{k.value}</h2>
                                            {k.sub && <div className="bento-subtitle">{k.sub}</div>}
                                            {i === 0 && <div className="position-absolute" style={{ top: "20px", right: "20px", zIndex: 1 }}><VariationBadge value={variations?.spend} /></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
                                                | {dateRangeLabel}
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
            <div className="d-flex align-items-center mb-4 mt-4 px-1" id="detalle-desestimados">
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
                                toolBar={() => { }}
                                exportable={true}
                                showDatePicker={false}
                                reloadWith={[
                                    dateFrom,
                                    dateTo,
                                    platform,
                                    advisorId,
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
                                    {
                                        dataField: "manage_status_name",
                                        caption: "Etiqueta",
                                        width: 130,
                                        cellTemplate: (container, { data }) => {
                                            if (!data.manage_status_name) {
                                                container.html(
                                                    '<span class="badge rounded-pill px-2" style="background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; font-size: 10px;">Sin etiqueta</span>'
                                                );
                                                return;
                                            }
                                            ReactAppend(
                                                container,
                                                <span
                                                    className="badge rounded-pill px-2"
                                                    style={{
                                                        backgroundColor: `${data.manage_status_color}15`,
                                                        color: data.manage_status_color,
                                                        border: `1px solid ${data.manage_status_color}33`,
                                                        fontSize: "10px",
                                                    }}
                                                >
                                                    {data.manage_status_name}
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

            {/* Modal: Breakdown "No Contestan" */}
            {showNoContestanModal && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1055 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold">Detalle "No Respondieron"</h5>
                                <button type="button" className="btn-close" onClick={() => setShowNoContestanModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-4 text-center">
                                    De un total de <strong>{formatNumber(noRespondieronCount)}</strong> leads (Contactados - Respondieron).
                                </p>

                                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-sm d-flex align-items-center justify-content-center rounded-circle" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" }}>
                                            <i className="mdi mdi-phone-in-talk fs-4"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Sin Respuesta (En Gestión)</h6>
                                            <small className="text-muted">Aún intentando contactar</small>
                                        </div>
                                    </div>
                                    <h4 className="mb-0 fw-bold text-dark">{formatNumber(inactivosEnGestion)}</h4>
                                </div>

                                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-sm d-flex align-items-center justify-content-center rounded-circle" style={{ background: "rgba(100, 116, 139, 0.15)", color: "#64748B" }}>
                                            <i className="mdi mdi-account-off fs-4"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Ya Archivados</h6>
                                            <small className="text-muted">{formatNumber(noContestanArchived)} por "No contesta", el resto por otros motivos</small>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <h4 className="mb-1 fw-bold text-dark">{formatNumber(archivedCount)}</h4>
                                        <button 
                                            className="btn btn-sm btn-outline-secondary rounded-pill" 
                                            style={{ fontSize: "10px", padding: "2px 8px" }}
                                            onClick={() => {
                                                setShowNoContestanModal(false);
                                                setTimeout(() => {
                                                    const el = document.getElementById('detalle-desestimados');
                                                    if (el) {
                                                        const y = el.getBoundingClientRect().top + window.scrollY - 100;
                                                        if (typeof $ !== 'undefined') {
                                                            $("html, body").animate({ scrollTop: y }, 800, "swing");
                                                        } else {
                                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                                        }
                                                    }
                                                }, 300);
                                            }}
                                        >
                                            Ver Detalle
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 justify-content-center">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowNoContestanModal(false)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Breakdown "Archivados" */}
            {showArchivadosModal && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1055 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold">Detalle "Archivados"</h5>
                                <button type="button" className="btn-close" onClick={() => setShowArchivadosModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-4 text-center">
                                    De un total de <strong>{formatNumber(archivedCount)}</strong> leads archivados.
                                </p>

                                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-sm d-flex align-items-center justify-content-center rounded-circle" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444" }}>
                                            <i className="mdi mdi-phone-missed fs-4"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Por "No Contesta"</h6>
                                            <small className="text-muted">Nunca respondieron</small>
                                        </div>
                                    </div>
                                    <h4 className="mb-0 fw-bold text-dark">{noContestanArchived}</h4>
                                </div>

                                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-sm d-flex align-items-center justify-content-center rounded-circle" style={{ background: "rgba(100, 116, 139, 0.15)", color: "#64748B" }}>
                                            <i className="mdi mdi-archive fs-4"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">Por Otros Motivos</h6>
                                            <small className="text-muted">Filtro, Presupuesto, etc.</small>
                                        </div>
                                    </div>
                                    <h4 className="mb-0 fw-bold text-dark">{archivedCount - noContestanArchived}</h4>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 justify-content-center">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowArchivadosModal(false)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
