import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ConversionComparison = ({ data: dataDB }) => {

    // Procesar datos dinámicamente desde dataDB
    const channels = {};

    dataDB.forEach(item => {
        const label = item.label || 'Otros';
        channels[label] = {
            total: item.count || 0,
            sales: item.clients || 0
        };
    });

    // Generar chartData dinámicamente
    const chartData = [
        {
            name: 'Total Leads',
            ...Object.fromEntries(
                Object.entries(channels).map(([key, value]) => [key, value.total])
            )
        },
        {
            name: 'Ventas Cerradas',
            ...Object.fromEntries(
                Object.entries(channels).map(([key, value]) => [key, value.sales])
            )
        }
    ];

    // Calcular tasas de conversión
    const conversionRates = {};
    Object.entries(channels).forEach(([key, value]) => {
        conversionRates[key] = value.total > 0 ? (value.sales / value.total) * 100 : 0;
    });

    // Determinar el canal con mejor conversión
    const bestChannel = Object.entries(conversionRates).reduce(
        (best, [key, rate]) => (rate > best.rate ? { key, rate } : best),
        { key: '', rate: 0 }
    );

    // Asignar colores a cada canal
    const channelColors = {
        Formulario: '#6366F1',
        'Boton whatsapp': '#25D366',
        contacto: '#F59E0B',
        Otros: '#9CA3AF'
    };

    // Asignar íconos a cada canal
    const channelIcons = {
        Formulario: 'mdi-file-document-outline',
        'Boton whatsapp': 'mdi-whatsapp',
        contacto: 'mdi-phone-outline',
        Otros: 'mdi-help-circle-outline'
    };

    return (
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-body">
                <h5 className="card-title mb-4">
                    <i className="mdi mdi-chart-bar me-2 text-primary"></i>
                    Análisis de Impresiones
                </h5>

                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        {Object.entries(channels).map(([key]) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={channelColors[key] || channelColors.Otros}
                                radius={[8, 8, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>

                <div className="row g-3 mt-3">
                    {Object.entries(channels).map(([key, value]) => (
                        <div className="col-6" key={key}>
                            <div className="p-3 border rounded bg-light">
                                <div className="d-flex align-items-center mb-2">
                                    <i className={`${channelIcons[key] || channelIcons.Otros} fs-4 me-2`} style={{ color: channelColors[key] || channelColors.Otros }}></i>
                                    <span className="fw-semibold">{key}</span>
                                </div>
                                <div className="h4 mb-1">{conversionRates[key].toFixed(1)}%</div>
                                <div className="small text-muted">Tasa de conversión</div>
                                <div className="mt-2 small">
                                    <span className="badge" style={{ backgroundColor: channelColors[key] || channelColors.Otros }}>
                                        {value.sales} ventas
                                    </span>
                                    <span className="ms-2 text-muted">de {value.total} leads</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {bestChannel.rate > 0 && (
                    <div className="alert alert-success mt-3 mb-0" role="alert">
                        <i className="mdi mdi-lightbulb me-2"></i>
                        <strong>{bestChannel.key}</strong> tiene la mejor tasa de conversión: <strong>{bestChannel.rate.toFixed(1)}%</strong>
                    </div>
                )}
            </div>
        </div>
    );
};
