import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import { Math, String } from 'sode-extend-react';
import SelectFormGroup from './components/form/SelectFormGroup';
import { renderToString } from 'react-dom/server';
import KPILeadsRest from './actions/KPILeadsRest';

const KPILeads = ({ months = [], currentMonth, currentYear,
  // grouped = [], totalCount, clientsCount, archivedCount, managingCount, groupedByManageStatus
}) => {
  const prettyMonth = moment({
    month: currentMonth - 1,
    year: currentYear
  }).format('MMMM YYYY');

  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`)
  const [grouped, setGrouped] = useState([])
  const [groupedByManageStatus, setGroupedByManageStatus] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [clientsCount, setClientsCount] = useState(0)
  const [archivedCount, setArchivedCount] = useState(0)
  const [managingCount, setManagingCount] = useState(0)

  const monthTemplate = ({
    id,
    text,
    element
  }) => {
    if (!id) return text
    const data = $(element).data('option')
    return $(renderToString(<div>
      <b className='d-block'>{text}</b>
      <small>
        <i className='me-1 fa fa-users'></i>
        {data.quantity} entradas
      </small>
    </div>))
  }

  useEffect(() => {
    console.log(selectedMonth)
    KPILeadsRest.kpi(selectedMonth)
      .then(({ data, summary }) => {
        setGroupedByManageStatus(data)
        setGrouped(summary.grouped ?? [])
        setTotalCount(summary.totalCount ?? 0)
        setClientsCount(summary.clientsCount ?? 0)
        setArchivedCount(summary.archivedCount ?? 0)
        setManagingCount(summary.managingCount ?? 0)
      });
  }, [selectedMonth])

  return (
    <>
      <div className="row">
        <div className='col-xl-3 col-lg-4 col-md-6 col-sm-8 col-12 mb-2'>
          <SelectFormGroup minimumResultsForSearch={-1} templateResult={monthTemplate} templateSelection={monthTemplate} onChange={e => setSelectedMonth(e.target.value)}>
            {
              months.map((row, index) => {
                const month = moment({
                  month: row.month - 1,
                  year: row.year
                })
                return <option key={index} value={row.id} data-option={JSON.stringify(row)} selected={selectedMonth == row.id}>{month.format('MMMM YYYY').toTitleCase()}</option>
              })
            }
          </SelectFormGroup>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <div className="card">
            <div className="card-body widget-user">
              <div className="text-center">
                <h2 className="fw-normal text-info" data-plugin="counterup">{totalCount}</h2>
                <h5>Leads - {prettyMonth}</h5>
              </div>
            </div>
          </div>

        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card">
            <div className="card-body widget-user">
              <div className="text-center">
                <h2 className="fw-normal text-success" data-plugin="counterup">{clientsCount}</h2>
                <h5>Convertidos</h5>
              </div>
            </div>
          </div>

        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card">
            <div className="card-body widget-user">
              <div className="text-center">
                <h2 className="fw-normal text-danger" data-plugin="counterup">{archivedCount}</h2>
                <h5>No convertidos</h5>
              </div>
            </div>
          </div>

        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card">
            <div className="card-body widget-user">
              <div className="text-center">
                <h2 className="fw-normal text-primary" data-plugin="counterup">{managingCount}</h2>
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
                      <b>{kpi.quantity}</b>
                    </div>
                    <h4 className="header-title my-0 text-truncate" style={{ color: kpi.color }}>{kpi.name}</h4>
                  </div>
                  <div className="card-body">
                    <div className='d-flex gap-3 flex-column'>
                      {
                        groupedByManageStatus.filter(({ status_id }) => status_id == kpi.id).sort((a, b) => b.quantity - a.quantity).map((row, index) => {
                          const percent = ((row.quantity / kpi.quantity) * 100).toFixed(2);
                          return <div key={index}>
                            <h5 className="my-0">{row.manage_status_name} <span className="float-end" style={{ color: row.manage_status_color }}>{row.quantity}</span></h5>
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