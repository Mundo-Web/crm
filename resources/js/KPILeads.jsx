import React from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import { Math } from 'sode-extend-react';

const KPILeads = ({ grouped = [], currentMonth, currentYear, totalCount, clientsCount, archivedCount, managingCount, groupedByManageStatus }) => {
  const totalQuantity = grouped.reduce((acc, kpi) => acc + kpi.quantity, 0);

  const prettyMonth = moment({
    month: currentMonth - 1,
    year: currentYear
  }).format('MMMM YYYY');

  console.log(grouped)

  return (
    <>
      <div class="row">
        <div class="col-xl-3 col-md-6">
          <div class="card">
            <div class="card-body widget-user">
              <div class="text-center">
                <h2 class="fw-normal text-info" data-plugin="counterup">{totalCount}</h2>
                <h5>Leads - {prettyMonth}</h5>
              </div>
            </div>
          </div>

        </div>

        <div class="col-xl-3 col-md-6">
          <div class="card">
            <div class="card-body widget-user">
              <div class="text-center">
                <h2 class="fw-normal text-success" data-plugin="counterup">{clientsCount}</h2>
                <h5>Convertidos</h5>
              </div>
            </div>
          </div>

        </div>

        <div class="col-xl-3 col-md-6">
          <div class="card">
            <div class="card-body widget-user">
              <div class="text-center">
                <h2 class="fw-normal text-danger" data-plugin="counterup">{archivedCount}</h2>
                <h5>No convertidos</h5>
              </div>
            </div>
          </div>

        </div>

        <div class="col-xl-3 col-md-6">
          <div class="card">
            <div class="card-body widget-user">
              <div class="text-center">
                <h2 class="fw-normal text-primary" data-plugin="counterup">{managingCount}</h2>
                <h5>En gestion</h5>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className='row'>
        <div className="col-12">
          <div className='d-flex gap-1 mb-3' style={{
            overflowX: 'auto',
          }}>
            {
              grouped.map((kpi, index) => {
                return <div key={index} className="card" style={{
                  minWidth: '270px',
                  maxWidth: '270px'
                }}>
                  <div className="card-header">
                    <div className="float-end">
                      {kpi.quantity}
                    </div>
                    <h4 className="header-title my-0" style={{ color: kpi.color }}>{kpi.name}</h4>
                  </div>
                  <div className="card-body">
                    <div className='d-flex gap-3 flex-column'>
                      {
                        groupedByManageStatus.filter(({ status_id }) => status_id == kpi.id).map((row, index) => {
                          const percent = ((row.quantity / kpi.quantity) * 100).toFixed(2);
                          return <div key={index}>
                            <h5 className="mt-0">{row.manage_status_name} <span className="float-end" style={{color: row.manage_status_color}}>{row.quantity}</span></h5>
                            <div className="progress progress-bar-alt-primary progress-sm mt-0" style={{
                              backgroundColor: `${row.manage_status_color}44`
                            }}>
                              <div className="progress-bar progress-animated wow animated animated" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" style={{ width: `${percent}%`, visibility: 'visible', animationName: 'animationProgress', backgroundColor: row.manage_status_color }}>
                              </div>
                            </div>
                          </div>
                        })
                      }
                    </div>
                  </div>
                </div>
              })
            }
          </div>
        </div>
      </div>
    </>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title={`KPI - Leads`}>
      <KPILeads {...properties} />
    </Adminto>
  );
})