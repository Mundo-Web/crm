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
    Line,
    LineChart,
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
    const [totalSpendUsd, setTotalSpendUsd] = useState(0);
    const [cpl, setCpl] = useState(0);
    const [cplUsd, setCplUsd] = useState(0);
    const [cpa, setCpa] = useState(0);
    const [cpaUsd, setCpaUsd] = useState(0);
    const [roas, setRoas] = useState(0);
    const [usdExchangeRate, setUsdExchangeRate] = useState(3.80);
    const [showSpendModal, setShowSpendModal] = useState(false);
    const [syncingSpend, setSyncingSpend] = useState(false);
    const [spendsLoading, setSpendsLoading] = useState(false);

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
    const [backendNoRespondieronCount, setBackendNoRespondieronCount] = useState(null);

    const [contactedBreakdown, setContactedBreakdown] = useState([]);
    const [respondedBreakdown, setRespondedBreakdown] = useState([]);
    const [unrespondedBreakdown, setUnrespondedBreakdown] = useState([]);
    const [salesBreakdown, setSalesBreakdown] = useState([]);
    const [totalLeadsBreakdown, setTotalLeadsBreakdown] = useState([]);
    const [cardDetailModal, setCardDetailModal] = useState(null);

    const [unrespondedActiveCount, setUnrespondedActiveCount] = useState(0);
    const [unrespondedArchivedCount, setUnrespondedArchivedCount] = useState(0);

    // Calcular "No Respondieron" basado en backend o en fórmula fallback: Contactados - Respondieron
    const noRespondieronCount = backendNoRespondieronCount !== null && backendNoRespondieronCount !== undefined
        ? backendNoRespondieronCount
        : (managingCount - trueManagingCount);
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

    // Evolución Semanal
    const [weeklyEvolution, setWeeklyEvolution] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const getAdjustedDates = (from, to) => {
        if (!from || !to) return { date_from: from, date_to: to };

        // Return exactly the selected YYYY-MM-DD dates without any local timezone shift
        // The backend will properly interpret these in America/Los_Angeles timezone (Meta's default)
        // and convert them to the CRM's local timezone (America/Lima) for querying.
        return {
            date_from: from,
            date_to: to
        };
    };

    // ─── REST: paginación de leads con nuevos filtros ────────────────────────
    const leadsRest = {
        paginate: (params) => {
            const adjusted = getAdjustedDates(dateFrom, dateTo);
            return axios
                .post(`/api/dashboard/campaigns/leads/paginate`, {
                    ...params,
                    date_from: adjusted.date_from,
                    date_to: adjusted.date_to,
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
    // ─── Fetch principal ──────────────────────────────────────────────────────
    const fetchSpendsOnly = (from, to, plt, adv, startDay = localWeekStartDay) => {
        const adjusted = getAdjustedDates(from, to);
        KPICampaignsRest.kpi({
            date_from: adjusted.date_from,
            date_to: adjusted.date_to,
            platform: plt !== "all" ? plt : null,
            advisor_id: adv !== "all" ? adv : null,
            exclude_spend: 0,
            weekStartDay: startDay !== undefined ? startDay : localWeekStartDay,
        }).then(({ summary }) => {
            setTotalSpend(summary.totalSpend ?? 0);
            setCpl(summary.cpl ?? 0);
            setCpa(summary.cpa ?? 0);
            setRoas(summary.roas ?? 0);
            setWeeklyEvolution(summary.weeklyEvolution ?? []);
            setSpendsLoading(false);
        }).catch((err) => {
            console.error("Error fetching spends:", err);
            setSpendsLoading(false);
        });
    };

    const fetchGraph = (from, to, plt, adv, skipSpend = false, silent = false, startDay = localWeekStartDay) => {
        if (!silent) {
            setLoading(true);
            setLeadSources({});
            setOriginCounts([]);
        }
        if (skipSpend) {
            setSpendsLoading(true);
        }

        const adjusted = getAdjustedDates(from, to);

        KPICampaignsRest.kpi({
            date_from: adjusted.date_from,
            date_to: adjusted.date_to,
            platform: plt !== "all" ? plt : null,
            advisor_id: adv !== "all" ? adv : null,
            exclude_spend: skipSpend ? 1 : 0,
            weekStartDay: startDay !== undefined ? startDay : localWeekStartDay,
        }).then(({ data, summary }) => {
            setGroupedByManageStatus(data);
            setGrouped(summary.grouped ?? []);

            setTotalCount(summary.totalCount ?? 0);
            setPendingCount(summary.pendingCount ?? 0);
            setClientsCount(summary.clientsCount ?? 0);
            setArchivedCount(summary.archivedCount ?? 0);
            setTrueManagingCount(summary.trueManagingCount ?? 0);
            setManagingCount(summary.managingCount ?? 0);
            setBackendNoRespondieronCount(summary.noRespondieronCount ?? null);

            setContactedBreakdown(summary.contactedBreakdown ?? []);
            setRespondedBreakdown(summary.respondedBreakdown ?? []);
            setUnrespondedBreakdown(summary.unrespondedBreakdown ?? []);
            setSalesBreakdown(summary.salesBreakdown ?? []);
            setTotalLeadsBreakdown(summary.totalLeadsBreakdown ?? []);

            setUnrespondedActiveCount(summary.unrespondedActiveCount ?? 0);
            setUnrespondedArchivedCount(summary.unrespondedArchivedCount ?? 0);

            setTotalSum(summary.totalSum ?? 0);
            setClientsSum(summary.clientsSum ?? 0);
            setArchivedSum(summary.archivedSum ?? 0);
            setManagingSum(summary.managingSum ?? 0);

            // Gasto
            if (!skipSpend) {
                setTotalSpend(summary.totalSpend ?? 0);
                setTotalSpendUsd(summary.totalSpendUsd ?? 0);
                setCpl(summary.cpl ?? 0);
                setCplUsd(summary.cplUsd ?? 0);
                setCpa(summary.cpa ?? 0);
                setCpaUsd(summary.cpaUsd ?? 0);
                setRoas(summary.roas ?? 0);
                setUsdExchangeRate(summary.exchangeRate ?? 3.80);
                setWeeklyEvolution(summary.weeklyEvolution ?? []);
                setSpendsLoading(false);
            } else {
                setWeeklyEvolution(summary.weeklyEvolution ?? []);
                fetchSpendsOnly(from, to, plt, adv);
            }

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

            if (!silent) {
                setLoading(false);
            }
        }).catch((err) => {
            console.error("Error fetching KPI graph:", err);
            setLoading(false);
            setSpendsLoading(false);
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
        // Carga los datos instantáneamente usando el cache local/DB (omitiendo gasto al inicio para rapidez)
        fetchGraph(dateFrom, dateTo, platform, advisorId, true);

        // Dispara la sincronización en segundo plano después de 1.5 segundos (sin bloquear al usuario)
        const runBackgroundSync = async () => {
            try {
                await axios.post("/api/dashboard/campaigns/sync-spend", {
                    date_from: dateFrom,
                    date_to: dateTo
                });
                // Actualiza silenciosamente los datos incluyendo el gasto cuando la sincronización termina (usando silent = true)
                fetchGraph(dateFrom, dateTo, platform, advisorId, false, true);
            } catch (e) {
                console.warn("Sincronización en segundo plano falló:", e);
            }
        };

        const timer = setTimeout(runBackgroundSync, 1500);
        return () => clearTimeout(timer);
    }, [dateFrom, dateTo, platform, advisorId, localWeekStartDay]);

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
                                const mTo = month.clone().endOf('month').format('YYYY-MM-DD');
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
                            { key: 'today', label: 'Hoy' },
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
                                                setDateTo(endDate ? endDate.toISOString().slice(0, 10) : dateTo);
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
                                            await settingsRest.save({ name: 'campaign-week-start-day', value: val });
                                            fetchGraph(dateFrom, dateTo, platform, advisorId);
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
                            </div>
                        </div>

                        {/* Tipo de Cambio: gestionado automáticamente por API Luna — oculto */}
                        {/* Sync Gasto: ahora automático al cargar datos */}

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
                            @keyframes skeleton-loading {
                                0% { background-position: 100% 50%; }
                                100% { background-position: 0 50%; }
                            }
                            .skeleton-item {
                                background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 37%, #e2e8f0 63%);
                                background-size: 400% 100%;
                                animation: skeleton-loading 1.4s ease infinite;
                                border-radius: 8px;
                            }
                            .skeleton-item-dark {
                                background: linear-gradient(90deg, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.24) 37%, rgba(255,255,255,0.12) 63%);
                                background-size: 400% 100%;
                                animation: skeleton-loading 1.4s ease infinite;
                                border-radius: 8px;
                            }
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

                        {/* ─── Fila 1: Cards Principales de Conversión ─── */}
                        <div className="row g-3 mb-3">
                            {[
                                { title: "Total Leads", value: formatNumber(totalCount), icon: "mdi-account-group", grad: "linear-gradient(135deg, #6366F1, #818CF8)", shadow: "rgba(99, 102, 241, 0.4)", onClick: () => setCardDetailModal({ title: 'Detalle de "Total Leads"', count: totalCount, breakdown: totalLeadsBreakdown, color: '#6366F1' }), tooltip: `Total Leads: ${formatNumber(totalCount)} (Haz clic para ver el desglose por etiquetas)` },
                                { title: "Contactados", value: formatNumber(managingCount), icon: "mdi-phone", grad: "linear-gradient(135deg, #F59E0B, #FBBF24)", shadow: "rgba(245, 158, 11, 0.4)", onClick: () => setCardDetailModal({ title: 'Detalle de "Leads Contactados"', count: managingCount, breakdown: contactedBreakdown, color: '#F59E0B' }), tooltip: contactedBreakdown.length > 0 ? contactedBreakdown.map(b => `${b.name}: ${b.quantity}`).join(' | ') : 'Haz clic para ver el desglose por etiquetas' },
                                { title: "Respondieron", value: formatNumber(trueManagingCount), icon: "mdi-account-clock", grad: "linear-gradient(135deg, #0EA5E9, #38BDF8)", shadow: "rgba(14, 165, 233, 0.4)", onClick: () => setCardDetailModal({ title: 'Detalle de "Leads que Respondieron"', count: trueManagingCount, breakdown: respondedBreakdown, color: '#0EA5E9' }), tooltip: respondedBreakdown.length > 0 ? respondedBreakdown.map(b => `${b.name}: ${b.quantity}`).join(' | ') : 'Haz clic para ver el desglose por etiquetas' },
                                { title: "No Respondieron", value: formatNumber(noRespondieronCount), icon: "mdi-phone-missed", grad: "linear-gradient(135deg, #EF4444, #F87171)", shadow: "rgba(239, 68, 68, 0.4)", onClick: () => setCardDetailModal({ title: 'Detalle de "Leads que No Respondieron"', count: noRespondieronCount, activeCount: unrespondedActiveCount, archivedCount: unrespondedArchivedCount, breakdown: unrespondedBreakdown, color: '#EF4444', isUnresponded: true }), tooltip: unrespondedBreakdown.length > 0 ? unrespondedBreakdown.map(b => `${b.name}: ${b.quantity}`).join(' | ') : 'Haz clic para ver el desglose por etiquetas' },
                                { title: "Ventas", value: formatNumber(clientsCount), icon: "mdi-trophy", grad: "linear-gradient(135deg, #10B981, #34D399)", shadow: "rgba(16, 185, 129, 0.4)", onClick: () => setCardDetailModal({ title: 'Detalle de "Ventas / Clientes Cerrados"', count: clientsCount, breakdown: salesBreakdown, color: '#10B981' }), tooltip: salesBreakdown.length > 0 ? salesBreakdown.map(b => `${b.name}: ${b.quantity}`).join(' | ') : 'Haz clic para ver el desglose de Ventas' },
                                { title: "Conversión", value: formatPercentage((clientsCount / totalCount) * 100 || 0), icon: "mdi-percent", grad: "linear-gradient(135deg, #8B5CF6, #A78BFA)", shadow: "rgba(139, 92, 246, 0.4)", onClick: () => setCardDetailModal({ title: 'Detalle de "Tasa de Conversión"', count: clientsCount, breakdown: salesBreakdown, color: '#8B5CF6' }), tooltip: `Tasa de Conversión: ${((clientsCount / totalCount) * 100 || 0).toFixed(1)}%` },
                            ].map((k, i) => (
                                <div key={i} className="col-md-6 col-xl">
                                    <div
                                        className={`bento-card h-100 ${k.onClick && !loading ? 'clickable' : ''}`}
                                        style={{ background: k.grad, boxShadow: `0 15px 35px -10px ${k.shadow}` }}
                                        onClick={!loading ? k.onClick : undefined}
                                        title={k.tooltip}
                                    >
                                        <i className={`mdi ${k.icon} bento-icon-bg`}></i>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h3 className="mb-0 bento-title">{k.title}</h3>
                                            <div className="bento-icon-sm">
                                                <i className={`mdi ${k.icon}`}></i>
                                            </div>
                                        </div>
                                        {loading ? (
                                            <div className="skeleton-item-dark" style={{ height: '38px', width: '95px', margin: '4px 0' }}></div>
                                        ) : (
                                            <h2 className="bento-value">{k.value}</h2>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ─── Fila 2: Cards de Gasto Publicitario (Meta Ads) ─── */}
                        {(loading || spendsLoading || totalSpend > 0 || cpl > 0) && (
                            <div className="row g-3 mb-3">
                                {[
                                    { title: "Gasto Meta Ads", value: formatCurrency(totalSpend), sub: `$ ${formatNumber(totalSpendUsd)} USD (T.C. S/ ${usdExchangeRate})`, icon: "mdi-currency-usd", grad: "linear-gradient(135deg, #3B82F6, #60A5FA)", shadow: "rgba(59, 130, 246, 0.4)", onClick: () => setShowSpendModal(true), tooltip: `Gasto: S/ ${formatNumber(totalSpend)} PEN = $ ${formatNumber(totalSpendUsd)} USD (T.C. S/ ${usdExchangeRate})` },
                                    { title: "CPL (Costo por Lead)", value: formatCurrency(cpl), sub: `$ ${formatNumber(cplUsd)} USD / Lead`, icon: "mdi-account-cash", grad: "linear-gradient(135deg, #F59E0B, #FBBF24)", shadow: "rgba(245, 158, 11, 0.4)", onClick: () => setShowSpendModal(true), tooltip: `CPL: S/ ${formatNumber(cpl)} PEN = $ ${formatNumber(cplUsd)} USD / Lead` },
                                    { title: "CPA (Costo por Venta)", value: formatCurrency(cpa), sub: `$ ${formatNumber(cpaUsd)} USD / Cierre`, icon: "mdi-handshake", grad: "linear-gradient(135deg, #10B981, #34D399)", shadow: "rgba(16, 185, 129, 0.4)", onClick: () => setShowSpendModal(true), tooltip: `CPA: S/ ${formatNumber(cpa)} PEN = $ ${formatNumber(cpaUsd)} USD / Cierre` },
                                    { title: "ROAS", value: `${(roas || 0).toFixed(2)}x`, sub: "Retorno (Ventas / Inversión)", icon: "mdi-chart-line", grad: "linear-gradient(135deg, #8B5CF6, #A78BFA)", shadow: "rgba(139, 92, 246, 0.4)", onClick: () => setShowSpendModal(true), tooltip: `ROAS: ${(roas || 0).toFixed(2)}x` },
                                ].map((k, i) => (
                                    <div key={i} className="col-md-6 col-xl-3">
                                        <div
                                            className={`bento-card h-100 ${!loading && !spendsLoading ? 'clickable' : ''}`}
                                            style={{ background: k.grad, boxShadow: `0 15px 35px -10px ${k.shadow}` }}
                                            onClick={!loading && !spendsLoading ? k.onClick : undefined}
                                            title={k.tooltip}
                                        >
                                            <i className={`mdi ${k.icon} bento-icon-bg`}></i>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h3 className="mb-0 bento-title">{k.title}</h3>
                                                <div className="bento-icon-sm">
                                                    <i className={`mdi ${k.icon}`}></i>
                                                </div>
                                            </div>
                                            {(loading || spendsLoading) ? (
                                                <div className="skeleton-item-dark" style={{ height: '38px', width: '105px', margin: '4px 0' }}></div>
                                            ) : (
                                                <h2 className="bento-value">{k.value}</h2>
                                            )}
                                            {k.sub && (
                                                <div className="bento-subtitle">
                                                    {(loading || spendsLoading) ? (
                                                        <div className="skeleton-item-dark" style={{ height: '14px', width: '130px', marginTop: '4px' }}></div>
                                                    ) : (
                                                        k.sub
                                                    )}
                                                </div>
                                            )}
                                            {!loading && !spendsLoading && i === 0 && <div className="position-absolute" style={{ top: "20px", right: "20px", zIndex: 1 }}><VariationBadge value={variations?.spend} /></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                );
            })()}

            <div className="d-flex align-items-center mt-4 px-1">
                <div>
                    <h3
                        className="mb-0 fw-bold text-dark"
                        style={{ letterSpacing: "-0.5px" }}
                    >
                        Evolución semanal
                    </h3>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                TABLA DE EVOLUCIÓN SEMANAL
            ═══════════════════════════════════════════════════════════ */}
            {weeklyEvolution.length > 1 && (() => {
                const weekDayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const startDayName = weekDayNames[localWeekStartDay] ?? 'Lunes';
                const endDayName = weekDayNames[localWeekStartDay === 0 ? 6 : localWeekStartDay - 1] ?? 'Domingo';

                // Detectar el mes y año del rango para el título
                const [fy, fm] = dateFrom.split('-');
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const monthLabel = `${monthNames[parseInt(fm, 10) - 1] ?? ''} ${fy}`;

                const chartData = weeklyEvolution.map(wk => ({
                    name: wk.label,
                    pctContact: wk.pctContact ?? 0,
                    pctCierre: wk.pctCierre ?? 0,
                    roas: wk.roas ?? 0
                }));

                const fmtNum = (n) => (n ?? 0).toLocaleString('es-PE');
                const fmtMon = (n) => `${(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const fmtPct = (n) => `${(n ?? 0).toFixed(1)}%`;
                const fmtRoas = (n) => `${(n ?? 0).toFixed(2)}x`;

                const deltaBadge = (val) => {
                    if (val === null || val === undefined) return <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>—</span>;
                    if (val === 0) return <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>0</span>;
                    const isPositive = val > 0;
                    const bg = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
                    const color = isPositive ? '#10B981' : '#EF4444';
                    const prefix = isPositive ? '+' : '';
                    return (
                        <span className="badge" style={{ backgroundColor: bg, color, fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            {prefix}{val}
                        </span>
                    );
                };

                return (<>
                    <div className="card border-0 mb-5" style={{ marginTop: '28px', borderRadius: '24px', boxShadow: '0 15px 30px -10px rgba(29, 78, 216, 0.25)', border: '1px solid rgba(59, 130, 246, 0.15)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {/* Header Premium - Estilo Bento KPI Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            padding: '22px 28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'relative',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px'
                        }}>
                            {/* Watermark icon like KPI cards */}
                            <i className="mdi mdi-calendar-month-outline" style={{
                                position: 'absolute',
                                right: '-10px',
                                bottom: '-20px',
                                fontSize: '110px',
                                opacity: 0.1,
                                transform: 'rotate(-10deg)',
                                color: '#fff',
                                pointerEvents: 'none'
                            }}></i>

                            <div className="d-flex align-items-center gap-3" style={{ zIndex: 1 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '14px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }}>
                                    <i className="mdi mdi-calendar-week" style={{ color: '#fff', fontSize: '22px' }}></i>
                                </div>
                                <div>
                                    <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        Rendimiento Acumulado
                                    </div>
                                    <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                                        {monthLabel} &bull; {startDayName} a {endDayName}
                                    </div>
                                </div>
                            </div>

                            {/* Selector integrado de Inicio de Semana en la cabecera - Estilo Dropdown de Mes */}
                            <div className="dropdown" style={{ zIndex: 1 }}>
                                <button
                                    className="btn btn-sm btn-light bg-white dropdown-toggle fw-bold rounded-pill text-dark d-flex align-items-center gap-1 border-0"
                                    type="button"
                                    id="weekStartDropdown"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    style={{
                                        fontSize: '12px',
                                        padding: '6px 16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <i className="mdi mdi-calendar-clock text-primary me-1"></i>
                                    Inicio: {weekDayNames[localWeekStartDay] ?? 'Lunes'}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-lg py-1 border-0" aria-labelledby="weekStartDropdown" style={{ borderRadius: '14px', minWidth: '160px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 1050 }}>
                                    {weekDayNames.map((name, val) => (
                                        <li key={val}>
                                            <a
                                                className={`dropdown-item py-2 px-3 d-flex align-items-center justify-content-between fw-semibold ${localWeekStartDay === val ? 'bg-light text-primary' : 'text-dark'}`}
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setLocalWeekStartDay(val);
                                                    fetchGraph(dateFrom, dateTo, platform, advisorId, false, true, val);
                                                }}
                                                style={{ fontSize: '12px', transition: 'all 0.15s' }}
                                            >
                                                <span>{name}</span>
                                                {localWeekStartDay === val && <i className="mdi mdi-check text-primary"></i>}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Table container */}
                        <div style={{ overflowX: 'auto', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '12px',
                                minWidth: '1100px',
                            }}>
                                <thead>
                                    {/* Main Group Headers */}
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th colSpan={3} style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Periodo</th>
                                        <th colSpan={3} style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'center', color: '#4f46e5', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(79, 70, 229, 0.04)' }}>Inversión Campaña</th>
                                        <th colSpan={4} style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'center', color: '#059669', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(5, 150, 105, 0.04)' }}>Trazabilidad & Leads</th>
                                        <th colSpan={4} style={{ padding: '12px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'center', color: '#d97706', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(217, 119, 6, 0.04)' }}>Variación vs Anterior</th>
                                        <th colSpan={3} style={{ padding: '12px 14px', textAlign: 'center', color: '#7c3aed', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(124, 58, 237, 0.04)' }}>Indicadores ROAS</th>
                                    </tr>
                                    {/* Columns sub-headers */}
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                        {/* Semana */}
                                        <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '10px', textAlign: 'center', width: '60px' }}>Semana</th>
                                        <th style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: '10px', textAlign: 'center', width: '80px' }}>Desde</th>
                                        <th style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: '10px', textAlign: 'center', width: '80px' }}>Hasta</th>
                                        {/* Inversión */}
                                        <th style={{ padding: '10px 12px', color: '#4f46e5', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(79, 70, 229, 0.02)' }}>Registros</th>
                                        <th style={{ padding: '10px 12px', color: '#4f46e5', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(79, 70, 229, 0.02)' }}>Inversión</th>
                                        <th style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', color: '#4f46e5', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(79, 70, 229, 0.02)' }}>Costo Lead (CPR)</th>
                                        {/* Resultados */}
                                        <th style={{ padding: '10px 12px', color: '#059669', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(5, 150, 105, 0.02)' }}>Contactados</th>
                                        <th style={{ padding: '10px 12px', color: '#ea580c', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(5, 150, 105, 0.02)' }}>No Contesta</th>
                                        <th style={{ padding: '10px 12px', color: '#059669', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(5, 150, 105, 0.02)' }}>Respondió</th>
                                        <th style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', color: '#059669', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(5, 150, 105, 0.02)' }}>Ventas</th>
                                        {/* Variaciones */}
                                        <th style={{ padding: '10px 12px', color: '#d97706', fontWeight: 700, fontSize: '10px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>Δ Contac.</th>
                                        <th style={{ padding: '10px 12px', color: '#d97706', fontWeight: 700, fontSize: '10px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>Δ No Cont.</th>
                                        <th style={{ padding: '10px 12px', color: '#d97706', fontWeight: 700, fontSize: '10px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>Δ Respond.</th>
                                        <th style={{ padding: '10px 12px', borderRight: '1px solid #e2e8f0', color: '#d97706', fontWeight: 700, fontSize: '10px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>Δ Ventas</th>
                                        {/* Ratios */}
                                        <th style={{ padding: '10px 12px', color: '#7c3aed', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(124, 58, 237, 0.02)' }}>% Contacto</th>
                                        <th style={{ padding: '10px 12px', color: '#7c3aed', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(124, 58, 237, 0.02)' }}>% Cierre</th>
                                        <th style={{ padding: '10px 12px', color: '#7c3aed', fontWeight: 700, fontSize: '10px', textAlign: 'right', background: 'rgba(124, 58, 237, 0.02)' }}>ROAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, idx) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                                <td colSpan={17} style={{ padding: '16px 20px' }}>
                                                    <div className="skeleton-item" style={{ height: '18px', width: '100%' }}></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        weeklyEvolution.map((wk, idx) => {
                                            const isEven = idx % 2 === 0;
                                            const rowBg = isEven ? '#ffffff' : '#f8fafc';
                                            return (
                                                <tr key={wk.label} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = '#f1f5f9';
                                                        e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(99, 102, 241, 0.1)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = rowBg;
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    {/* Semana */}
                                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{wk.label}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{wk.start_formatted}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderRight: '1px solid #e2e8f0' }}>{wk.end_formatted}</td>

                                                    {/* Registros — solo número, sin interacción */}
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0f172a', background: 'rgba(79, 70, 229, 0.02)' }}>
                                                        {fmtNum(wk.registros)}
                                                    </td>

                                                    {/* Inversión — tooltip customizado PEN + USD */}
                                                    <Tippy
                                                        content={
                                                            <div style={{ minWidth: 190, padding: '2px 0' }}>
                                                                <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: 6, color: '#6366f1', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                                    Inversión · {wk.label}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                    <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>S/ {fmtMon(wk.spend)}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', borderRadius: 4, padding: '2px 6px' }}>PEN</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>$ {fmtMon(wk.spend_usd ?? (wk.spend / (usdExchangeRate || 3.80)))}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', borderRadius: 4, padding: '2px 6px' }}>USD</span>
                                                                </div>
                                                                <div style={{ marginTop: 6, fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 5 }}>
                                                                    T.C. S/ {usdExchangeRate || 3.80}
                                                                </div>
                                                            </div>
                                                        }
                                                        theme="kpi-light"
                                                        placement="top"
                                                        arrow={true}
                                                    >
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#4f46e5', background: 'rgba(79, 70, 229, 0.02)', cursor: 'help' }}>
                                                            {spendsLoading ? <div className="skeleton-item" style={{ height: '18px', width: '75px', marginLeft: 'auto' }}></div> : fmtMon(wk.spend)}
                                                        </td>
                                                    </Tippy>

                                                    {/* CPL — tooltip customizado PEN + USD */}
                                                    <Tippy
                                                        content={
                                                            wk.spend > 0 && wk.registros > 0
                                                                ? <div style={{ minWidth: 190, padding: '2px 0' }}>
                                                                    <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: 6, color: '#6366f1', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                                        Costo por Lead · {wk.label}
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                        <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>S/ {fmtMon(wk.cpr)}</span>
                                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', borderRadius: 4, padding: '2px 6px' }}>PEN / Lead</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>$ {fmtMon(wk.cpr_usd ?? (wk.cpr / (usdExchangeRate || 3.80)))}</span>
                                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', borderRadius: 4, padding: '2px 6px' }}>USD / Lead</span>
                                                                    </div>
                                                                    <div style={{ marginTop: 6, fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 5 }}>
                                                                        {fmtNum(wk.registros)} registros · Inv. S/ {fmtMon(wk.spend)}
                                                                    </div>
                                                                </div>
                                                                : <span style={{ fontSize: '12px', color: '#64748b' }}>Sin gasto registrado</span>
                                                        }
                                                        theme="kpi-light"
                                                        placement="top"
                                                        arrow={true}
                                                    >
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#4f46e5', borderRight: '1px solid #e2e8f0', background: 'rgba(79, 70, 229, 0.02)', cursor: 'help' }}>
                                                            {spendsLoading ? (
                                                                <div className="skeleton-item" style={{ height: '18px', width: '60px', marginLeft: 'auto' }}></div>
                                                            ) : (
                                                                wk.spend > 0 && wk.registros > 0 ? fmtMon(wk.cpr) : <span style={{ color: '#cbd5e1' }}>—</span>
                                                            )}
                                                        </td>
                                                    </Tippy>

                                                    {/* Resultados — sin click, tooltip simple */}
                                                    <Tippy content={<span style={{ fontSize: '12px', color: '#0f172a' }}>Contactados {wk.label}: <strong>{fmtNum(wk.contactados)}</strong> leads</span>} theme="kpi-light" placement="top" arrow>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#0f172a', background: 'rgba(5, 150, 105, 0.02)', cursor: 'default' }}>
                                                            {fmtNum(wk.contactados)}
                                                        </td>
                                                    </Tippy>
                                                    <Tippy content={<span style={{ fontSize: '12px', color: '#0f172a' }}>No Respondieron {wk.label}: <strong>{fmtNum(wk.noContesta)}</strong> leads</span>} theme="kpi-light" placement="top" arrow>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ef4444', background: 'rgba(5, 150, 105, 0.02)', cursor: 'default' }}>
                                                            {fmtNum(wk.noContesta)}
                                                        </td>
                                                    </Tippy>
                                                    <Tippy content={<span style={{ fontSize: '12px', color: '#0f172a' }}>Respondieron {wk.label}: <strong>{fmtNum(wk.respondio)}</strong> leads</span>} theme="kpi-light" placement="top" arrow>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981', background: 'rgba(5, 150, 105, 0.02)', cursor: 'default' }}>
                                                            {fmtNum(wk.respondio)}
                                                        </td>
                                                    </Tippy>
                                                    <Tippy content={<span style={{ fontSize: '12px', color: '#0f172a' }}>Ventas {wk.label}: <strong>{fmtNum(wk.ventas)}</strong> clientes</span>} theme="kpi-light" placement="top" arrow>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#10b981', borderRight: '1px solid #e2e8f0', background: 'rgba(5, 150, 105, 0.02)', cursor: 'default' }}>
                                                            {fmtNum(wk.ventas)}
                                                        </td>
                                                    </Tippy>

                                                    {/* Variaciones */}
                                                    <td style={{ padding: '12px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>{deltaBadge(wk.diffContactados)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>{deltaBadge(wk.diffNoContesta)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', background: 'rgba(217, 119, 6, 0.02)' }}>{deltaBadge(wk.diffRespondio)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #e2e8f0', background: 'rgba(217, 119, 6, 0.02)' }}>{deltaBadge(wk.diffVentas)}</td>

                                                    {/* Ratios */}
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#7c3aed', fontWeight: 700, background: 'rgba(124, 58, 237, 0.02)' }}>{fmtPct(wk.pctContact)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#7c3aed', fontWeight: 700, background: 'rgba(124, 58, 237, 0.02)' }}>{fmtPct(wk.pctCierre)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: wk.roas >= 1.0 ? '#10b981' : '#64748b', background: 'rgba(124, 58, 237, 0.02)', fontSize: '13px' }}>
                                                        {spendsLoading ? (
                                                            <div className="skeleton-item" style={{ height: '18px', width: '50px', marginLeft: 'auto' }}></div>
                                                        ) : (
                                                            wk.spend > 0 ? fmtRoas(wk.roas) : <span style={{ color: '#cbd5e1' }}>—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                        <td colSpan={3} style={{ padding: '14px 12px', fontWeight: 800, color: '#0f172a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', borderRight: '1px solid #e2e8f0' }}>Total Periodo</td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a', background: 'rgba(79, 70, 229, 0.05)', fontSize: '13px' }}>
                                            {fmtNum(weeklyEvolution.reduce((s, w) => s + (w.registros ?? 0), 0))}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#4f46e5', background: 'rgba(79, 70, 229, 0.05)', fontSize: '13px' }}>
                                            {spendsLoading ? (
                                                <div className="skeleton-item" style={{ height: '18px', width: '75px', marginLeft: 'auto' }}></div>
                                            ) : (
                                                fmtMon(weeklyEvolution.reduce((s, w) => s + (w.spend ?? 0), 0))
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#4f46e5', borderRight: '1px solid #e2e8f0', background: 'rgba(79, 70, 229, 0.05)', fontSize: '12px' }}>
                                            {spendsLoading ? (
                                                <div className="skeleton-item" style={{ height: '18px', width: '60px', marginLeft: 'auto' }}></div>
                                            ) : (
                                                (() => {
                                                    const totalReg = weeklyEvolution.reduce((s, w) => s + (w.registros ?? 0), 0);
                                                    const totalSpendW = weeklyEvolution.reduce((s, w) => s + (w.spend ?? 0), 0);
                                                    return totalReg > 0 ? fmtMon(totalSpendW / totalReg) : '—';
                                                })()
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a', background: 'rgba(5, 150, 105, 0.05)', fontSize: '12px' }}>
                                            {fmtNum(weeklyEvolution.reduce((s, w) => s + (w.contactados ?? 0), 0))}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#ef4444', background: 'rgba(5, 150, 105, 0.05)', fontSize: '12px' }}>
                                            {fmtNum(weeklyEvolution.reduce((s, w) => s + (w.noContesta ?? 0), 0))}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: '#10b981', background: 'rgba(5, 150, 105, 0.05)', fontSize: '12px' }}>
                                            {fmtNum(weeklyEvolution.reduce((s, w) => s + (w.respondio ?? 0), 0))}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', borderRight: '1px solid #e2e8f0', background: 'rgba(5, 150, 105, 0.05)', fontSize: '13px' }}>
                                            {fmtNum(weeklyEvolution.reduce((s, w) => s + (w.ventas ?? 0), 0))}
                                        </td>
                                        <td colSpan={4} style={{ padding: '14px 12px', borderRight: '1px solid #e2e8f0', background: 'rgba(217, 119, 6, 0.03)' }}></td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#7c3aed', background: 'rgba(124, 58, 237, 0.05)', fontSize: '12px' }}>
                                            {(() => {
                                                const totalReg = weeklyEvolution.reduce((s, w) => s + (w.registros ?? 0), 0);
                                                const totalCont = weeklyEvolution.reduce((s, w) => s + (w.contactados ?? 0), 0);
                                                return totalReg > 0 ? fmtPct((totalCont / totalReg) * 100) : '0.0%';
                                            })()}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#7c3aed', background: 'rgba(124, 58, 237, 0.05)', fontSize: '12px' }}>
                                            {(() => {
                                                const totalReg = weeklyEvolution.reduce((s, w) => s + (w.registros ?? 0), 0);
                                                const totalVent = weeklyEvolution.reduce((s, w) => s + (w.ventas ?? 0), 0);
                                                return totalReg > 0 ? fmtPct((totalVent / totalReg) * 100) : '0.0%';
                                            })()}
                                        </td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', background: 'rgba(124, 58, 237, 0.05)', fontSize: '13px' }}>
                                            {spendsLoading ? (
                                                <div className="skeleton-item" style={{ height: '18px', width: '50px', marginLeft: 'auto' }}></div>
                                            ) : (
                                                (() => {
                                                    const totalSpendW = weeklyEvolution.reduce((s, w) => s + (w.spend ?? 0), 0);
                                                    const totalSaleAmt = weeklyEvolution.reduce((s, w) => s + (w.salesAmount ?? 0), 0);
                                                    return totalSpendW > 0 ? fmtRoas(totalSaleAmt / totalSpendW) : '—';
                                                })()
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Gráficos de Evolución Semanal */}
                    <div className="row g-4 mb-5">
                        {/* Gráfico 1: Ratios */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '24px', background: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div>
                                        <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15px', letterSpacing: '-0.3px' }}>
                                            Evolución Semanal de Ratios &mdash; {monthLabel}
                                        </h5>
                                        <p className="text-muted small mb-0">Tasa de contacto y cierre por semana</p>
                                    </div>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '10px',
                                        background: 'rgba(99, 102, 241, 0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <i className="mdi mdi-chart-line text-primary" style={{ fontSize: '18px' }}></i>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="skeleton-item" style={{ height: '300px', width: '100%' }}></div>
                                ) : (
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                                <RechartsTooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Tasa']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                                <Line type="monotone" name="% Contacto" dataKey="pctContact" stroke="#10b981" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} />
                                                <Line type="monotone" name="% Cierre" dataKey="pctCierre" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gráfico 2: ROAS */}
                        <div className="col-lg-6">
                            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '24px', background: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div>
                                        <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15px', letterSpacing: '-0.3px' }}>
                                            ROAS por Semana
                                        </h5>
                                        <p className="text-muted small mb-0">Retorno sobre la inversión publicitaria semanal</p>
                                    </div>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '10px',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <i className="mdi mdi-trending-up text-danger" style={{ fontSize: '18px' }}></i>
                                    </div>
                                </div>

                                {(loading || spendsLoading) ? (
                                    <div className="skeleton-item" style={{ height: '300px', width: '100%' }}></div>
                                ) : (
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                                                        <stop offset="100%" stopColor="#f87171" stopOpacity={0.9} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(2)}x`} />
                                                <RechartsTooltip formatter={(value) => [`${value.toFixed(2)}x`, 'ROAS']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                                <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                                                <Bar name="ROAS" dataKey="roas" fill="url(#roasGrad)" radius={[8, 8, 0, 0]} maxBarSize={45} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
                                                                        className="me-2"
                                                                        style={{
                                                                            width: "36px",
                                                                            height: "36px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center"
                                                                        }}
                                                                    >
                                                                        {ad.preview_image_url ? (
                                                                            <img
                                                                                src={ad.preview_image_url}
                                                                                alt="Anuncio"
                                                                                className="rounded border"
                                                                                style={{
                                                                                    width: "100%",
                                                                                    height: "100%",
                                                                                    objectFit: "cover"
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <span
                                                                                className="avatar-title rounded bg-soft-warning text-warning d-flex align-items-center justify-content-center"
                                                                                style={{
                                                                                    fontSize: "14px",
                                                                                    width: "36px",
                                                                                    height: "36px",
                                                                                    borderRadius: "6px",
                                                                                    backgroundColor: "rgba(245, 158, 11, 0.1)"
                                                                                }}
                                                                            >
                                                                                <i className="mdi mdi-package-variant"></i>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h6
                                                                        className="fw-bold text-dark d-flex align-items-center"
                                                                        style={{
                                                                            fontSize: "16px",
                                                                            height: "36px",
                                                                            lineHeight: "36px"
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
                                                                            "16px",
                                                                    }}
                                                                >
                                                                    {/* Total de
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
                                                                    </span>*/}

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
                                                                    <span className="mx-2 text-light">
                                                                        |
                                                                    </span>
                                                                    Gasto Anuncio:{" "}
                                                                    <span className="text-dark fw-bold">
                                                                        S/ {(ad.spend || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                    <span className="mx-2 text-light">
                                                                        |
                                                                    </span>
                                                                    ROAS:{" "}
                                                                    <span className={`fw-bold ${ad.spend > 0 && (totalAdSales / ad.spend) >= 1.0 ? 'text-success' : 'text-danger'}`}>
                                                                        {ad.spend > 0 ? `${(totalAdSales / ad.spend).toFixed(2)}x` : '—'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="table-responsive border rounded-3" style={{ borderColor: '#cbd5e1' }}>
                                                                <table className="table table-bordered table-hover align-middle mb-0" style={{ borderColor: '#cbd5e1' }}>
                                                                    <thead>
                                                                        <tr
                                                                            style={{
                                                                                fontSize:
                                                                                    "11px",
                                                                                color: "#0f172a",
                                                                                background: "#f1f5f9",
                                                                                fontWeight: "800",
                                                                            }}
                                                                        >
                                                                            <th className="px-3 py-3 fw-bold text-uppercase" style={{ borderColor: '#cbd5e1', fontWeight: '800' }}>
                                                                                Lead / Cliente
                                                                            </th>
                                                                            <th className="py-3 fw-bold text-uppercase" style={{ borderColor: '#cbd5e1', fontWeight: '800' }}>
                                                                                Contacto
                                                                            </th>
                                                                            <th className="py-3 fw-bold text-uppercase" style={{ borderColor: '#cbd5e1', fontWeight: '800' }}>
                                                                                Asesor
                                                                            </th>
                                                                            <th className="py-3 fw-bold text-uppercase" style={{ borderColor: '#cbd5e1', fontWeight: '800' }}>
                                                                                Producto
                                                                            </th>
                                                                            <th className="text-end px-3 py-3 fw-bold text-uppercase" style={{ borderColor: '#cbd5e1', fontWeight: '800' }}>
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
                                                                                        style={{ borderColor: '#cbd5e1' }}
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

            {/* Modal de Detalle por Etiquetas (Contactados, Respondieron, No Respondieron) */}
            {cardDetailModal && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1055 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold">{cardDetailModal.title}</h5>
                                <button type="button" className="btn-close" onClick={() => setCardDetailModal(null)}></button>
                            </div>
                            <div className="modal-body py-3">
                                <div className="text-center p-3 mb-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                    <span className="text-muted d-block small mb-1">Total acumulado en este periodo</span>
                                    <h3 className="mb-0 fw-bold" style={{ color: cardDetailModal.color || "#0f172a" }}>
                                        {formatNumber(cardDetailModal.count)} <small className="fs-6 text-muted">leads</small>
                                    </h3>
                                </div>

                                {cardDetailModal.isUnresponded && (
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <div className="p-3 rounded-3 border text-center" style={{ background: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                                                <i className="mdi mdi-phone-in-talk fs-4 text-warning mb-1 d-block"></i>
                                                <span className="text-muted d-block small" style={{ fontSize: "11px", fontWeight: 600 }}>En Gestión (Activos)</span>
                                                <h4 className="mb-0 fw-bold text-dark">{formatNumber(cardDetailModal.activeCount)}</h4>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 rounded-3 border text-center" style={{ background: "rgba(100, 116, 139, 0.08)", borderColor: "rgba(100, 116, 139, 0.3)" }}>
                                                <i className="mdi mdi-account-off fs-4 text-secondary mb-1 d-block"></i>
                                                <span className="text-muted d-block small" style={{ fontSize: "11px", fontWeight: 600 }}>Ya Archivados</span>
                                                <h4 className="mb-0 fw-bold text-dark">{formatNumber(cardDetailModal.archivedCount)}</h4>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: "13px" }}>
                                    Desglose por etiqueta configurada:
                                </h6>

                                <div className="d-flex flex-column gap-2" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                    {cardDetailModal.breakdown && cardDetailModal.breakdown.length > 0 ? (
                                        cardDetailModal.breakdown.map((item, idx) => {
                                            const pct = cardDetailModal.count > 0 ? Math.round((item.quantity / cardDetailModal.count) * 100) : 0;
                                            return (
                                                <div key={idx} className="p-3 rounded-3 border" style={{ background: "#ffffff" }}>
                                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span
                                                                className="badge rounded-pill px-2 py-1"
                                                                style={{
                                                                    background: item.color || "#6366f1",
                                                                    color: "#ffffff",
                                                                    fontSize: "11px",
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                {item.name}
                                                            </span>
                                                            {cardDetailModal.isUnresponded && item.active_qty !== undefined && (
                                                                <small className="text-muted" style={{ fontSize: "10px" }}>
                                                                    ({item.active_qty} en gestión / {item.archived_qty} archivados)
                                                                </small>
                                                            )}
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "15px" }}>
                                                                {formatNumber(item.quantity)}
                                                            </h5>
                                                            <span className="badge bg-soft-secondary text-secondary rounded-pill" style={{ fontSize: "10px" }}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="progress mt-2" style={{ height: "6px", borderRadius: "3px", background: "#f1f5f9" }}>
                                                        <div
                                                            className="progress-bar rounded-pill"
                                                            style={{ width: `${pct}%`, backgroundColor: item.color || cardDetailModal.color || "#6366f1" }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center text-muted py-4">No hay registros etiquetados para esta categoría</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 justify-content-center">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setCardDetailModal(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Inversión (USD & PEN) */}
            {showSpendModal && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1055 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold">Detalle de Inversión y Métricas (USD & PEN)</h5>
                                <button type="button" className="btn-close" onClick={() => setShowSpendModal(false)}></button>
                            </div>
                            <div className="modal-body py-3">
                                <div className="text-center p-3 mb-3 rounded-3" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe" }}>
                                    <span className="text-muted d-block small mb-1">Inversión Total en Meta Ads</span>
                                    <h2 className="mb-1 fw-bold text-primary">S/ {formatNumber(totalSpend)} <small className="fs-6 text-muted">PEN</small></h2>
                                    <h4 className="mb-0 fw-semibold text-dark">$ {formatNumber(totalSpendUsd)} <small className="fs-6 text-muted">USD</small></h4>
                                    <small className="text-muted d-block mt-2" style={{ fontSize: "11px" }}>
                                        Tipo de cambio aplicado: <strong>S/ {usdExchangeRate}</strong> por 1 USD (API Luna SUNAT en tiempo real)
                                    </small>
                                </div>

                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border" style={{ background: "#ffffff" }}>
                                        <div>
                                            <h6 className="mb-0 fw-bold text-dark">CPL (Costo por Lead)</h6>
                                            <small className="text-muted">Inversión / Total Leads captados</small>
                                        </div>
                                        <div className="text-end">
                                            <h5 className="mb-0 fw-bold text-dark">S/ {formatNumber(cpl)} PEN</h5>
                                            <span className="badge bg-soft-primary text-primary fw-semibold" style={{ fontSize: "11px" }}>
                                                $ {formatNumber(cplUsd)} USD
                                            </span>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border" style={{ background: "#ffffff" }}>
                                        <div>
                                            <h6 className="mb-0 fw-bold text-dark">CPA (Costo por Adquisición)</h6>
                                            <small className="text-muted">Inversión / Ventas concretadas</small>
                                        </div>
                                        <div className="text-end">
                                            <h5 className="mb-0 fw-bold text-dark">S/ {formatNumber(cpa)} PEN</h5>
                                            <span className="badge bg-soft-success text-success fw-semibold" style={{ fontSize: "11px" }}>
                                                $ {formatNumber(cpaUsd)} USD
                                            </span>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border" style={{ background: "#ffffff" }}>
                                        <div>
                                            <h6 className="mb-0 fw-bold text-dark">ROAS (Retorno de Inversión)</h6>
                                            <small className="text-muted">Monto Ventas / Inversión</small>
                                        </div>
                                        <div className="text-end">
                                            <h4 className="mb-0 fw-bold" style={{ color: "#7c3aed" }}>{roas}x</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 justify-content-center">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowSpendModal(false)}>
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
