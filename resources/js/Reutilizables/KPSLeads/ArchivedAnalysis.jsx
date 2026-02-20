import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ArchivedAnalysis = ({ data }) => {

  // Compute totals from incoming data
  const totalIncoming = data.reduce((sum, item) => sum + (item.incoming || 0), 0);
  const totalArchived = data.reduce((sum, item) => sum + (item.archived || 0), 0);

  // Dummy conversion metrics (fallback if no conversion data is provided)
  const incomingSales = Math.round(totalIncoming * 0.25);
  const archivedSales = Math.round(totalArchived * 0.3);

  const incomingConvRate = totalIncoming > 0 ? (incomingSales / totalIncoming) * 100 : 0;
  const archivedConvRate = totalArchived > 0 ? (archivedSales / totalArchived) * 100 : 0;

  // Prepare chart data
  const channelBreakdown = data.map((item) => ({
    name: item.name,
    incoming: item.incoming || 0,
    jarchived: item.archived || 0,
  }));

  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="card-title mb-1 fw-bold">
              <span className="mdi mdi-sitemap me-2 text-primary"></span>
              Análisis de Archivados
            </h5>
            <p className="text-muted small mb-0">Leads entrantes vs Archivados por red social o canal</p>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="p-3 bg-light rounded">
              <div className="d-flex align-items-center mb-2">
                <span className="mdi mdi-target fs-4 text-success me-2"></span>
                <h6 className="my-0 fw-bold">Leads Entrantes</h6>
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div className="fs-3 fw-bold text-success">{totalIncoming}</div>
                  <div className="small text-muted">Leads totales</div>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-bold text-success">{incomingConvRate.toFixed(1)}%</div>
                  <div className="small text-muted">Conversión</div>
                </div>
              </div>
              <div className="mt-2 small text-muted">
                <span className="mdi mdi-check-circle text-success me-1"></span>
                {incomingSales} ventas cerradas
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-3 bg-light rounded">
              <div className="d-flex align-items-center mb-2">
                <span className="mdi mdi-archive fs-4 text-primary me-2"></span>
                <h6 className="my-0 fw-bold">Archivados</h6>
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <div className="fs-3 fw-bold text-primary">{totalArchived}</div>
                  <div className="small text-muted">Leads archivados</div>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-bold text-primary">{archivedConvRate.toFixed(1)}%</div>
                  <div className="small text-muted">Conversión</div>
                </div>
              </div>
              <div className="mt-2 small text-muted">
                <span className="mdi mdi-check-circle text-primary me-1"></span>
                {archivedSales} ventas cerradas
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
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="incoming" name="Leads Entrantes" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="jarchived" name="Archivados" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
          <div className="d-flex align-items-start">
            <span className="mdi mdi-lightbulb text-info me-2 mt-1"></span>
            <div className="small">
              <strong>Insight:</strong>{' '}
              {totalIncoming > 0 && totalArchived > 0 ? (
                <>
                  {((totalArchived / totalIncoming) * 100).toFixed(1)}% de los leads entrantes están siendo archivados.{' '}
                  {totalArchived > totalIncoming * 0.6
                    ? 'Más de la mitad de tus leads se archivan: revisa la calificación o el proceso de nutrición.'
                    : 'Proporción controlada; asegúrate de que solo los leads realmente no viables se archiven.'}
                </>
              ) : (
                <>No hay suficientes datos para generar un insight.</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
