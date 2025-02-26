import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import Chart from 'chart.js/auto';
import DashboardRest from './actions/DashboardRest';
import DropdownEnd from './components/dropdown/DropdownEnd';
import DropdownItem from './components/dropdown/DropdownItem';
import Tippy from '@tippyjs/react';
import ProjectsRest from './actions/ProjectsRest';
import Number2Currency from './Utils/Number2Currency';
import RemainingsHistoryRest from './actions/RemainingsHistoryRest';
import DateRange from './Reutilizables/Projects/DateRange';
import Assigneds from './Reutilizables/Projects/Assigneds';

const KPIProjects = ({ finishedProjectStatus }) => {
  const revenueRef = useRef();
  const chartRef = useRef(null); // Usar useRef para mantener la referencia del gráfico
  const pieRef = useRef(null);
  const remainingInput = useRef(null);

  const [revenuesTitle, setRevenuesTitle] = useState('Reporte mensual');
  const [revenuesRange, setRevenuesRange] = useState('monthly');

  const [revenues, setRevenues] = useState([]);
  const [lastRevenues, setLastRevenues] = useState({ last: 0, actual: 0 });
  const [lastMonth, setLastMonth] = useState(moment({ month: moment().month() - 1 }).format('MMMM Y'));
  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalProjectsThisMonth, setTotalProjectsThisMonth] = useState(0)
  const [projectsRemaining, setProjectsRemaining] = useState([])
  const [totalRemaining, setTotalRemaining] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [lastRemaining, setLastRemaining] = useState(0)
  const [showDebtOnly, setShowDebtOnly] = useState(false);

  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy(); // Destruir el gráfico existente antes de crear uno nuevo
    }
    chartRef.current = new Chart(revenueRef.current, {
      type: 'bar',
      data: {
        labels: revenues.map(row => {
          switch (revenuesRange) {
            case 'daily':
              return moment(row.date).format('DD MMM')
            case 'weekly':
              const year = Number(String(row.week).slice(0, 4))
              const week = Number(String(row.week).slice(4, 6))

              const startOfWeek = moment().year(year).week(week + 1).startOf('week').isoWeekday(0);
              const endOfWeek = moment().year(year).week(week + 1).endOf('week').isoWeekday(6);

              const startDay = startOfWeek.format('D');
              const endDay = endOfWeek.format('D');
              const monthStart = startOfWeek.format('MMM');
              const monthEnd = endOfWeek.format('MMM')

              if (monthStart == monthEnd) return `${startDay} - ${endDay} ${monthStart}`
              return `${startDay} ${monthStart} - ${endDay} ${monthEnd}`
            case 'annually':
              return row.year
            default:
              return moment({ year: row.year, month: row.month - 1 }).format('MMMM Y')
          }
        }),
        datasets: [
          {
            label: revenuesTitle,
            data: revenues.map(row => row.total)
          }
        ]
      }
    });
  }, [revenues]);

  useEffect(() => {
    DashboardRest.revenue(revenuesRange)
      .then(data => {
        setRevenues(data)
      })
  }, [revenuesRange])

  useEffect(() => {
    DashboardRest
      .lastRevenues()
      .then(data => {
        const lastRevenues = {
          last: 0,
          actual: 0
        }
        data.forEach(x => {
          if (x.month == moment().month() + 1) lastRevenues.actual = Number(x.total)
          else if (x.month == moment().month()) {
            setLastMonth(moment({ month: x.month - 1 }).format('MMMM Y'))
            lastRevenues.last = Number(x.total)
          }
        })

        setLastRevenues(lastRevenues)
      })

    ProjectsRest
      .paginate({
        sort: [{
          selector: 'ends_at',
          desc: false
        }],
        requireTotalCount: true,
        skip: 0,
        take: 100
      })
      .then(({ data = [], totalCount }) => {
        let conteoEstados = {};
        data.forEach(({ status: { name, color } }) => {
          let key = name;
          if (conteoEstados[key]) conteoEstados[key].cantidad++;
          else conteoEstados[key] = { estado: name, color: color, cantidad: 1 };
        });
        let results = Object.values(conteoEstados);
        new Chart(pieRef.current, {
          type: 'doughnut',
          data: {
            labels: Object.keys(conteoEstados),
            datasets: [{
              data: results.map(x => x.cantidad) || [],
              backgroundColor: results.map(x => x.color) || [],
              hoverOffset: 4
            }],
            backgroundColor: 'transparent'
          },
          options: {
            plugins: {
              legend: {
                display: false
              }
            }
          }
        })

        setTotalProjects(totalCount)
        setProjects(data)
      })

    ProjectsRest.paginate({
      requireTotalCount: true,
      ignoreData: true,
      filter: [
        ['projects.status', '=', '1'], 'and',
        ['projects.starts_at', '>=', moment().format('YYYY-MM-[01]')], 'and',
        ['projects.starts_at', '<', moment().add(1, 'month').format('YYYY-MM-[01]')]
      ]
    })
      .then(({ totalCount }) => {
        setTotalProjectsThisMonth(totalCount)
      })

    ProjectsRest.paginate({
      sort: [{
        selector: "!remaining_amount",
        desc: true
      }],
      isLoadingAll: true,
      filter: [["!remaining_amount", ">", 0], 'and', ['projects.status', '=', true]]
    })
      .then(({ data }) => {
        setProjectsRemaining(data || [])
        setTotalCost(data.reduce((acc, { cost }) => acc + Number(cost), 0))
        setTotalRemaining(data.reduce((acc, { remaining_amount }) => acc + Number(remaining_amount), 0))
      })

    RemainingsHistoryRest.get(moment().format('MM-YYYY'))
      .then(data => {
        setLastRemaining(data.remaining_amount)
      })
  }, [null])

  useEffect(() => {
    const percent = Math.round(totalRemaining / totalCost * 100) || 0
    remainingInput.current.value = percent
    if (percent) {
      $(remainingInput.current).knob()
    }
  }, [totalRemaining, totalCost])

  const onRevenueRangeChange = (e) => {
    const range = e.target.getAttribute('data-value')
    const title = e.target.textContent
    setRevenuesRange(range)
    setRevenuesTitle(title)
  }

  const totalDays = moment().daysInMonth()
  const daysPassed = moment().format('DD')
  const suposeToBe = lastRevenues.actual * totalDays / daysPassed
  const trending = (suposeToBe / lastRevenues.last) - 1

  const getProjectGroups = () => {
    const now = moment();
    const groups = {
      delayed: [],
      thisMonth: [],
      future: {}
    };

    projects.forEach(project => {
      const endDate = moment(project.ends_at);

      if (endDate.isBefore(now, 'day')) {
        groups.delayed.push(project);
      } else if (endDate.isSame(now, 'month') && endDate.isSame(now, 'year')) {
        groups.thisMonth.push(project);
      } else {
        const monthKey = endDate.format('MMMM YYYY');
        if (!groups.future[monthKey]) {
          groups.future[monthKey] = [];
        }
        groups.future[monthKey].push(project);
      }
    });

    return groups;
  };

  const getFilteredProjects = () => {
    const now = moment();
    let filtered = projects;

    // Apply debt filter first
    if (showDebtOnly) {
      filtered = filtered.filter(p => Number(p.remaining_amount) > 0);
    }

    // Then apply date filters
    switch (filterType) {
      case 'delayed':
        return filtered.filter(p => moment(p.ends_at).isBefore(now, 'day'));
      case 'thisMonth':
        return filtered.filter(p => {
          const endDate = moment(p.ends_at);
          return endDate.isSame(now, 'month') && endDate.isSame(now, 'year') /*&& !endDate.isBefore(now, 'day')*/;
        });
      default:
        if (filterType.startsWith('month_')) {
          const monthYear = filterType.replace('month_', '');
          return filtered.filter(p => moment(p.ends_at).format('MMMM YYYY') === monthYear);
        }
        return filtered;
    }
  };

  return (
    <>
      <div className='row'>

        <div className='col-xl-3 col-md-6'>
          <div className='card'>
            <div className='card-body'>
              <h4 className='header-title mt-0 mb-4'>Ingresos - Mes anterior</h4>
              <div className='widget-chart-1'>
                <div className='widget-detail-1 text-end'>
                  <h2 className='fw-normal pt-1 mb-1'> S/. {Number2Currency(lastRevenues?.last)} </h2>
                  <p className='text-muted mb-1'>{lastMonth}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-3 col-md-6'>
          <div className='card'>
            <div className='card-body'>
              <h4 className='header-title mt-0 mb-3'>Ingresos - Mes actual</h4>
              <div className='widget-box-2'>
                <div className='widget-detail-2 text-end'>
                  <Tippy content={`Es probable que tengamos ${(Math.abs(trending) * 100).toFixed(2)}% ${trending >= 0 ? 'mas' : 'menos'} de ingresos respecto al mes anterior`}>
                    <span className={`badge bg-${trending > 0 ? 'success' : 'danger'} rounded-pill float-start mt-3`}>{Math.round(trending * 100) || 0}% <i className={`mdi mdi-trending-${trending > 0 ? 'up' : 'down'}`}></i> </span>
                  </Tippy>
                  <h3 className='fw-normal mt-1 mb-1'> S/. {Number2Currency(lastRevenues?.actual)} </h3>
                  <p className='text-muted mb-3'>{moment().format('MMMM Y')}</p>
                </div>
                <Tippy content={<p className='text-center mb-0'>
                  Para este mes de {moment().format('MMMM Y')} se espera que tengamos S/. {Number2Currency(suposeToBe)}
                </p>} allowHTML={true} arrow={true}>
                  <div className={`progress progress-bar-alt-${trending > 0 ? 'success' : 'danger'} progress-sm`}>
                    <div className={`progress-bar bg-${trending > 0 ? 'success' : 'danger'}`} role='progressbar' aria-valuenow={trending * 100} aria-valuemin='0' aria-valuemax='100' style={{ width: `${Math.abs(trending * 100)}%` }}>
                      <span className='visually-hidden'>{Math.round(trending * 100) || 0}%</span>
                    </div>
                  </div>
                </Tippy>
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-3 col-md-6'>
          <div className='card'>
            <div className='card-body'>
              <div className='dropdown float-end'>
                <Tippy content='Ver proyectos' arrow={true}>
                  <a href='/projects' className='arrow-none card-drop'>
                    <i className='mdi mdi-arrow-top-right'></i>
                  </a>
                </Tippy>
              </div>

              <h4 className='header-title mt-0 mb-4'>Proyectos en curso</h4>

              <div className='widget-chart-1'>
                <div className='widget-chart-box-1 float-start' dir='ltr'>
                  <div style={{ display: 'inline', width: '70px', height: '70px' }}>
                    <canvas ref={pieRef} width='62' height='62' style={{ width: '70px', height: '70px' }}>
                    </canvas>
                  </div>
                </div>
                <div className='widget-detail-1 text-end'>
                  <h2 className='fw-normal pt-0 mb-1'> {totalProjects} </h2>
                  <p className='text-muted mb-1'>{totalProjectsThisMonth} nuevos este mes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-3 col-md-6'>
          <div className='card'>
            <div className='card-body'>
              <div className='dropdown float-end'>
                <Tippy content='Ver proyectos' arrow={true}>
                  <a href='/projects' className='arrow-none card-drop'>
                    <i className='mdi mdi-arrow-top-right'></i>
                  </a>
                </Tippy>
              </div>

              <h4 className='header-title mt-0 mb-3'>Deuda al {moment().startOf('month').format('D [de] MMMM')}</h4>

              <div className='widget-box-2'>
                <Tippy content={<>
                  Deuda restante al {Number(totalRemaining / totalCost * 100).toFixed(2)}%
                  <p className='mb-0'><b>Deuda restante</b>: S/. {Number2Currency(totalRemaining)}</p>
                  <p className='mb-0'><b>Costo total</b>: S/. {Number2Currency(totalCost)}</p>
                </>} arrow={true} allowHTML={true}>
                  <div className="float-start" dir="ltr">
                    <input ref={remainingInput} data-plugin="knob" data-width="70" data-height="70"
                      data-fgcolor="#f05050" data-bgcolor="#f0505033" defaultValue={String(Math.round(totalRemaining / totalCost * 100) || 0)}
                      data-skin="tron" data-angleloffset="180" data-readonly={true}
                      data-thickness=".15" style={{ outline: 'none', border: 'none' }} />
                  </div>
                </Tippy>
                <div className='widget-detail-2 text-end'>

                  {/* <span className='badge bg-pink rounded-pill float-start mt-3'>32% <i className='mdi mdi-trending-up'></i> */}
                  <h3 className='fw-normal pt-1 mb-1'> S/. {Number2Currency(lastRemaining)} </h3>
                  <p className='text-muted mb-3'> S/. {Number2Currency(totalRemaining)} hasta hoy</p>
                </div>
                {/* <div className='progress progress-bar-alt-pink progress-sm'>
                  <div className='progress-bar bg-pink' role='progressbar' aria-valuenow='77' aria-valuemin='0' aria-valuemax='100' style={{ width: '77%' }}>
                    <span className='visually-hidden'>77% Complete</span>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

        </div>

      </div >

      <div className='row'>
        <div className='col-xl-5 col-md-6 col-sm-12'>
          <div className='card'>
            <div className='card-header'>
              <DropdownEnd>
                <DropdownItem onClick={onRevenueRangeChange} data-value='daily'>Reporte diario</DropdownItem>
                <DropdownItem onClick={onRevenueRangeChange} data-value='weekly'>Reporte semanal</DropdownItem>
                <DropdownItem onClick={onRevenueRangeChange} data-value='monthly'>Reporte mensual</DropdownItem>
                <DropdownItem onClick={onRevenueRangeChange} data-value='annually'>Reporte anual</DropdownItem>
              </DropdownEnd>
              <h4 className='header-title mb-0'>Ingresos - {revenuesTitle}</h4>
            </div>
            <div className='card-body' style={{ height: '300px', width: '100%' }}>
              <canvas ref={revenueRef} width='100%'></canvas>
            </div>
          </div>
        </div>
        <div className='col-xl-7 col-md-6 col-sm-12'>
          <div className='card'>
            <div className='card-header'>
              <h4 className='header-title mb-0'>
                <span className="float-end text-danger"><small className='fa fa-arrow-circle-down'></small> S/. {Number2Currency(totalRemaining)}</span>
                Pendientes de pago
              </h4>
            </div>
            <div className='card-body' style={{ height: '300px', overflow: 'auto' }}>
              <div className='table-responsive'>
                <table className='table table-bordered table-sm table-striped mb-0'>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha fin</th>
                      <th>Costo total</th>
                      <th>Debe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      projectsRemaining.map(({ id, client, type, remaining_amount, cost, ends_at }) => {
                        return (<tr key={`remaining-project-${id}`}>
                          <td>
                            <b className='d-block'>{client.tradename}</b>
                            <small>{type.name}</small>
                          </td>
                          <td>{moment(ends_at).format('DD/MM/YYYY')}</td>
                          <td><div style={{ width: 'max-content' }}>S/. {Number2Currency(cost)}</div></td>
                          <td><div className='text-danger' style={{ width: 'max-content' }}><small className='fa fa-arrow-circle-down'></small> S/. {Number2Currency(remaining_amount)}</div></td>
                        </tr>)
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='row'>
        <div className='col-12'>
          <div className='card'>
            <div className="card-header">
              <div className='dropdown float-end'>
                <Tippy content='Ver proyectos' arrow={true}>
                  <a href='/projects' className='arrow-none card-drop'>
                    <i className='mdi mdi-arrow-top-right'></i>
                  </a>
                </Tippy>
              </div>
              <h4 className='header-title mt-0 mb-0'>Proyectos pendientes</h4>
              <div className='mt-2 d-flex gap-1 flex-wrap'>
                {getProjectGroups().delayed.length > 0 && (
                  <button
                    className={`btn btn-xs ${filterType === 'delayed' ? 'btn-danger' : 'btn-soft-danger'}`}
                    onClick={() => setFilterType('delayed')}
                  >
                    Atrasados ({getProjectGroups().delayed.length})
                  </button>
                )}
                {getProjectGroups().thisMonth.length > 0 && (
                  <button
                    className={`btn btn-xs ${filterType === 'thisMonth' ? 'btn-primary' : 'btn-soft-primary'}`}
                    onClick={() => setFilterType('thisMonth')}
                  >
                    Este mes ({getProjectGroups().thisMonth.length})
                  </button>
                )}
                {Object.entries(getProjectGroups().future).map(([month, monthProjects]) => (
                  <button
                    key={month}
                    className={`btn btn-xs ${filterType === `month_${month}` ? 'btn-success' : 'btn-soft-success'}`}
                    onClick={() => setFilterType(`month_${month}`)}
                  >
                    {month} ({monthProjects.length})
                  </button>
                ))}
                {filterType !== 'all' && (
                  <button
                    className='btn btn-xs btn-soft-secondary'
                    onClick={() => setFilterType('all')}
                  >
                    Mostrar todos
                  </button>
                )}
              </div>
            </div>
            <div className='card-body' style={{ height: '360px', overflow: 'auto' }}>
              <div className="form-check form-switch mb-2 align-content-center">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showDebtOnly"
                  onChange={(e) => setShowDebtOnly(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label" htmlFor="showDebtOnly" style={{ cursor: 'pointer' }}>
                  Solo mostrar proyectos con deuda
                </label>
              </div>
              <div className='table-responsive'>
                <table className='table table-sm table-bordered table-striped mb-0'>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha de desarrollo</th>
                      <th>Estado</th>
                      <th>Costo total</th>
                      <th>Debe</th>
                      <th>Asignado a</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProjects().map((project, i) => {
                      const relatives = project.users.map(user => user.relative_id);
                      // const relatives = [/*(project.users || '').split('|').filter(Boolean)*/]
                      return <tr key={`project-${i}`} style={{
                        backgroundColor: project.is_alert ? 'rgba(255,91,91,.18)' : 'unset',
                      }}>
                        <td className={`${moment(project.ends_at).isBefore(moment()) ? 'text-danger' : ''}`} style={{
                          boxShadow: project.is_alert ? 'unset' : ''
                        }}>
                          <b className='d-block'>{project.client.tradename}</b>
                          <small>{project.name}</small>
                        </td>
                        <td style={{
                          boxShadow: project.is_alert ? 'unset' : ''
                        }}>{DateRange(project.starts_at, project.ends_at)}</td>
                        <td style={{
                          boxShadow: project.is_alert ? 'unset' : ''
                        }}><span className='badge' style={{ backgroundColor: project.status.color }}>{project.status.name}</span></td>
                        <td style={{
                          boxShadow: project.is_alert ? 'unset' : ''
                        }}>S/. {Number2Currency(project.cost)}</td>
                        <td style={{
                          boxShadow: project.is_alert ? 'unset' : ''
                        }}>S/. {Number2Currency(project.remaining_amount)}</td>
                        <td style={{
                          boxShadow: project.is_alert ? 'unset' : ''
                        }}>{Assigneds(relatives)}</td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

CreateReactScript((el, properties) => {
  if (!properties.can('dashboard', 'root', 'all', 'list')) return location.href = '/leads';
  createRoot(el).render(
    <Adminto {...properties} title={`Dashboard - ${moment().format('MMMM YYYY')}`}>
      <KPIProjects {...properties} />
    </Adminto>
  );
})