const ConnectSSE = () => {
  const token = Cookies.get('X-Auth-Token')
  const browser = getBrowser()
  const params = {
    'title': document.title,
    'link': document.location.href,
    'usuario': Cookies.get('usuario'),
    'browser.brand': browser.brand,
    'browser.version': browser.version,
    'start': Session.get('startPage')
  }
  const queryParams = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  let eventSource = new EventSource(`${iputils}/utilitarios/sse/listen/${token}?${queryParams}`)

  eventSource.onmessage = async event => {
    if (event.data === 'ping') {
      console.log('Realtime active')
    } else {
      const data = JSON.parse(event.data)
      if (data.event === 'session' && ['expires', 'deleted'].includes(data.data.type)) {
        eventSource.close()
        Cookies.destroy()
        location.href = `../../?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`
      } else if (data.event === 'session' && data.data.type === 'extended') {
        if (data.data.data <= 0) {
          eventSource.close()
          Cookies.destroy()
          location.href = `../../?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`
          return;
        }
        let constantes = Local.get('constantesLocal').constantes
        let [time, type] = constantes.SESSION_NOTIFIER_TIMER.split('|').map(x => x.trim())

        let sessionttl = moment().add(data.data.data, 'seconds')

        Local.set('sessionttl', sessionttl.format('YYYY-MM-DD HH:mm:ss'))
        let notify = sessionttl.subtract(parseInt(time), type).diff(moment(), 'seconds')

        // Formateando el timeout y ocultando el botón
        clearTimeout(SessionTimeout)
        CountDown.close()

        // Seteando el timeout y mostrando el counter
        SessionTimeout = setTimeout(() => {
          CountDown.start()
        }, notify * 1000);

      } else if (data.event === 'batch') {
        let count = parseInt($('#success-modeloscia').text()) || 0
        const vehiculo = data.data.vehiculo

        count = count + vehiculo.length
        // const { descModeloCia } = vehiculo
        $('#success-modeloscia').text(count)
        // vehiculo.forEach(v => {
        //     const codModelociaUp = v.CodModeloCia
        //     actualizarCeldaEstado(codModelociaUp)
        // })


      } else if (data.event === 'batchFinally') {
        const btn = $('#btnExecuteBatch').dxButton('instance')
        btn.option('disabled', false)
        btn.option('icon', 'arrowright')
        $('.dx-button-content').removeClass('rotating')
        // const { versionesError } = data.data.data
        // $listaErrores.empty()
        // const vehiculo = versionesError.map(e => `${e.marca.marca} ${e.modelo.modelo} ${e.version} - ${e.error}`)

        // if (vehiculo.length > 0) {
        //     $('#erroresModeloscia').attr('data-errores', JSON.stringify(data.data.data.versionesError))
        //     vehiculo.forEach(error => {
        //         const text = error.split('-')
        //         const $li = $('<li>').html(`${text[0]} <br>`).css('margin-bottom', '14px')
        //         const $code = $('<code>').text(text[1])
        //         // const $li = $('<li>').html(`VEHICULO: <code>${text[0]}</code> <br> ERROR: <code>${text[1]}</code>`).css('margin-bottom', '14px')
        //         $li.append($code)
        //         $listaErrores.append($li)
        //     });

        //     $('#erroresModeloscia').show()
        // }

        $.notify(`El batch se ha ejecutado satisfactoriamente`, { autoHide: false, style: 'bootstrap', className: 'success' });
        // $('#btnExecuteBatch').button('reset')
        $('#searchPacifico').trigger('click')
        const dataFiles = await getBatchFiles()
        const dropDownButton = $('#miDropDownButton').dxDropDownButton('instance');
        dropDownButton.option('items', dataFiles)

      } else if (data.event === 'batchClientes' && location.pathname == '/page/clientes/') {
        const batchs = await getClientesbatch()
        $('#batchButton').dxDropDownButton('instance').option('items', batchs)
      } else if (data.event === 'polizaBatch' && location.pathname === '/page/cotizaciones/') {
        const rows = JSON.parse(data.data)
        const table = $('#dataGridContainer').dxDataGrid('instance')
        const dataTable = table.option('dataSource')
        if (!dataTable) return
        const newData = dataTable.map((e) => {
          const exist = rows.find((r) => r.excel.id === e.excel.id)
          if (!exist) return e
          return exist
        })

        table.option('dataSource', newData)

      } else if (data.event === 'polizaBatchFinally' && location.pathname === '/page/cotizaciones/') {
        const modal = $('#modal-polizas-upload')
        const dataRes = await Storage.getContent(`polizasBatch/json/${data.data}`)
        modal.prop('doc-data', JSON.stringify(dataRes))
        modal.find('#btn-descargar-excel').attr('href', `${ipbucket}/polizasBatch/excel/${data.data}`)
        modal.find('.historial').show()
        modal.find('.importar').hide()

        const dataFiles = await getPolizasBatch()
        const dropDownButton = $('#batchPolizasButton').dxDropDownButton('instance');
        dropDownButton.option('items', dataFiles)
      }
    }
  }

  eventSource.onerror = event => {
    console.log('Realtime closed')
    eventSource.close()
    setTimeout(() => {
      ConnectSSE()
    }, 2500)
  }
}

export default ConnectSSE