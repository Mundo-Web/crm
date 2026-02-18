import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const FunnelChart = ({ data = {}, extraData = [] }) => {
  // Dummy data hardcoded for demo purposes
  const dummyData = {
    impressions: 0,
    landingClicks: 0,
    landingRegistrations: 0,
    whatsappClicks: 0,
    contacted: 0,
    salesClosed: 0
  };

  const funnelData = [
    { stage: 'Impresiones', count: data.impressions ?? dummyData.impressions, color: '#3B82F6' },
    ...extraData,
    { stage: 'Contacto realizado', count: data.contacted ?? dummyData.contacted, color: '#F59E0B' },
    { stage: 'Venta cerrada', count: data.salesClosed ?? dummyData.salesClosed, color: '#10B981' }
  ];

  const calculateDropRate = (current, previous) => {
    if (previous === 0) return 0;
    return ((1 - current / previous) * 100).toFixed(1);
  };

  // Calculate the sum of counts from extraData
  const extraDataSum = extraData.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="mdi mdi-filter-variant me-2 text-primary"></i>
          Funnel de Conversión
        </h5>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={150} />
            <Tooltip
              formatter={(value) => value.toLocaleString('es-ES')}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4">
          <h6 className="text-muted small mb-3">TASAS DE CAÍDA</h6>
          <div className="row g-2">
            {/* Drop rate from Impressions to extraData sum */}
            <div className="col-md-4">
              <div className="p-2 bg-light rounded">
                <div className="small text-muted">Impresiones → Interesado</div>
                <div className="fw-semibold text-danger">
                  -{calculateDropRate(extraDataSum, data.impressions ?? dummyData.impressions)}%
                </div>
              </div>
            </div>

            {/* Drop rate from Impressions to each extraData element */}
            {extraData.map((item, index) => (
              <div className="col-md-4" key={index}>
                <div className="p-2 bg-light rounded">
                  <div className="small text-muted">Impresiones → {item.stage}</div>
                  <div className="fw-semibold text-danger">
                    -{calculateDropRate(item.count, data.impressions ?? dummyData.impressions)}%
                  </div>
                </div>
              </div>
            ))}
            {/* Drop rate from Interesado (extraData sum) to Contacto realizado */}
            <div className="col-md-4">
              <div className="p-2 bg-light rounded">
                <div className="small text-muted">Interesado → Contacto realizado</div>
                <div className="fw-semibold text-danger">
                  -{calculateDropRate(
                    data.contacted ?? dummyData.contacted,
                    extraDataSum
                  )}%
                </div>
              </div>
            </div>

            {/* Drop rate from Contacto realizado to Venta cerrada */}
            <div className="col-md-4">
              <div className="p-2 bg-light rounded">
                <div className="small text-muted">Contacto realizado → Venta cerrada</div>
                <div className="fw-semibold text-danger">
                  -{calculateDropRate(
                    data.salesClosed ?? dummyData.salesClosed,
                    data.contacted ?? dummyData.contacted
                  )}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
