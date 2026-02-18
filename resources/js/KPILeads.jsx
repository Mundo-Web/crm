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
import Tippy from '@tippyjs/react';
import { FetchParams, GET } from 'sode-extend-react';
import Swal from 'sweetalert2';
import { TrafficSourceAnalysis } from './Reutilizables/KPSLeads/TrafficSourceAnalysis';
import { DirectCampaignPerformance } from './Reutilizables/KPSLeads/DirectCampaignPerformance';
import { FunnelChart } from './Reutilizables/KPSLeads/FunnelChart';
import { ChannelDistribution } from './Reutilizables/KPSLeads/ChannelDistribution';

// Lista de 10 colores aleatorios
const colors = ['#71b6f9', '#f1556c', '#1abc9c', '#4a81d4', '#f7b84b', '#5b6be8', '#34c38f', '#50a5f1', '#ffbb78', '#aec7e8'];

const KPILeads = ({ months = [], currentMonth, currentYear }) => {
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`)
  const [grouped, setGrouped] = useState([])
  const [groupedByManageStatus, setGroupedByManageStatus] = useState([])

  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [clientsCount, setClientsCount] = useState(0)
  const [archivedCount, setArchivedCount] = useState(0)
  const [managingCount, setManagingCount] = useState(0)

  const [totalSum, setTotalSum] = useState(0)
  const [clientsSum, setClientsSum] = useState(0)
  const [archivedSum, setArchivedSum] = useState(0)
  const [managingSum, setManagingSum] = useState(0)

  const [leadSources, setLeadSources] = useState({})
  const [originCounts, setOriginCounts] = useState([])
  const [originCampaignCounts, setOriginCampaignCounts] = useState([])
  const [breakdowns, setBreakdowns] = useState(0)
  const [funnelCounts, setFunnelCounts] = useState({})
  const [originLandingCampaignCounts, setOriginLandingCampaignCounts] = useState([])

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

  const fetchGraph = (selectedMonth) => {
    setLeadSources({})
    setOriginCounts([])

    KPILeadsRest.kpi(selectedMonth)
      .then(({ data, summary }) => {
        setGroupedByManageStatus(data)
        setGrouped(summary.grouped ?? [])

        setTotalCount(summary.totalCount ?? 0)
        setPendingCount(summary.pendingCount ?? 0)
        setClientsCount(summary.clientsCount ?? 0)
        setArchivedCount(summary.archivedCount ?? 0)
        setManagingCount(summary.managingCount ?? 0)

        setTotalSum(summary.totalSum ?? 0)
        setClientsSum(summary.clientsSum ?? 0)
        setArchivedSum(summary.archivedSum ?? 0)
        setManagingSum(summary.managingSum ?? 0)

        setLeadSources(summary.leadSources ?? {})
        setOriginCounts(summary.originCounts ?? [])
        setOriginCampaignCounts(summary.originCampaignCounts ?? []);
        setFunnelCounts(summary.funnelCounts ?? {})
        setOriginLandingCampaignCounts(summary.originLandingCampaignCounts ?? [])

        setBreakdowns(summary.breakdownCounts ?? 0)

        setTopUsers(summary.usersAssignation ?? [])
      });
  }

  useEffect(() => {
    fetchGraph(selectedMonth)
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

  useEffect(() => {
    if (GET.message) {
      Swal.fire({
        icon: 'success',
        title: 'Operación exitosa',
        text: GET.message
      })
      history.pushState(null, null, '/home')
    }
  }, [null])

  return (
    <>

      <div className="row">
        <div className='col-xxl-2 col-xl-3 col-lg-4 col-md-6 col-sm-8 col-12 mb-0'>
          <div className="d-flex gap-2">
            <div className="dropdown flex-grow-1">
              <button
                className="btn btn-light bg-white dropdown-toggle w-100 text-start rounded-pill"
                type="button"
                id="monthDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {(() => {
                  const selected = months.find(m => m.id === selectedMonth);
                  if (!selected) return 'Seleccione un mes';
                  const month = moment({ month: selected.month - 1, year: selected.year });
                  return month.format('MMMM YYYY').toTitleCase();
                })()}
              </button>
              <ul className="dropdown-menu w-100" aria-labelledby="monthDropdown">
                {months.map((row, index) => {
                  const month = moment({ month: row.month - 1, year: row.year });
                  return (
                    <li key={index}>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedMonth(row.id);
                        }}
                      >
                        <b className='d-block'>{month.format('MMMM YYYY').toTitleCase()}</b>
                        <small>
                          <i className='me-1 fa fa-users'></i>
                          {row.quantity} entradas
                        </small>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <button
              className="btn btn-light rounded-pill"
              type="button"
              onClick={() => fetchGraph(selectedMonth)}
              title="Refrescar"
            >
              <i className="mdi mdi-refresh"></i>
            </button>
          </div>
        </div>
      </div>
      {/* Dummy data for kpiData */}
      {(() => {
        const formatNumber = n => n.toLocaleString('es-PE');
        const formatPercentage = n => {
          return `${n.toFixed(1)}%`
        };

        return (
          <div className="row g-3 mb-3 mt-0">
            <div className="col-md-6 col-xl">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1 small text-uppercase fw-semibold">Total Leads</p>
                      <h2 className="mb-0 fw-bold">{formatNumber(totalCount)}</h2>
                      {/* <div className="mt-2">
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <i className="mdi mdi-arrow-up me-1"></i>
                          12.5%
                        </span>
                      </div> */}
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#6366F115'
                      }}
                    >
                      <i className="mdi mdi-account-multiple fs-4" style={{ color: '#6366F1' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1 small text-uppercase fw-semibold">Leads Nuevos</p>
                      <h2 className="mb-0 fw-bold">{formatNumber(pendingCount)}</h2>
                      {/* <div className="mt-2">
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <i className="mdi mdi-arrow-up me-1"></i>
                          8.3%
                        </span>
                      </div> */}
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#3B82F615'
                      }}
                    >
                      <i className="mdi mdi-account-plus fs-4" style={{ color: '#3B82F6' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1 small text-uppercase fw-semibold">Leads Contactados</p>
                      <h2 className="mb-0 fw-bold">{formatNumber(managingCount)}</h2>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#F59E0B15'
                      }}
                    >
                      <i className="mdi mdi-phone fs-4" style={{ color: '#F59E0B' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1 small text-uppercase fw-semibold">Ventas Cerradas</p>
                      <h2 className="mb-0 fw-bold">{formatNumber(clientsCount)}</h2>
                      {/* <div className="mt-2">
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <i className="mdi mdi-arrow-up me-1"></i>
                          15.7%
                        </span>
                      </div> */}
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#10B98115'
                      }}
                    >
                      <i className="mdi mdi-trophy fs-4" style={{ color: '#10B981' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-xl">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1 small text-uppercase fw-semibold">Tasa de Conversión</p>
                      <h2 className="mb-0 fw-bold">{formatPercentage((clientsCount / totalCount * 100) || 0)}</h2>
                    </div>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#8B5CF615'
                      }}
                    >
                      <i className="mdi mdi-percent fs-4" style={{ color: '#8B5CF6' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <FunnelChart data={{ impressions: breakdowns, contacted: funnelCounts.managing, salesClosed: funnelCounts.clients }} extraData={Object.keys(funnelCounts)
            .filter(funnel => funnel != 'clients' && funnel != 'managing')
            .map((funnel, idx) => ({ stage: funnel, count: funnelCounts[funnel], color: colors[idx % colors.length] }))
          } />
        </div>
        <div className="col-lg-4">
          <ChannelDistribution data={originCounts} />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-lg-6">
          <TrafficSourceAnalysis data={originLandingCampaignCounts} />
        </div>
        <div className="col-lg-6">
          <DirectCampaignPerformance originCounts={originCampaignCounts} />
        </div>
      </div>

      {/* <div className="row">
        <div className="col-12">
          <h4 className='mt-0 mb-2'>Vista general de leads</h4>
        </div>
      </div> */}
      {/* <div className="row">
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
      </div> */}

      <div className='row'>
        <div className="col-xl-3 col-lg-4 col-sm-6 col-xs-12">
          <div className="card">
            <div className="card-header bg-danger">
              <h4 className="header-title my-0 text-white">
                <i className='mdi mdi-podium-gold me-1'></i>
                Ranking de atenciones
              </h4>
            </div>
            <div className="card-body" style={{
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
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
                            onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                          />
                        </div>
                        <h5 className="inbox-item-author mt-0 mb-2 text-truncate">{fullname}</h5>
                        <p className="inbox-item-text">
                          <div className='d-flex gap-1 flex-wrap w-100'>
                            <Tippy content={`${row.count} leads atendidos`}>
                              <div className='text-start' style={{ width: '50px' }}>
                                <i className='mdi mdi-account me-1'></i>
                                {row.count}
                              </div>
                            </Tippy>
                            <Tippy content={`${row.emails_sent} mails enviados`}>
                              <div className='text-start' style={{ width: '50px' }}>
                                <i className='mdi mdi-email-send me-1'></i>
                                {row.emails_sent}
                              </div>
                            </Tippy>
                            {
                              row.converted !== null &&
                              <Tippy content={`${row.converted} leads convertidos`}>
                                <div className='text-start' style={{ width: '50px' }}>
                                  <i className='mdi mdi-account-check me-1'></i>
                                  {row.converted}
                                </div>
                              </Tippy>
                            }
                          </div>
                          {/* <small className='d-block'>{row.count} lead{row.count != 1 && 's'} atendido{row.count != 1 && 's'}</small>
                          <small className='d-block'>{row.emails_sent} mail{row.emails_sent != 1 && 's'} enviado{row.emails_sent != 1 && 's'}</small>
                          <small className='d-block'>{row.converted} lead{row.converted != 1 && 's'} convertido{row.converted != 1 && 's'}</small> */}
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
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="header-title my-0 text-truncate w-100" style={{ color: kpi.color }}>{kpi.name}</h4>
                    <small className='font-bold'><b>{kpi.quantity}</b></small>
                  </div>
                  <div className="card-body" style={{
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
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