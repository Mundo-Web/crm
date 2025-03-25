import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import SelectFormGroup from './components/form/SelectFormGroup';
import { renderToString } from 'react-dom/server';
import KPILeadsRest from './actions/KPILeadsRest';
import Number2Currency from './Utils/Number2Currency';
import Global from './Utils/Global';
import '../css/kpileads.css'

const KPILeads = ({ months = [], currentMonth, currentYear }) => {
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`)
  const [grouped, setGrouped] = useState([])
  const [groupedByManageStatus, setGroupedByManageStatus] = useState([])

  const [totalCount, setTotalCount] = useState(0)
  const [clientsCount, setClientsCount] = useState(0)
  const [archivedCount, setArchivedCount] = useState(0)
  const [managingCount, setManagingCount] = useState(0)

  const [totalSum, setTotalSum] = useState(0)
  const [clientsSum, setClientsSum] = useState(0)
  const [archivedSum, setArchivedSum] = useState(0)
  const [managingSum, setManagingSum] = useState(0)

  const [leadSources, setLeadSources] = useState({})
  const [originCounts, setOriginCounts] = useState([])

  const [topUsers, setTopUsers] = useState([])

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
    setLeadSources({})
    setOriginCounts([])

    KPILeadsRest.kpi(selectedMonth)
      .then(({ data, summary }) => {
        setGroupedByManageStatus(data)
        setGrouped(summary.grouped ?? [])

        setTotalCount(summary.totalCount ?? 0)
        setClientsCount(summary.clientsCount ?? 0)
        setArchivedCount(summary.archivedCount ?? 0)
        setManagingCount(summary.managingCount ?? 0)

        setTotalSum(summary.totalSum ?? 0)
        setClientsSum(summary.clientsSum ?? 0)
        setArchivedSum(summary.archivedSum ?? 0)
        setManagingSum(summary.managingSum ?? 0)

        setLeadSources(summary.leadSources ?? {})
        setOriginCounts(summary.originCounts ?? [])

        setTopUsers(summary.usersAssignation ?? [])
      });
  }, [selectedMonth])

  useEffect(() => {
    const ctx = document.getElementById('leadsStatusPie');
    let chart;

    if (ctx) {
      // Destroy existing chart if it exists
      if (window.leadsStatusChart) {
        window.leadsStatusChart.destroy();
      }

      // Create new chart
      chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: [Global.APP_NAME, 'WhatsApp', 'Integración'],
          datasets: [{
            data: [leadSources.crm_count, leadSources.whatsapp_count, leadSources.integration_count],
            backgroundColor: ['#f1556c', '#1abc9c', '#4a81d4'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      // Store chart reference globally
      window.leadsStatusChart = chart;
    }
    // Cleanup function to destroy chart when component unmounts
    return () => {
      if (window.leadsStatusChart) {
        window.leadsStatusChart.destroy();
      }
    };
  }, [leadSources])

  useEffect(() => {
    $('[data-plugin="knob"]').knob({
      'draw': function () {
        const count = this.i.attr('data-count')
        $(this.i).val(count)
      }
    })

    return () => {
      $('[data-plugin="knob"]').trigger('change');
    }
  }, [leadSources, originCounts])

  const totalLeadSources = leadSources.crm_count + leadSources.whatsapp_count + leadSources.integration_count

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
                return <option key={index} value={row.id} data-option={JSON.stringify(row)}>{month.format('MMMM YYYY').toTitleCase()}</option>
              })
            }
          </SelectFormGroup>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <h4 className='mt-0 mb-2'>Vista general de leads</h4>
        </div>
      </div>
      <div className="row">
        <div className="col-md-4">
          <div className="card card-body">
            <div style={{ height: '250px' }}>
              <canvas id="leadsStatusPie" width='100%' height='100%'></canvas>
            </div>
            <h4 className="mt-3 mb-2 text-center">Ingreso de leads</h4>
            <div className="d-flex flex-wrap gap-2 justify-content-evenly">
              <div className='text-center'>
                <input data-plugin="knob" data-width="60" data-height="60" data-graph="sources"
                  data-fgcolor="#f1556c" data-bgcolor="#f1556c33" value={(leadSources.crm_count / totalLeadSources * 100) || 0}
                  data-count={leadSources.crm_count || 0} data-skin="tron" data-angleloffset="180" data-readonly={true}
                  data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                <small className='text-muted d-block text-center'>{Global.APP_NAME}</small>
              </div>
              <div className='text-center'>
                <input data-plugin="knob" data-width="60" data-height="60" data-graph="sources"
                  data-fgcolor="#1abc9c" data-bgcolor="#1abc9c33" value={(leadSources.whatsapp_count / totalLeadSources * 100) || 0}
                  data-count={leadSources.whatsapp_count || 0} data-skin="tron" data-angleloffset="180" data-readonly={true}
                  data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                <small className='text-muted d-block text-center'>WhatsApp</small>
              </div>
              <div className='text-center'>
                <input data-plugin="knob" data-width="60" data-height="60" data-graph="sources"
                  data-fgcolor="#4a81d4" data-bgcolor="#4a81d433" value={(leadSources.integration_count / totalLeadSources * 100) || 0}
                  data-count={leadSources.integration_count || 0} data-skin="tron" data-angleloffset="180" data-readonly={true}
                  data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                <small className='text-muted d-block text-center'>Integracion</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="row">
            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-info" data-plugin="counterup">{totalCount}</h2>
                    <h5>Leads</h5>
                    <small>S/. {Number2Currency(totalSum)}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-success" data-plugin="counterup">{clientsCount}</h2>
                    <h5>Convertidos</h5>
                    <small>S/. {Number2Currency(clientsSum)}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-danger" data-plugin="counterup">{archivedCount}</h2>
                    <h5>No convertidos</h5>
                    <small>S/. {Number2Currency(archivedSum)}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="col-md-3 col-sm-6 col-xs-12">
              <div className="card">
                <div className="card-body widget-user">
                  <div className="text-center">
                    <h2 className="fw-normal text-primary" data-plugin="counterup">{managingCount}</h2>
                    <h5>En gestion</h5>
                    <small>S/. {Number2Currency(managingSum)}</small>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h4 className="header-title text-center my-0">Ingreso de Leads por Integración</h4>
                </div>
                <div className=" card-body" style={{
                  minHeight: '160px'
                }}>
                  <div className="d-flex flex-wrap gap-2 justify-content-evenly">
                    {
                      originCounts.map((origin, index) => {
                        const count = origin.count || 0;
                        const percent = count / leadSources.integration_count * 100
                        const uniqueKey = `${count.origin}-${count.count}-${index}`
                        return <div id={uniqueKey} key={uniqueKey} className='text-center'>
                          <input data-plugin="knob" data-width="100" data-height="100"
                            data-fgcolor="#4a81d4" data-bgcolor="#4a81d433" value={percent}
                            data-count={count} data-skin="tron" data-angleloffset="180" data-readonly={true}
                            data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                          <small className='text-muted d-block text-center mt-1'>{origin.origin}</small>
                        </div>
                      })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='row'>
        <div className="col-xl-3 col-lg-4 col-sm-6 col-xs-12">
          <div className="card">
            <div className="card-body">
              <h4 className="header-title mb-3">Empleado del mes</h4>

              <div className="inbox-widget">
                {
                  topUsers
                    .sort((a, b) => b.count - a.count)
                    .map((row, index) => {
                      const fullname = `${row.assigned.name.split(' ')[0]} ${row.assigned.lastname.split(' ')[0]}`
                      return <div key={index} className="inbox-item">
                        <div className="inbox-item-img position-relative">
                          {
                            index <= 1 &&
                            <i className={`user-featured position-absolute mdi mdi-star ${index == 0 && 'text-warning'}`} />
                          }
                          <img className={`rounded-circle aspect-square ${index == 0 && 'border-warning'}`}
                            src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${row.assigned.relative_id}`}
                            style={{
                              padding: index <= 1 ? '2px' : 0,
                              border: index <= 1 ? '2px solid' : 0,
                            }}
                            onError={e => {
                              e.onError = null
                              console.log(e)
                              e.target.src = `https://ui-avatars.com/api/?name=${fullname.replaceAll(' ', '+')}&color=7F9CF5&background=EBF4FF`
                            }}
                          />
                        </div>
                        <h6 className="inbox-item-author mt-0 mb-1 text-truncate">{fullname}</h6>
                        <p className="inbox-item-text">
                          <small className='d-block'>{row.count} lead{row.count != 1 && 's'} atendido{row.count != 1 && 's'}</small>
                          <small className='d-block'>{row.emails_sent} mail{row.emails_sent != 1 && 's'} enviado{row.emails_sent != 1 && 's'}</small>
                        </p>
                      </div>
                    })
                }
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-9 col-lg-8 col-sm-6 col-xs-12">
          <div className='d-flex gap-3 mb-3' style={{
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