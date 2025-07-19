import React, { useEffect } from 'react'

const DataGrid = ({ gridRef: dataGridRef, rest, columns, toolBar, masterDetail, filterValue, defaultRows, selection, allowedPageSizes = [5, 10, 25, 50, 100], pageSize = 100, exportable, exportableName, customizeCell = () => { }, reloadWith = [null], height = 'calc(100vh - 185px)' }) => {
  useEffect(() => {
    DevExpress.localization.locale(navigator.language);
    if ($(dataGridRef.current).data('dxDataGrid')) {
      $(dataGridRef.current)?.dxDataGrid('instance')?.dispose()
    }
    $(dataGridRef.current).dxDataGrid({
      language: "es",
      dataSource: {
        load: async (params) => {
          const data = (await rest.paginate(params)) ?? {};
          let newData = data?.data || [];

          if (defaultRows) {
            const defaultKeys = defaultRows.map(row => Object.keys(row));
            const combinedData = newData.concat(defaultRows.filter(row => {
              return !newData.some(dataRow => defaultKeys.some(keys => keys.every(key => dataRow[key] == row[key])));
            }));
            data.data = combinedData;
          }

          return data;
        }
      },
      onToolbarPreparing: (e) => {
        const { items } = e.toolbarOptions;
        toolBar(items)

        // items.unshift({
        //   widget: 'dxButton',
        //   location: 'after',
        //   options: {
        //     icon: 'revert',
        //     hint: 'RESTABLECER TABLA',
        //     onClick: () => {
        //       const path = location.pathname
        //       const dxSettings = Local.get('dxSettings') || {}
        //       delete dxSettings[path]
        //       Local.set('dxSettings', dxSettings)
        //       $(dataGridRef.current).dxDataGrid('instance').state({})
        //     }
        //   }
        // });
      },
      remoteOperations: true,
      columnResizingMode: "widget",
      allowColumnResizing: true,
      allowColumnReordering: true,
      columnAutoWidth: true,
      scrollbars: 'auto',
      // filterPanel: { visible: true },
      filterPanel: { visible: false },
      // searchPanel: { visible: true },
      searchPanel: { visible: false },
      headerFilter: { visible: true, search: { enabled: true } },
      height,
      filterValue,
      selection: selection || null,
      export: {
        // enabled: exportable
        enabled: false
      },
      onExporting: function (e) {
        var workbook = new ExcelJS.Workbook();
        var worksheet = workbook.addWorksheet('Main sheet');
        DevExpress.excelExporter.exportDataGrid({
          worksheet: worksheet,
          component: e.component,
          customizeCell: function (options) {
            customizeCell(options)
            options.excelCell.alignment = {
              horizontal: 'left',
              vertical: 'top',
              ...options.excelCell.alignment
            };
          }
        }).then(function () {
          workbook.xlsx.writeBuffer().then(function (buffer) {
            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${exportableName}.xlsx`);
          });
        });
      },
      rowAlternationEnabled: true,
      showBorders: true,
      filterRow: {
        visible: true,
        applyFilter: "auto"
      },
      filterBuilderPopup: {
        visible: false,
        position: {
          of: window, at: 'top', my: 'top', offset: { y: 10 },
        },
      },
      paging: {
        pageSize,
      },
      pager: {
        visible: true,
        allowedPageSizes,
        showPageSizeSelector: true,
        showInfo: true,
        showNavigationButtons: true,
      },
      allowFiltering: true,
      scrolling: {
        mode: 'standard',
        useNative: true,
        preloadEnabled: true,
        rowRenderingMode: 'standard'
      },
      columnChooser: {
        title: 'Mostrar/Ocultar columnas',
        // enabled: true,
        enabled: false,
        mode: 'select',
        search: { enabled: true }
      },
      columns,
      masterDetail,
      onContentReady: (...props) => {
        tippy('.tippy-here', { arrow: true, animation: 'scale' })
      },
      // onColumnsChanging: () => {
      //   const dataGrid = $(dataGridRef.current).dxDataGrid('instance')
      //   const state = dataGrid.state()

      //   if (Object.keys(state) == 0) return

      //   const path = location.pathname
      //   const dxSettings = Local.get('dxSettings') || {}
      //   if (JSON.stringify(dxSettings[path]) == JSON.stringify(state)) return

      //   dxSettings[path] = {}
      //   dxSettings[path].columns = state.columns
      //   dxSettings[path].masterDetail = state.masterDetail

      //   Local.set('dxSettings', dxSettings)
      // }
      onOptionChanged: (e) => {
        if (e.fullName === 'filterValue') {
          const path = location.pathname;
          const dxSettings = Local.get('dxSettings') || {};
          dxSettings[path] = {
            filterValue: e.value
          };
          Local.set('dxSettings', dxSettings);
        }
      },
    }).dxDataGrid('instance')

    tippy('.dx-button', { arrow: true })

    // const dxSettings = Local.get('dxSettings') || {}
    // if (dxSettings[location.pathname]) {
    //   $(dataGridRef.current).dxDataGrid('instance').state(dxSettings[location.pathname])
    // }
    const dxSettings = Local.get('dxSettings') || {};
    if (dxSettings[location.pathname]?.filterValue) {
      $(dataGridRef.current).dxDataGrid('instance').option('filterValue', dxSettings[location.pathname].filterValue);
    }
  }, reloadWith)

  return (
    <div ref={dataGridRef}></div>
  )
}

export default DataGrid