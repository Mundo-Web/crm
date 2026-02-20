import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const PipelineChart = ({ data = [] }) => {
    // Transform incoming data into chart-ready format
    const chartData = (data).map(item => ({
        status: item.status_name,
        count: item.quantity,
        color: item.status_color
    }));

    // Calculate total leads
    const total = chartData.reduce((sum, entry) => sum + entry.count, 0);

    return (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body">
                <h5 className="card-title mb-4">
                    <i className="mdi mdi-chart-bar me-2 text-primary"></i>
                    Pipeline de Ventas
                </h5>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip
                            formatter={(value) => [value.toLocaleString('es-ES'), 'Leads']}
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                <div className="row g-2 mt-3">
                    {chartData.map((item) => (
                        <div key={item.status} className="col-md-4 col-sm-6">
                            <div className="d-flex align-items-center p-2 border rounded">
                                <div
                                    className="rounded me-2"
                                    style={{
                                        width: '8px',
                                        height: '40px',
                                        backgroundColor: item.color
                                    }}
                                ></div>
                                <div className="flex-grow-1">
                                    <div className="small text-muted">{item.status}</div>
                                    <div className="fw-bold">{item.count}</div>
                                    <div className="small text-muted">
                                        {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
