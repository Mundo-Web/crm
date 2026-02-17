import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Map origin names to campaign config
const campaignMap = {
  'CRM Atalaya': { name: 'CRM Atalaya', icon: 'page-layout-sidebar-left', color: '#343a40' },
  'Facebook': { name: 'Facebook Ads', icon: 'facebook', color: '#1877F2' },
  'Instagram': { name: 'Instagram Ads', icon: 'instagram', color: '#E4405F' },
  'Google': { name: 'Google', icon: 'google', color: '#4285F4' },
  'WhatsApp': { name: 'WhatsApp Directo', icon: 'whatsapp', color: '#25D366' }
};

export const ChannelDistribution = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="fw-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="mdi mdi-chart-pie me-2 text-primary"></i>
          Distribución de Leads por Canal
        </h5>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              dataKey="total"
            >
              {data.map((entry, index) => {
                const config = campaignMap[entry.origin];
                const color = config ? config.color : '#6c757d'; // gray if not found
                return (
                  <Cell key={`cell-${index}`} fill={color} />
                );
              })}
            </Pie>
            <Tooltip
              formatter={(value) => [value.toLocaleString('es-ES'), 'Leads']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-3">
          <div className="row g-2">
            {data.map((item) => {
              const config = campaignMap[item.origin];
              const color = config ? config.color : '#6c757d'; // gray if not found
              return (
                <div key={item.origin} className="col-6">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded me-2"
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: color
                      }}
                    ></div>
                    <div className="flex-grow-1">
                      <div className="small text-muted">{item.origin}</div>
                      <div className="fw-semibold">
                        {item.total} <span className="text-muted small">({((item.total / total) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
