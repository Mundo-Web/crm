import { createContext, useContext, useEffect, useState } from 'react';
import LeadsRest from '../../actions/LeadsRest';
import { Local } from 'sode-extend-react';

export const LeadsContext = createContext();
export const LeadsProvider = ({ statuses, children }) => {

    const [statusesRest, setStatusesRest] = useState({})
    const [leadsCount, setLeadsCount] = useState({})
    const [statusesLoading, setStatusesLoading] = useState({})
    const [defaultView, setDefaultView] = useState(Local.get('default-view') ?? 'kanban')
    const [lastLoadedDate, setLastLoadedDate] = useState(new Date())
    const [leads, setLeads] = useState([]);

    const getLeads = () => {
        statuses.map(({ id }) => id).forEach(async (statusId) => {
            let leadsRest = statusesRest[statusId]
            if (!leadsRest) {
                leadsRest = new LeadsRest()
                leadsRest.paginateSufix = null
                setStatusesRest(old => ({ ...old, [statusId]: leadsRest }))
            }
            setStatusesLoading(old => ({ ...old, [statusId]: true }))
            const response = await leadsRest.paginate({
                filter: ['clients.status_id', '=', statusId],
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
        const newLeads = await leadsRest.paginate({
            filter: ['updated_at', '>=', dateWithOffset.toISOString()],
            requireTotalCount: true,
            isLoadingAll: true,
            sort: [{ selector: "created_at", desc: true }],
        });

        if (newLeads?.data) {
            setLeads(prevLeads => {
                // Merge new leads with existing ones, avoiding duplicates
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
        // Filter leads by status and find the oldest one
        const statusLeads = leads.filter(lead => lead.status_id === statusId);
        if (!statusLeads.length) return [];

        // Sort by creation date to find the oldest
        const oldestLead = statusLeads.reduce((oldest, current) => {
            const oldestDate = new Date(oldest.created_at);
            const currentDate = new Date(current.created_at);
            return currentDate < oldestDate ? current : oldest;
        }, statusLeads[0]);

        // Get more leads from API for records created before the oldest one
        let leadsRest = statusesRest[statusId]
        if (leadsRest) {
            leadsRest = new LeadsRest()
            leadsRest.paginateSufix = null
            setStatusesRest(old => ({ ...old, [statusId]: leadsRest }))
        }

        setStatusesLoading(old => ({ ...old, [statusId]: true }))
        const oldestLeadDate = new Date(oldestLead.created_at);
        oldestLeadDate.setHours(oldestLeadDate.getHours() - 5);

        const response = await leadsRest.paginate({
            filter: [
                ['clients.status_id', '=', statusId],
                'and',
                ['created_at', '<', oldestLeadDate.toISOString()]
            ],
            sort: [{ selector: "created_at", desc: true }],
            take: 10,
            requireTotalCount: true
        });
        setStatusesLoading(old => ({ ...old, [statusId]: false }))

        // Update leads array with new data
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
    }, [lastLoadedDate, defaultView])

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
                statusesLoading
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
