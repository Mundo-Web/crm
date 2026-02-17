import React from 'react';

export const DirectCampaignPerformance = ({ originCounts }) => {
    // Map origin names to campaign config
    const campaignMap = {
        'CRM Atalaya': { name: 'CRM Atalaya', icon: 'page-layout-sidebar-left', color: '#343a40' },
        'Facebook': { name: 'Facebook Ads', icon: 'facebook', color: '#1877F2' },
        'Instagram': { name: 'Instagram Ads', icon: 'instagram', color: '#E4405F' },
        'Google': { name: 'Google', icon: 'google', color: '#4285F4' },
        'WhatsApp': { name: 'WhatsApp Directo', icon: 'whatsapp', color: '#25D366' }
    };

    // Build campaign stats from originCounts
    const campaignStats = originCounts
        .map(origin => {
            let cfg = campaignMap[origin.origin];
            if (!cfg) {
                // Unknown origin: use its own name, no icon, gray color
                cfg = { name: origin.origin, icon: '', color: '#9E9E9E' };
            }
            const leads = origin.total;
            const sales = origin.clients;
            const contacted = origin.total - origin.pending; // contacted = total - pending
            const convRate = leads > 0 ? (sales / leads) * 100 : 0;

            return {
                ...cfg,
                leads,
                sales,
                contacted,
                convRate,
                totalValue: 0 // no value data anymore
            };
        })
        .sort((a, b) => b.leads - a.leads);

    const totalDirectLeads = campaignStats.reduce((sum, c) => sum + c.leads, 0);
    const totalDirectSales = campaignStats.reduce((sum, c) => sum + c.sales, 0);

    return (
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h5 className="card-title mb-1 fw-bold">
                            <span className="mdi mdi-bullseye me-2 text-success"></span>
                            Rendimiento Campañas Directas
                        </h5>
                        <p className="text-muted small mb-0">Leads que llegan directo al CRM sin pasar por landing</p>
                    </div>
                    <div className="text-end">
                        <div className="fs-4 fw-bold text-success">{totalDirectLeads}</div>
                        <div className="small text-muted">Total leads directos</div>
                    </div>
                </div>

                {/* <div className="row g-2 mb-4">
                    <div className="col-6">
                        <div className="p-2 bg-success bg-opacity-10 rounded text-center">
                            <div className="fs-5 fw-bold text-success">{totalDirectSales}</div>
                            <div className="small text-muted">Ventas</div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="p-2 bg-success bg-opacity-10 rounded text-center">
                            <div className="fs-5 fw-bold text-success">—</div>
                            <div className="small text-muted">Valor</div>
                        </div>
                    </div>
                </div> */}

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr className="border-bottom">
                                <th className="border-0 small text-muted fw-semibold">Canal</th>
                                <th className="border-0 text-center small text-muted fw-semibold">Leads</th>
                                <th className="border-0 text-center small text-muted fw-semibold">Contactados</th>
                                <th className="border-0 text-center small text-muted fw-semibold">Ventas</th>
                                <th className="border-0 text-center small text-muted fw-semibold">Conv. %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaignStats.map((stat) => (
                                <tr key={stat.name}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    backgroundColor: `${stat.color}15`
                                                }}
                                            >
                                                <span className={`mdi mdi-${stat.icon}`} style={{ color: stat.color }}></span>
                                            </div>
                                            <span className="fw-semibold small">{stat.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className="badge bg-light text-dark">{stat.leads}</span>
                                    </td>
                                    <td className="text-center">
                                        <span className="badge bg-warning bg-opacity-25 text-warning">{stat.contacted}</span>
                                    </td>
                                    <td className="text-center">
                                        <span className="badge bg-success bg-opacity-25 text-success">{stat.sales}</span>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <div
                                                className="progress me-2"
                                                style={{ width: '60px', height: '6px' }}
                                            >
                                                <div
                                                    className="progress-bar bg-success"
                                                    style={{ width: `${Math.min(stat.convRate, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="small fw-semibold">{stat.convRate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {campaignStats.length === 0 && (
                    <div className="text-center py-5">
                        <span className="mdi mdi-inbox fs-1 text-muted d-block mb-2"></span>
                        <p className="text-muted">No hay datos de campañas directas</p>
                    </div>
                )}

                {campaignStats.length > 0 && (
                    <div className="mt-0 p-3 bg-light rounded">
                        <div className="row g-3 small">
                            <div className="col-6">
                                <div className="text-muted mb-1">Mejor conversión</div>
                                <div className="fw-bold text-success">
                                    {campaignStats.reduce((best, current) =>
                                        current.convRate > best.convRate ? current : best
                                    ).name}
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="text-muted mb-1">Más leads</div>
                                <div className="fw-bold text-primary">
                                    {campaignStats[0].name}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
