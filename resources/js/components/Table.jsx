import React, { useState, useCallback, useRef, useEffect } from 'react'
import DataGrid from './DataGrid'
import { renderToString } from 'react-dom/server'
import { debounce } from 'lodash'
import { DateRange } from 'react-date-range'
import es from 'date-fns/locale/es'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import Tippy from '@tippyjs/react'
import ArrayJoin from '../Utils/ArrayJoin'

const Table = ({ title, filter = [], gridRef, rest, columns, toolBar, masterDetail, filterValue = [], defaultRows, selection, cardClass = '', className = '', allowedPageSizes, pageSize, exportable = false, customizeCell, reloadWith, height, cardStyle, keyExpr, onSelectionChanged, massiveActions }) => {
  const html = renderToString(<div>{title}</div>)
  const text = $(html).text().trim().replace('-', '')
  const [range, setRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection', }])
  const [dateFilter, setDateFilter] = useState([]);
  const [dateFilterType, setDateFilterType] = useState('updated_at')
  const [filtering, setFiltering] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectionCount, setSelectionCount] = useState(0)
  const datePickerRef = useRef(null)

  const massiveDropdownId = `dropdown-${crypto.randomUUID()}`
  const [isMassiveDropdownOpen, setIsMassiveDropdownOpen] = useState(false)

  // Detect if rest is an array of switchable configs
  const isRestSwitch = Array.isArray(rest) && rest.length && rest[0].rest !== undefined
  const [activeRestIndex, setActiveRestIndex] = useState(0)

  // Handle search with debounce
  const handleSearch = useCallback(
    debounce((searchText) => {
      const dataGrid = $(gridRef.current).dxDataGrid('instance')
      dataGrid.searchByText(searchText)
    }, 500),
    [gridRef]
  )

  // Handle date range filter
  const handleDateFilter = () => {
    const { startDate, endDate } = range[0]
    if (!startDate || !endDate) return

    const adjustedStartDate = new Date(startDate)
    adjustedStartDate.setHours(-5, 0, 0, 0)
    // Set end date to 23:59:59 of the selected day
    const adjustedEndDate = new Date(endDate)
    adjustedEndDate.setHours(18, 59, 59, 999)

    // const dataGrid = $(gridRef.current).dxDataGrid('instance')
    // const prevFilter = dataGrid.filter()
    setDateFilter(ArrayJoin([
      [dateFilterType, '>=', adjustedStartDate],
      [dateFilterType, '<=', adjustedEndDate]
    ], 'and'))
    setFiltering(true)
    setIsDatePickerOpen(false)
  }

  // Handle reset date filter
  const handleResetDateFilter = () => {
    // const dataGrid = $(gridRef.current).dxDataGrid('instance')
    // dataGrid.clearFilter('created_at')
    setRange([{
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }])
    setDateFilter([])
    setFiltering(false)
    setIsDatePickerOpen(false)
  }

  useEffect(() => {
    const dataGrid = $(gridRef.current).dxDataGrid('instance')
    const realFilter = [dateFilter, filter].filter(arr => arr.length > 0)
    dataGrid.filter(ArrayJoin(realFilter, 'and'))
  }, [filter, dateFilter])

  // Handle export
  const handleExport = () => {
    if (!exportable) return

    const dataGrid = $(gridRef.current).dxDataGrid('instance')

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')

    // Export with ExcelJS to handle outline properties
    DevExpress.excelExporter.exportDataGrid({
      component: dataGrid,
      worksheet: worksheet,
      autoFilterEnabled: true,
      topLeftCell: { row: 1, column: 1 },
      customizeCell: function (options) {
        const { gridCell, excelCell } = options;

        // Handle column headers
        if (gridCell.rowType === 'header') {
          excelCell.value = gridCell.column.caption || gridCell.column.dataField;
          // Optional: Add header styling
          excelCell.font = { bold: true };
          excelCell.alignment = { horizontal: 'center' };
        } else {
          excelCell.value = gridCell.value;
        }
      }
    }).then(function () {
      workbook.xlsx.writeBuffer().then(function (buffer) {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          `${text.toLowerCase()}.xlsx`
        )
      })
    })
  }

  // Click fuera del date picker
  const handleClickOutside = (event) => {
    if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
      setIsDatePickerOpen(false)
    }
  }

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`row ${className}`}>
      <div className="col-12">
        <div className={`card ${cardClass}`} style={cardStyle}>
          <div className="card-body">
            <div className='d-flex justify-content-between align-items-start mb-2 gap-1'>
              {
                typeof title == 'string'
                  ? <h4 className='my-0 header-title flex-1 text-break'>Lista de {title}</h4>
                  : <div className='my-0 flex-1 overflow-hidden'>{title}</div>
              }
              <div className='d-flex gap-1 flex-wrap'>
                <button className='btn btn-white btn-xs text-nowrap' onClick={() => $(gridRef.current).dxDataGrid('instance').refresh()}>
                  <i className='mdi mdi-refresh me-md-1'></i>
                  <span className='d-none d-md-inline-block'>Actualizar</span>
                </button>
              </div>
            </div>

            {/* Rest switcher buttons */}
            {isRestSwitch && (
              <div className='d-flex flex-wrap gap-1 mb-2'>
                {rest.map((item, index) => (
                  <button
                    key={index}
                    className={`btn ${index === activeRestIndex ? (item.classNameWhenActive || 'btn-success') : (item.className || 'btn-white')} btn-xs text-nowrap rounded-pill waves-effect`}
                    onClick={() => setActiveRestIndex(index)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Legacy rest buttons (non-switch) */}
            {!isRestSwitch && Array.isArray(rest) && (
              <div className='d-flex flex-wrap gap-1 mb-2'>
                {rest.map((item, index) => (
                  <button
                    key={index}
                    className={`btn ${item.className || 'btn-white'} btn-xs text-nowrap rounded-pill waves-effect`}
                    onClick={() => item()}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className='d-flex mb-2 gap-2'>
              <input
                type="text"
                className='form-control form-control-sm'
                placeholder='Buscar...'
                onChange={(e) => handleSearch(e.target.value)}
              />

              <div className="d-flex gap-2">
                {
                  selectionCount > 0 &&
                  <div className="dropdown position-relative">
                    <button
                      className="btn btn-white btn-sm dropdown-toggle position-relative bg-white"
                      type="button"
                      onClick={() => setIsMassiveDropdownOpen(!isMassiveDropdownOpen)}
                      style={{ zIndex: isMassiveDropdownOpen ? 10000 : undefined }}
                    >
                      <i className='mdi mdi-format-list-checks me-md-1' />
                      <span className='d-none d-md-inline-block'>Acciones</span>
                      <span className="badge bg-primary ms-1">{selectionCount}</span>
                      <i className="mdi mdi-chevron-down ms-1"></i>
                    </button>
                    {isMassiveDropdownOpen && (
                      <>
                        <div
                          className='position-fixed'
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 9999
                          }}
                          onClick={() => setIsMassiveDropdownOpen(false)}
                        ></div>
                        <ul
                          className="dropdown-menu dropdown-menu-end show"
                          style={{
                            position: 'absolute',
                            zIndex: 10000
                          }}
                          onClick={() => setIsMassiveDropdownOpen(false)}
                        >
                          {massiveActions}
                        </ul>
                      </>
                    )}
                  </div>
                }
                <div className="dropdown position-relative" ref={datePickerRef}>
                  <button
                    className="position-relative btn btn-sm btn-white dropdown-toggle bg-white"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    style={{ zIndex: isDatePickerOpen ? 10000 : undefined }}
                  >
                    <i className="mdi mdi-calendar-range me-md-1"></i>
                    <span className='d-none d-md-inline-block'>Periodo</span>
                    {filtering && <span className='ms-1 badge bg-primary'>
                      <i className='mdi mdi-filter'></i>
                    </span>}
                  </button>

                  {isDatePickerOpen && (
                    <>
                      <div
                        className='position-fixed'
                        style={{
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          zIndex: 9999
                        }}
                        onClick={() => setIsDatePickerOpen(false)}
                      ></div>

                      <div className="dropdown-menu p-2 show mt-1" style={{
                        minWidth: '650px',
                        position: 'absolute',
                        right: 0,
                        transform: 'translateX(0)',
                        zIndex: 10000
                      }}>
                        <DateRange
                          editableDateInputs={true}
                          onChange={item => setRange([item.selection])}
                          moveRangeOnFirstSelection={false}
                          ranges={range}
                          locale={es}
                          months={2}
                          direction="horizontal"
                          showDateDisplay={false}
                        />
                        <div className="d-flex justify-content-end gap-2 mt-2">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-white dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              {dateFilterType === 'created_at' ? 'Fecha creación' : 'Fecha actualización'}
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => setDateFilterType('created_at')}
                                >
                                  Fecha creación
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() => setDateFilterType('updated_at')}
                                >
                                  Fecha actualización
                                </button>
                              </li>
                            </ul>
                          </div>
                          <button className="btn btn-sm btn-danger" onClick={handleResetDateFilter}>
                            <i className="mdi mdi-filter-remove me-1"></i>Limpiar
                          </button>
                          <button className="btn btn-sm btn-primary" onClick={() => handleDateFilter()}>
                            <i className="mdi mdi-filter me-1"></i>Filtrar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  className='btn btn-sm btn-white text-nowrap'
                  onClick={handleExport}
                  disabled={!exportable}
                >
                  <i className='mdi mdi-download me-md-1'></i>
                  <span className='d-none d-md-inline-block'>Exportar</span>
                </button>
              </div>
            </div>

            <DataGrid
              gridRef={gridRef}
              rest={isRestSwitch ? rest[activeRestIndex].rest : rest}
              columns={columns.filter(Boolean)}
              toolBar={toolBar}
              masterDetail={masterDetail}
              filterValue={filterValue}
              defaultRows={defaultRows}
              selection={selection}
              allowedPageSizes={allowedPageSizes}
              pageSize={pageSize}
              exportable={exportable}
              exportableName={text.toLowerCase()}
              customizeCell={customizeCell}
              reloadWith={[...(reloadWith ?? []), activeRestIndex]}
              height={height}
              keyExpr={keyExpr}
              onSelectionChanged={(props) => {
                setSelectionCount(props.selectedRowKeys.length)
                onSelectionChanged?.(props)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Table