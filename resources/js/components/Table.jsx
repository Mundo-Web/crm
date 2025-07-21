import React, { useState, useCallback, useRef } from 'react'
import DataGrid from './DataGrid'
import { renderToString } from 'react-dom/server'
import { debounce } from 'lodash'
import { DateRange } from 'react-date-range'
import es from 'date-fns/locale/es'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

const Table = ({ title, gridRef, rest, columns, toolBar, masterDetail, filterValue = [], defaultRows, selection, className = '', allowedPageSizes, pageSize, exportable = false, customizeCell, reloadWith, height, cardStyle, keyExpr, onSelectionChanged, massiveActions }) => {
  const html = renderToString(<div>{title}</div>)
  const text = $(html).text().trim().replace('-', '')
  const [range, setRange] = useState([{ startDate: new Date(), endDate: new Date(), key: 'selection', }])
  const [filtering, setFiltering] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [selectionActive, setSelectionActive] = useState(false)
  const datePickerRef = useRef(null)

  const massiveDropdownId = `dropdown-${crypto.randomUUID()}`
  const [isMassiveDropdownOpen, setIsMassiveDropdownOpen] = useState(false)

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

    const dataGrid = $(gridRef.current).dxDataGrid('instance')
    dataGrid.filter([
      ['created_at', '>=', adjustedStartDate],
      'and',
      ['created_at', '<=', adjustedEndDate]
    ])
    setFiltering(true)
    setIsDatePickerOpen(false)
  }

  // Handle reset date filter
  const handleResetDateFilter = () => {
    const dataGrid = $(gridRef.current).dxDataGrid('instance')
    dataGrid.clearFilter()
    setRange([{
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    }])
    setFiltering(false)
    setIsDatePickerOpen(false)
  }

  // Handle export
  const handleExport = () => {
    const dataGrid = $(gridRef.current).dxDataGrid('instance')
    dataGrid.exportToExcel && dataGrid.exportToExcel(false)
    dataGrid._options.onExporting && dataGrid._options.onExporting({
      component: dataGrid.current
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
        <div className="card" style={cardStyle}>
          <div className="card-body">
            {
              <div className='d-flex justify-content-between align-items-start mb-2'>
                {
                  typeof title == 'string'
                    ? <h4 className='w-100 my-0 header-title'>Lista de {title}</h4>
                    : <div className='w-100 my-0'>{title}</div>
                }

                <button className='btn btn-white btn-xs text-nowrap' onClick={() => $(gridRef.current).dxDataGrid('instance').refresh()}>
                  <i className='mdi mdi-refresh me-1'></i>Actualizar
                </button>
              </div>
            }

            <div className='d-flex mb-2 gap-2'>
              <input
                type="text"
                className='form-control form-control-sm'
                placeholder='Buscar...'
                onChange={(e) => handleSearch(e.target.value)}
              />

              <div className="d-flex gap-2">
                {
                  selectionActive &&
                  <div className="dropdown position-relative">
                    <button
                      className="btn btn-white btn-sm dropdown-toggle position-relative bg-white"
                      type="button"
                      onClick={() => setIsMassiveDropdownOpen(!isMassiveDropdownOpen)}
                      style={{ zIndex: isMassiveDropdownOpen ? 10000 : undefined }}
                    >
                      <i className='mdi mdi-format-list-checks' /> Acciones <i className="mdi mdi-chevron-down"></i>
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
                    <i className="mdi mdi-calendar-range me-1"></i>
                    Periodo
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
                  <i className='mdi mdi-download me-1'></i>Exportar
                </button>
              </div>
            </div>

            <DataGrid
              gridRef={gridRef}
              rest={rest}
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
              reloadWith={reloadWith}
              height={height}
              keyExpr={keyExpr}
              onSelectionChanged={(props) => {
                setSelectionActive(props.selectedRowKeys.length > 0)
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