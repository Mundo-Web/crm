import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const TrafficSourceAnalysis = () => {
  // Dummy data
  const leads = [
    { channel: 'Facebook Ads', subChannel: 'Direct', status: 'Venta cerrada' },
    { channel: 'Facebook Ads', subChannel: 'Direct', status: 'En proceso' },
    { channel: 'Facebook Ads', subChannel: 'Landing Page', status: 'Venta cerrada' },
    { channel: 'Facebook Ads', subChannel: 'Landing Page', status: 'En proceso' },
    { channel: 'Instagram Ads', subChannel: 'Direct', status: 'Venta cerrada' },
    { channel: 'Instagram Ads', subChannel: 'Direct', status: 'En proceso' },
    { channel: 'Instagram Ads', subChannel: 'Landing Page', status: 'Venta cerrada' },
    { channel: 'Instagram Ads', subChannel: 'Landing Page', status: 'En proceso' },
    { channel: 'TikTok Ads', subChannel: 'Direct', status: 'Venta cerrada' },
    { channel: 'TikTok Ads', subChannel: 'Direct', status: 'En proceso' },
    { channel: 'TikTok Ads', subChannel: 'Landing Page', status: 'Venta cerrada' },
    { channel: 'TikTok Ads', subChannel: 'Landing Page', status: 'En proceso' },
    { channel: 'Google', subChannel: 'Direct', status: 'Venta cerrada' },
    { channel: 'Google', subChannel: 'Direct', status: 'En proceso' },
    { channel: 'Google', subChannel: 'Landing Page', status: 'Venta cerrada' },
    { channel: 'Google', subChannel: 'Landing Page', status: 'En proceso' },
    { channel: 'WhatsApp Directo', subChannel: 'Direct', status: 'Venta cerrada' },
    { channel: 'WhatsApp Directo', subChannel: 'Direct', status: 'En proceso' },
    { channel: 'WhatsApp Directo', subChannel: 'Landing Page', status: 'Venta cerrada' },
    { channel: 'WhatsApp Directo', subChannel: 'Landing Page', status: 'En proceso' },
  ];

  const directLeads = leads.filter(l => l.subChannel === 'Direct' && l.channel !== 'Landing Page');
  const landingLeads = leads.filter(l => l.subChannel !== 'Direct' || l.channel === 'Landing Page');

  const directSales = directLeads.filter(l => l.status === 'Venta cerrada').length;
  const landingSales = landingLeads.filter(l => l.status === 'Venta cerrada').length;

  const directConvRate = directLeads.length > 0 ? (directSales / directLeads.length) * 100 : 0;
  const landingConvRate = landingLeads.length > 0 ? (landingSales / landingLeads.length) * 100 : 0;

  const channelBreakdown = [
    { name: 'Facebook Ads', direct: 0, landing: 0 },
    { name: 'Instagram Ads', direct: 0, landing: 0 },
    { name: 'TikTok Ads', direct: 0, landing: 0 },
    { name: 'Google', direct: 0, landing: 0 },
    { name: 'WhatsApp', direct: 0, landing: 0 }
  ];

  leads.forEach(lead => {
    let channelIndex = -1;
    if (lead.channel === 'Facebook Ads') channelIndex = 0;
    else if (lead.channel === 'Instagram Ads') channelIndex = 1;
    else if (lead.channel === 'TikTok Ads') channelIndex = 2;
    else if (lead.channel === 'Google') channelIndex = 3;
    else if (lead.channel === 'WhatsApp Directo') channelIndex = 4;

    if (channelIndex !== -1) {
      if (lead.subChannel === 'Direct') {
        channelBreakdown[channelIndex].direct++;
      } else {
        channelBreakdown[channelIndex].landing++;
      }
    }
  });

  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="card-title mb-1 fw-bold">
              <span className="mdi mdi-sitemap me-2 text-primary"></span>
              Análisis de Flujo de Tráfico
            </h5>
            <p className="text-muted small mb-0">Campañas directas vs Landing Page</p>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="p-3 bg-light rounded">
              <div className="d-flex align-items-center mb-2">
                <span className="mdi mdi-target fs-4 text-success me-2"></span>
                <h6 className="my-0 fw-bold">Campañas Directas</h6>
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div className="fs-3 fw-bold text-success">{directLeads.length}</div>
                  <div className="small text-muted">Leads totales</div>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-bold text-success">{directConvRate.toFixed(1)}%</div>
                  <div className="small text-muted">Conversión</div>
                </div>
              </div>
              <div className="mt-2 small text-muted">
                <span className="mdi mdi-check-circle text-success me-1"></span>
                {directSales} ventas cerradas
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-3 bg-light rounded">
              <div className="d-flex align-items-center mb-2">
                <span className="mdi mdi-web fs-4 text-primary me-2"></span>
                <h6 className="my-0 fw-bold">Vía Landing Page</h6>
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div className="fs-3 fw-bold text-primary">{landingLeads.length}</div>
                  <div className="small text-muted">Leads totales</div>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-bold text-primary">{landingConvRate.toFixed(1)}%</div>
                  <div className="small text-muted">Conversión</div>
                </div>
              </div>
              <div className="mt-2 small text-muted">
                <span className="mdi mdi-check-circle text-primary me-1"></span>
                {landingSales} ventas cerradas
              </div>
            </div>
          </div>
        </div>

        <h6 className="mb-3 fw-bold small text-uppercase text-muted">Distribución por Canal</h6>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={channelBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
            <Bar dataKey="direct" name="Campañas Directas" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="landing" name="Vía Landing" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
          <div className="d-flex align-items-start">
            <span className="mdi mdi-lightbulb text-info me-2 mt-1"></span>
            <div className="small">
              <strong>Insight:</strong>{' '}
              {directConvRate > landingConvRate ? (
                <>Las campañas directas están convirtiendo {(directConvRate - landingConvRate).toFixed(1)}% mejor que el flujo de landing. Considera aumentar presupuesto en campañas directas.</>
              ) : (
                <>El flujo de landing page está convirtiendo {(landingConvRate - directConvRate).toFixed(1)}% mejor. La landing está cualificando mejor los leads antes de ingresarlos al CRM.</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
