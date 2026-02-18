import { createContext, useContext, useEffect, useState } from 'react';
import LeadsRest from '../../actions/LeadsRest';
import { Local } from 'sode-extend-react';
import LaravelSession from "../../Utils/LaravelSession"
import ArrayJoin from '../../Utils/ArrayJoin';
import useCrossTabSelectedUsers from '../CustomHooks/useCrossTabSelectedUsers';

export const LeadsContext = createContext();
export const LeadsProvider = ({ statuses, months, currentMonth, currentYear, children }) => {

    const [statusesRest, setStatusesRest] = useState({})
    const [leadsCount, setLeadsCount] = useState({})
    const [statusesLoading, setStatusesLoading] = useState({})
    const [selectedUsersId, setSelectedUsersId] = useCrossTabSelectedUsers(LaravelSession.business_id, [LaravelSession.service_user.id]);
    const [defaultView, setDefaultView] = useState(Local.get('default-view') ?? 'kanban')
    const [lastLoadedDate, setLastLoadedDate] = useState(new Date())
    const [leads, setLeads] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`)

    const getLeads = () => {
        statuses.map(({ id }) => id).forEach(async (statusId) => {
            let leadsRest = statusesRest[statusId]
            if (!leadsRest) {
                leadsRest = new LeadsRest()
                leadsRest.paginateSufix = null
                setStatusesRest(old => ({ ...old, [statusId]: leadsRest }))
            }
            setStatusesLoading(old => ({ ...old, [statusId]: true }))
            const filter = [['clients.status_id', '=', statusId]];
            if (selectedUsersId.length > 0) {
                filter.push(ArrayJoin(selectedUsersId.map(id => ['assigned_to', '=', id]), 'or'))
            }
            // Add selectedMonth filter (yyyy-mm)
            filter.push(['created_at', '>=', `${selectedMonth}-01`]);
            const nextMonth = new Date(selectedMonth + '-01');
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            filter.push(['created_at', '<', nextMonth.toISOString().slice(0, 10)]);
            const response = await leadsRest.paginate({
                filter: ArrayJoin(filter, 'and'),
                sort: [{ selector: "created_at", desc: true }],
                skip: 0,
                take: 10,
                sort: [{ selector: "created_at", desc: true }],
                requireTotalCount: true
            });
            setStatusesLoading(old => ({ ...old, [statusId]: false }))
            setLeadsCount(old => ({ ...old, [statusId]: response.totalCount }))
            setLeads(prevLeads => {
                const newLeads = [...prevLeads];
                response.data.forEach(newLead => {
                    const existingLeadIndex = newLeads.findIndex(lead => lead.id === newLead.id);
                    if (existingLeadIndex !== -1) {
                        newLeads[existingLeadIndex] = newLead;
                    } else {
                        newLeads.push(newLead);
                    }
                });
                return newLeads;
            });
        });
    }

    const refreshLeads = async () => {
        const dateWithOffset = new Date(lastLoadedDate.getTime() - (5 * 60 * 60 * 1000));
        const leadsRest = new LeadsRest()
        leadsRest.paginateSufix = null

        const filter = [['updated_at', '>=', dateWithOffset.toISOString()]];
        if (selectedUsersId.length > 0) {
            filter.push(ArrayJoin(selectedUsersId.map(id => ['assigned_to', '=', id]), 'or'))
        }
        // Add selectedMonth filter (yyyy-mm)
        filter.push(['created_at', '>=', `${selectedMonth}-01`]);
        const nextMonth = new Date(selectedMonth + '-01');
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        filter.push(['created_at', '<', nextMonth.toISOString().slice(0, 10)]);

        const newLeads = await leadsRest.paginate({
            filter: ArrayJoin(filter, 'and'),
            requireTotalCount: true,
            isLoadingAll: true,
            sort: [{ selector: "created_at", desc: true }],
        });

        if (newLeads?.data) {
            setLeads(prevLeads => {
                const updatedLeads = [...prevLeads];
                newLeads.data.forEach(newLead => {
                    const existingIndex = updatedLeads.findIndex(lead => lead.id === newLead.id);
                    if (existingIndex >= 0) {
                        updatedLeads[existingIndex] = newLead;
                    } else {
                        updatedLeads.push(newLead);
                    }
                });
                return updatedLeads;
            });
            setLastLoadedDate(new Date());
        }
    }

    const getMoreLeads = async (statusId) => {
        const statusLeads = leads.filter(lead => lead.status_id === statusId);
        if (!statusLeads.length) return [];

        const oldestLead = statusLeads.reduce((oldest, current) => {
            const oldestDate = new Date(oldest.created_at);
            const currentDate = new Date(current.created_at);
            return currentDate < oldestDate ? current : oldest;
        }, statusLeads[0]);

        let leadsRest = statusesRest[statusId]
        if (leadsRest) {
            leadsRest = new LeadsRest()
            leadsRest.paginateSufix = null
            setStatusesRest(old => ({ ...old, [statusId]: leadsRest }))
        }

        setStatusesLoading(old => ({ ...old, [statusId]: true }))
        const oldestLeadDate = new Date(oldestLead.created_at);
        oldestLeadDate.setHours(oldestLeadDate.getHours() - 5);

        const filter = [
            ['clients.status_id', '=', statusId],
            ['created_at', '<', oldestLeadDate.toISOString()]
        ];
        if (selectedUsersId.length > 0) {
            filter.push(ArrayJoin(selectedUsersId.map(id => ['assigned_to', '=', id]), 'or'))
        }
        // Add selectedMonth filter (yyyy-mm)
        filter.push(['created_at', '>=', `${selectedMonth}-01`]);
        const nextMonth = new Date(selectedMonth + '-01');
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        filter.push(['created_at', '<', nextMonth.toISOString().slice(0, 10)]);

        const response = await leadsRest.paginate({
            filter: ArrayJoin(filter, 'and'),
            sort: [{ selector: "created_at", desc: true }],
            take: 10,
            requireTotalCount: true
        });
        setStatusesLoading(old => ({ ...old, [statusId]: false }))

        setLeads(prevLeads => {
            const newLeads = [...prevLeads];
            response.data.forEach(newLead => {
                const existingLeadIndex = newLeads.findIndex(lead => lead.id === newLead.id);
                if (existingLeadIndex !== -1) {
                    newLeads[existingLeadIndex] = newLead;
                } else {
                    newLeads.push(newLead);
                }
            });
            return newLeads;
        });

        return response.data;
    }

    useEffect(() => {
        if (defaultView != 'kanban') return
        const interval = setInterval(() => { refreshLeads(); }, 10000);
        return () => clearInterval(interval);
    }, [lastLoadedDate, defaultView, selectedUsersId, selectedMonth])

    return (
        <LeadsContext.Provider
            value={{
                leads,
                setLeads,
                getLeads,
                refreshLeads,
                getMoreLeads,
                defaultView,
                setDefaultView,
                leadsCount,
                statusesLoading,
                selectedUsersId,
                setSelectedUsersId,
                months,
                selectedMonth,
                setSelectedMonth,
            }}
        >
            {children}
        </LeadsContext.Provider>
    );
};
export const useLeads = () => {
    const context = useContext(LeadsContext);
    if (!context) {
        throw new Error('useLeads must be used within a LeadsProvider');
    }
    return context;
};
