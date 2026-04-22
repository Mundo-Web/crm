import React, { useRef, useState, useEffect } from 'react'
import { Fetch } from 'sode-extend-react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import CampaignsRest from './actions/CampaignsRest.js'
import DxButton from './components/dx/DxButton.jsx'
import Swal from 'sweetalert2'
import sourceOptions from './Reutilizables/Campaigns/socials.json'

const campaignsRest = new CampaignsRest();

const AdsList = ({ adSetData }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      const url = `${location.origin}${location.pathname.replace('/campaigns', '/api/ads/paginate')}`;
      const { result } = await Fetch(url, {
        method: 'POST',
        body: JSON.stringify({ campaign_id: adSetData.campaign_id, ad_set_id: adSetData.id, take: 100 })
      })
      setAds(result?.data || []);
      setLoading(false);
    }
    fetchAds();
  }, [adSetData.id]);

  if (loading) return <div className='p-2'><i className='fas fa-spinner fa-spin me-1'></i>Cargando anuncios...</div>;

  return (
    <ul className='list-group list-group-flush ms-4 border-start'>
      {ads.length === 0 && <li className='list-group-item text-muted small'>No hay anuncios</li>}
      {ads.map(ad => (
        <li key={ad.id} className='list-group-item bg-transparent d-flex justify-content-between align-items-center py-1'>
          <span className='small'><i className='mdi mdi-bullhorn-outline me-1 text-primary'></i>{ad.name}</span>
          <span className={`badge ${ad.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '10px' }}>
            {ad.status || 'INACTIVE'}
          </span>
        </li>
      ))}
    </ul>
  )
}

const AdSetsList = ({ campaignData }) => {
  const [adSets, setAdSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdSets = async () => {
      const url = `${location.origin}${location.pathname.replace('/campaigns', '/api/ad-sets/paginate')}`;
      const { result } = await Fetch(url, {
        method: 'POST',
        body: JSON.stringify({ campaign_id: campaignData.id, take: 100 })
      })
      setAdSets(result?.data || []);
      setLoading(false);
    }
    fetchAdSets();
  }, [campaignData.id]);

  if (loading) return <div className='p-3'><i className='fas fa-spinner fa-spin me-1'></i>Cargando conjuntos de anuncios...</div>;

  return (
    <div className='p-3 bg-light border-top border-bottom'>
      <h6 className='mb-2 text-uppercase text-muted' style={{ fontSize: '11px', fontWeight: 'bold' }}>
        <i className='mdi mdi-layers-outline me-1'></i>Conjuntos de Anuncios
      </h6>
      <div className='accordion accordion-flush' id={`accordion-${campaignData.id}`}>
        {adSets.length === 0 && <div className='text-muted p-2 small'>No hay conjuntos de anuncios registrados</div>}
        {adSets.map(as => (
          <div key={as.id} className='border-bottom mb-1'>
            <div className='d-flex justify-content-between align-items-center p-2 bg-white rounded shadow-sm' 
                 style={{ cursor: 'pointer' }}
                 onClick={(e) => {
                   const detail = e.currentTarget.nextElementSibling;
                   detail.classList.toggle('d-none');
                 }}>
              <span className='fw-medium small'><i className='mdi mdi-folder-outline me-1 text-warning'></i>{as.name}</span>
              <div className='d-flex align-items-center gap-2'>
                <span className={`badge ${as.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '10px' }}>
                  {as.status || 'INACTIVE'}
                </span>
                <i className='mdi mdi-chevron-down text-muted'></i>
              </div>
            </div>
            <div className='d-none mt-1'>
              <AdsList adSetData={as} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Campaigns = ({ can }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const codeRef = useRef()
  const sourceRef = useRef()
  const titleRef = useRef()
  const linkRef = useRef()
  const notesRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    codeRef.current.value = data?.code || null
    $(sourceRef.current).val(data?.source || null).trigger('change')
    titleRef.current.value = data?.title || null
    linkRef.current.value = data?.link || null
    notesRef.current.value = data?.notes || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      code: codeRef.current.value,
      source: $(sourceRef.current).val(),
      title: titleRef.current.value,
      link: linkRef.current.value,
      notes: notesRef.current.value
    }

    const result = await campaignsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar campaña',
      text: '¿Está seguro de eliminar esta campaña?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })

    if (!isConfirmed) return
    const result = await campaignsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onSyncMetaClicked = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Sincronizar con Meta',
      text: 'Buscando jerarquías para las campañas registradas. Esto podría tomar unos segundos.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar',
      cancelButtonText: 'Cancelar'
    })

    if (!isConfirmed) return

    Swal.fire({
      title: 'Sincronizando...',
      text: 'Por favor espere mientras traemos la información desde Meta.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    const result = await campaignsRest.syncMetaHierarchy()
    Swal.close()

    if (result) {
      $(gridRef.current).dxDataGrid('instance').refresh()
      Swal.fire('Sincronizado', result, 'success')
    }
  }

  return (<>
    <Table
      gridRef={gridRef}
      title='Campaña'
      rest={campaignsRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('campaigns', 'all', 'create') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onModalOpen()
        }))
        can('campaigns', 'root', 'all', 'sync') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-info',
          text: 'Sincronizar con Meta',
          title: 'Sincronizar estructura desde Meta',
          icon: 'fab fa-facebook-messenger',
          onClick: onSyncMetaClicked
        }))
      }}
      masterDetail={{
        enabled: true,
        template: (container, { data }) => {
          ReactAppend(container, <AdSetsList campaignData={data} />)
        }
      }}
      columns={[
        {
          dataField: 'code',
          caption: 'Código',
          dataType: 'string',
          cssClass: 'font-monospace'
        },
        {
          dataField: 'source',
          caption: 'Fuente',
          dataType: 'string',
          lookup: {
            dataSource: sourceOptions,
            valueExpr: 'id',
            displayExpr: 'label'
          }
        },
        {
          dataField: 'title',
          caption: 'Título',
          dataType: 'string'
        },
        {
          dataField: 'link',
          caption: 'Enlace',
          dataType: 'string'
        },
        {
          dataField: 'notes',
          caption: 'Notas',
          dataType: 'string'
        },
        {
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          width: 80
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            if (data.protected) return container.append(renderToString(<span className='badge bg-soft-info text-info'>Protegido</span>))
            can('campaigns', 'root', 'all', 'update') &&
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-primary',
                title: 'Editar',
                icon: 'fa fa-pen',
                onClick: () => onModalOpen(data)
              }))
            can('campaigns', 'root', 'all', 'delete') &&
              container.append(DxButton({
                className: 'btn btn-xs btn-soft-danger',
                title: 'Eliminar',
                icon: 'fa fa-trash-alt',
                onClick: () => onDeleteClicked(data.id)
              }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar campaña' : 'Agregar campaña'} onSubmit={onModalSubmit}>
      <div className='row' id='campaign-form'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Código' col='col-12' required />
        <SelectFormGroup eRef={sourceRef} label='Fuente' col='col-12' required dropdownParent='#campaign-form' >
          {sourceOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </SelectFormGroup>
        <InputFormGroup eRef={titleRef} label='Título' col='col-12' required />
        <InputFormGroup eRef={linkRef} label='Enlace' col='col-12' />
        <TextareaFormGroup eRef={notesRef} label='Notas' col='col-12' />
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('campaigns', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Campañas' showTitle={false}>
      <Campaigns {...properties} />
    </Adminto>
  );
})