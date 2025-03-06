import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'
import Tippy from '@tippyjs/react';
import ProjectsRest from './actions/ProjectsRest';
import DateRange from './Reutilizables/Projects/DateRange';
import Assigneds from './Reutilizables/Projects/Assigneds';

const Taskboard = ({ }) => {
  const [projects, setProjects] = useState([]);
  const [showDebtOnly, setShowDebtOnly] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
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
      .then(({ data = [] }) => {
        setProjects(data)
      })
  }, [null])

  const getProjectGroups = () => {
    const now = moment();
    const groups = {
      delayed: [],
      // thisMonthDelayed: [], // Nuevo grupo
      thisMonth: [],
      future: {}
    };

    projects.forEach(project => {
      const endDate = moment(project.ends_at);

      if (endDate.isSame(now, 'month') && endDate.isSame(now, 'year')) {
        groups.thisMonth.push(project);
      } else if (endDate.isBefore(now, 'day')) {
        groups.delayed.push(project);
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

  const getFilteredProjects = (filterInput) => {
    const filterApply = filterInput ?? filterType;

    const now = moment();
    let filtered = projects;

    // Apply debt filter first
    if (showDebtOnly) {
      filtered = filtered.filter(p => Number(p.remaining_amount) > 0);
    }

    // Then apply date filters
    switch (filterApply) {
      case 'delayed':
        return filtered.filter(p => moment(p.ends_at).isBefore(now, 'day'));
      case 'thisMonth':
        return filtered.filter(p => {
          const endDate = moment(p.ends_at);
          return endDate.isSame(now, 'month') && endDate.isSame(now, 'year') /*&& !endDate.isBefore(now, 'day')*/;
        });
      default:
        if (filterApply.startsWith('month_')) {
          const monthYear = filterApply.replace('month_', '');
          return filtered.filter(p => moment(p.ends_at).format('MMMM YYYY') === monthYear);
        }
        return filtered;
    }
  };

  return (<>
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
                  Atrasados ({getFilteredProjects('delayed').length})
                </button>
              )}
              {getProjectGroups().thisMonth.length > 0 && (
                <button
                  className={`btn btn-xs ${filterType === 'thisMonth' ? 'btn-primary' : 'btn-soft-primary'}`}
                  onClick={() => setFilterType('thisMonth')}
                >
                  Este mes ({getFilteredProjects('thisMonth').length})
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
          <div className='card-body' style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
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
                      <td className={`${moment(project.ends_at).isBefore(moment()) ? 'text-danger' : ''}`} style={{ boxShadow: project.is_alert ? 'unset' : '' }}>
                        <b className='d-block'>{project.client.tradename}</b>
                        <small>{project.name}</small>
                      </td>
                      <td style={{ boxShadow: project.is_alert ? 'unset' : '' }}>{DateRange(project.starts_at, project.ends_at)}</td>
                      <td style={{ boxShadow: project.is_alert ? 'unset' : '' }}><span className='badge' style={{ backgroundColor: project.status.color }}>{project.status.name}</span></td>
                      <td style={{ boxShadow: project.is_alert ? 'unset' : '' }}>{project.remaining_amount > 0 ? <b className='text-danger'>Debe</b> : 'No debe'}</td>
                      <td style={{ boxShadow: project.is_alert ? 'unset' : '' }}>{Assigneds(relatives)}</td>
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
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Cuadro de control'>
      <Taskboard {...properties} />
    </Adminto>
  );
})