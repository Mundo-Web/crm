import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const LandingAnalysis = ({ leads }) => {
    const landingLeads = leads.filter(l => l.subChannel !== 'Direct');

    const channels = ['Facebook Ads', 'Instagram Ads', 'TikTok Ads', 'Google'];

    const landingStats = channels.map(channel => {
        const channelLeads = landingLeads.filter(l => l.channel === channel);
        const formLeads = channelLeads.filter(l => l.conversionPoint === 'Formulario');
        const whatsappLeads = channelLeads.filter(l => l.conversionPoint === 'WhatsApp');
        const sales = channelLeads.filter(l => l.status === 'Venta cerrada').length;
        const convRate = channelLeads.length > 0 ? (sales / channelLeads.length) * 100 : 0;

        return {
            channel,
            visits: channelLeads.length,
            formSubmissions: formLeads.length,
            whatsappClicks: whatsappLeads.length,
            conversions: sales,
            conversionRate: convRate
        };
    }).filter(stat => stat.visits > 0);

    const chartData = landingStats.map(stat => ({
        canal: stat.channel.replace(' Ads', ''),
        Formulario: stat.formSubmissions,
        WhatsApp: stat.whatsappClicks,
        Conversiones: stat.conversions
    }));

    const totalLandingLeads = landingLeads.length;
    const totalFormLeads = landingLeads.filter(l => l.conversionPoint === 'Formulario').length;
    const totalWhatsappLeads = landingLeads.filter(l => l.conversionPoint === 'WhatsApp').length;

    return (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="card-title mb-1 fw-bold">
                            <i className="bi bi-globe me-2 text-primary"></i>
                            Landing Page - Análisis Detallado
                        </h5>
                        <p className="text-muted small mb-0">Leads que llegaron vía landing page</p>
                    </div>
                    <div className="text-end">
                        <div className="fs-4 fw-bold text-primary">{totalLandingLeads}</div>
                        <div className="small text-muted">Total vía landing</div>
                    </div>
                </div>

                <div className="row g-2 mb-4">
                    <div className="col-md-6">
                        <div className="p-3 bg-primary bg-opacity-10 rounded">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <i className="bi bi-file-text fs-4 text-primary"></i>
                                    <div className="small text-muted mt-1">Formularios</div>
                                </div>
                                <div className="text-end">
                                    <div className="fs-3 fw-bold text-primary">{totalFormLeads}</div>
                                    <div className="small text-muted">{totalLandingLeads > 0 ? ((totalFormLeads / totalLandingLeads) * 100).toFixed(0) : 0}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="p-3 bg-success bg-opacity-10 rounded">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <i className="bi bi-whatsapp fs-4 text-success"></i>
                                    <div className="small text-muted mt-1">WhatsApp</div>
                                </div>
                                <div className="text-end">
                                    <div className="fs-3 fw-bold text-success">{totalWhatsappLeads}</div>
                                    <div className="small text-muted">{totalLandingLeads > 0 ? ((totalWhatsappLeads / totalLandingLeads) * 100).toFixed(0) : 0}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div className="mb-4">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Formulario" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="WhatsApp" fill="#25D366" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Conversiones" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr className="border-bottom">
                                <th className="border-0 small text-muted fw-semibold">Canal Origen</th>
                                <th className="border-0 text-end small text-muted fw-semibold">Visitas</th>
                                <th className="border-0 text-end small text-muted fw-semibold">Formularios</th>
                                <th className="border-0 text-end small text-muted fw-semibold">WhatsApp</th>
                                <th className="border-0 text-end small text-muted fw-semibold">Conversiones</th>
                                <th className="border-0 text-end small text-muted fw-semibold">% Conversión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {landingStats.map((stat) => (
                                <tr key={stat.channel}>
                                    <td>
                                        <span className="fw-semibold">{stat.channel}</span>
                                    </td>
                                    <td className="text-end">
                                        <span className="badge bg-light text-dark">{stat.visits}</span>
                                    </td>
                                    <td className="text-end">
                                        <span className="badge bg-primary bg-opacity-25 text-primary">
                                            {stat.formSubmissions}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <span className="badge bg-success bg-opacity-25 text-success">
                                            {stat.whatsappClicks}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <span className="fw-semibold text-success">{stat.conversions}</span>
                                    </td>
                                    <td className="text-end">
                                        <span className={`badge ${stat.conversionRate > 15 ? 'bg-success' : stat.conversionRate > 10 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                            {stat.conversionRate.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {landingStats.length === 0 && (
                    <div className="text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                        <p className="text-muted">No hay datos de landing page</p>
                    </div>
                )}
            </div>
        </div>
    );
};
