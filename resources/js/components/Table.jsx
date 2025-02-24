import React from 'react'
import DataGrid from './DataGrid'

const Table = ({ title, gridRef, rest, columns, toolBar, masterDetail, filterValue = [], defaultRows, selection, className = '', allowedPageSizes, pageSize, exportable = false, customizeCell, reloadWith, height }) => {
  return (<div className={`row ${className}`}>
    <div className="col-12">
      <div className="card">
        {
          typeof title == 'object' && <div className='card-header'>
            {title}
          </div>
        }
        <div className="card-body">
          {
            typeof title == 'string' &&
            <h4 className="header-title">
              <div id="header-title-options" className="float-end"></div>
              <span id="header-title-prefix"></span> Lista de {title} <span id="header-title-suffix"></span>
            </h4>
          }
          <DataGrid gridRef={gridRef} rest={rest} columns={columns.filter(Boolean)} toolBar={toolBar} masterDetail={masterDetail} filterValue={filterValue} defaultRows={defaultRows} selection={selection} allowedPageSizes={allowedPageSizes} pageSize={pageSize} exportable={exportable} exportableName={title} customizeCell={customizeCell} reloadWith={reloadWith} height={height} />
        </div>
      </div>
    </div>
  </div>
  )
}

export default Table