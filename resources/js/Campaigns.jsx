import React, { useRef, useState, useEffect } from 'react'
import { Fetch } from 'sode-extend-react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import CampaignsRest from './actions/CampaignsRest.js'
import Swal from 'sweetalert2'
import sourceOptions from './Reutilizables/Campaigns/socials.json'

const campaignsRest = new CampaignsRest();

const AdsList = ({ adSetId, campaignId }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      const url = `${location.origin}${location.pathname.replace('/campaigns', '/api/ads/paginate')}`;
      const { result } = await Fetch(url, {
        method: 'POST',
        body: JSON.stringify({ campaign_id: campaignId, ad_set_id: adSetId, take: 100 })
      })
      setAds(result?.data || []);
      setLoading(false);
    }
    fetchAds();
  }, [adSetId]);

  if (loading) return <div className='p-2 text-muted small'><i className='fas fa-spinner fa-spin me-2'></i>Cargando anuncios...</div>;

  return (
    <div className='ms-4 mt-2 border-start ps-3'>
      {ads.length === 0 && <div className='text-muted small italic'>No hay anuncios en este conjunto</div>}
      {ads.map(ad => (
        <div key={ad.id} className='d-flex justify-content-between align-items-center py-2 border-bottom border-light last-child-no-border'>
          <div className='d-flex align-items-center'>
            <div className='bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center me-2' style={{ width: '24px', height: '24px' }}>
              <i className='mdi mdi-bullhorn-outline' style={{ fontSize: '12px' }}></i>
            </div>
            <span className='text-dark fw-medium' style={{ fontSize: '13px' }}>{ad.name}</span>
          </div>
          <span className={`badge ${ad.status === 'ACTIVE' ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'} rounded-pill`} style={{ fontSize: '10px' }}>
            {ad.status || 'INACTIVE'}
          </span>
        </div>
      ))}
    </div>
  )
}

const AdSetsList = ({ campaignId }) => {
  const [adSets, setAdSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchAdSets = async () => {
      const url = `${location.origin}${location.pathname.replace('/campaigns', '/api/ad-sets/paginate')}`;
      const { result } = await Fetch(url, {
        method: 'POST',
        body: JSON.stringify({ campaign_id: campaignId, take: 100 })
      })
      setAdSets(result?.data || []);
      setLoading(false);
    }
    fetchAdSets();
  }, [campaignId]);

  if (loading) return <div className='p-3 text-muted small'><i className='fas fa-spinner fa-spin me-2'></i>Cargando conjuntos de anuncios...</div>;

  return (
    <div className='mt-2 ps-3'>
      {adSets.length === 0 && <div className='text-muted small p-2'>No hay conjuntos de anuncios</div>}
      {adSets.map(as => (
        <div key={as.id} className='mb-2'>
          <div className='d-flex justify-content-between align-items-center p-2 rounded hover-bg-light' 
               style={{ cursor: 'pointer', transition: 'all 0.2s' }}
               onClick={() => setExpandedId(expandedId === as.id ? null : as.id)}>
            <div className='d-flex align-items-center'>
              <i className={`mdi ${expandedId === as.id ? 'mdi-chevron-down' : 'mdi-chevron-right'} me-2 text-muted`}></i>
              <div className='bg-soft-warning text-warning rounded d-flex align-items-center justify-content-center me-2' style={{ width: '28px', height: '28px' }}>
                <i className='mdi mdi-layers-outline' style={{ fontSize: '14px' }}></i>
              </div>
              <span className='fw-semibold text-secondary' style={{ fontSize: '14px' }}>{as.name}</span>
            </div>
            <span className={`badge ${as.status === 'ACTIVE' ? 'bg-success text-white' : 'bg-secondary text-white'} rounded-pill`} style={{ fontSize: '10px' }}>
              {as.status || 'INACTIVE'}
            </span>
          </div>
          {expandedId === as.id && <AdsList adSetId={as.id} campaignId={campaignId} />}
        </div>
      ))}
    </div>
  )
}

const CampaignItem = ({ campaign, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const source = sourceOptions.find(s => s.id === campaign.source);

  return (
    <div className='card mb-3 border-0 shadow-sm overflow-hidden transition-all' style={{ borderRadius: '12px' }}>
      <div className='card-body p-0'>
        <div className={`d-flex align-items-center p-3 ${isExpanded ? 'bg-soft-light' : 'bg-white'}`} style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
          <div className='me-3'>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${isExpanded ? 'bg-primary text-white' : 'bg-soft-primary text-primary'}`} style={{ width: '40px', height: '40px', transition: 'all 0.3s' }}>
              <i className={`mdi ${isExpanded ? 'mdi-folder-open' : 'mdi-folder'} h4 mb-0`}></i>
            </div>
          </div>
          <div className='flex-grow-1'>
            <div className='d-flex align-items-center gap-2 mb-1'>
              <span className='badge bg-soft-info text-info font-monospace' style={{ fontSize: '10px' }}>{campaign.code}</span>
              {source && (
                <span className='badge rounded-pill d-flex align-items-center gap-1' style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '10px' }}>
                   <i className={`fab fa-${source.id === 'ig' ? 'instagram' : 'facebook'} text-primary`}></i> {source.label}
                </span>
              )}
            </div>
            <h5 className='mb-0 fw-bold text-dark'>{campaign.title}</h5>
          </div>
          <div className='d-flex align-items-center gap-3' onClick={e => e.stopPropagation()}>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' checked={campaign.status} readOnly />
            </div>
            <div className='btn-group shadow-none'>
              <button className='btn btn-sm btn-light border-0 rounded-circle me-1' onClick={() => onEdit(campaign)} title='Editar'>
                <i className='mdi mdi-pencil text-primary'></i>
              </button>
              <button className='btn btn-sm btn-light border-0 rounded-circle' onClick={() => onDelete(campaign.id)} title='Eliminar'>
                <i className='mdi mdi-delete text-danger'></i>
              </button>
            </div>
            <i className={`mdi ${isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'} h4 mb-0 text-muted ms-2`}></i>
          </div>
        </div>
        {isExpanded && (
          <div className='p-3 pt-0 border-top border-light animate__animated animate__fadeIn'>
            <AdSetsList campaignId={campaign.id} />
          </div>
        )}
      </div>
    </div>
  )
}

const Campaigns = ({ can }) => {
  const modalRef = useRef()
  const idRef = useRef()
  const codeRef = useRef()
  const sourceRef = useRef()
  const titleRef = useRef()
  const linkRef = useRef()
  const notesRef = useRef()

  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const fetchCampaigns = async () => {
    setLoading(true)
    const result = await campaignsRest.paginate({ take: 100 })
    const data = result?.data || []
    setCampaigns(data)
    setFilteredCampaigns(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    const filtered = campaigns.filter(c => 
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCampaigns(filtered)
  }, [searchTerm, campaigns])

  const onModalOpen = (data) => {
    setIsEditing(!!data?.id)
    idRef.current.value = data?.id || null
    codeRef.current.value = data?.code || null
    $(sourceRef.current).val(data?.source || 'fb').trigger('change')
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
    if (result) {
      fetchCampaigns()
      $(modalRef.current).modal('hide')
    }
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar campaña?',
      text: 'Se eliminará la campaña y su estructura asociada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (isConfirmed) {
      const result = await campaignsRest.delete(id)
      if (result) fetchCampaigns()
    }
  }

  const onSyncMetaClicked = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Sincronizar con Meta',
      text: 'Se buscarán actualizaciones de jerarquía en Facebook.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sincronizar ahora'
    })
    if (isConfirmed) {
      Swal.fire({ title: 'Sincronizando...', didOpen: () => Swal.showLoading() })
      const result = await campaignsRest.syncMetaHierarchy()
      Swal.close()
      if (result) {
        fetchCampaigns()
        Swal.fire('Sincronizado', 'La estructura se ha actualizado.', 'success')
      }
    }
  }

  return (
    <div className='container-fluid py-4'>
      <div className='d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3'>
        <div>
          <h2 className='fw-bold mb-1 text-dark'>Gestión de Campañas</h2>
          <p className='text-muted mb-0'>Organiza y sincroniza tus anuncios de Meta en tiempo real.</p>
        </div>
        <div className='d-flex gap-2'>
          {can('campaigns', 'root', 'all', 'sync') && (
            <button className='btn btn-info rounded-pill px-3 shadow-sm d-flex align-items-center gap-2' onClick={onSyncMetaClicked}>
              <i className='fab fa-facebook-messenger'></i> Sincronizar Meta
            </button>
          )}
          {can('campaigns', 'all', 'create') && (
            <button className='btn btn-primary rounded-pill px-3 shadow-sm d-flex align-items-center gap-2' onClick={() => onModalOpen()}>
              <i className='fa fa-plus'></i> Nueva Campaña
            </button>
          )}
        </div>
      </div>

      <div className='row mb-4'>
        <div className='col-md-6'>
          <div className='input-group input-group-merge shadow-sm rounded-pill overflow-hidden border-0'>
            <span className='input-group-text bg-white border-0 ps-3'>
              <i className='mdi mdi-magnify text-muted h4 mb-0'></i>
            </span>
            <input 
              type='text' 
              className='form-control border-0 py-2' 
              placeholder='Buscar por nombre o código de campaña...' 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-5'>
          <div className='spinner-border text-primary' role='status'></div>
          <p className='mt-3 text-muted'>Cargando tus campañas...</p>
        </div>
      ) : (
        <div className='campaign-list'>
          {filteredCampaigns.length === 0 ? (
            <div className='card border-0 shadow-sm p-5 text-center' style={{ borderRadius: '15px' }}>
              <i className='mdi mdi-folder-search-outline display-1 text-muted opacity-25'></i>
              <h4 className='mt-3 text-dark fw-bold'>No se encontraron campañas</h4>
              <p className='text-muted'>Prueba con otros términos de búsqueda o agrega una nueva.</p>
            </div>
          ) : (
            filteredCampaigns.map(c => (
              <CampaignItem key={c.id} campaign={c} onEdit={onModalOpen} onDelete={onDeleteClicked} />
            ))
          )}
        </div>
      )}

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

      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .bg-soft-primary { background-color: rgba(59, 130, 246, 0.1); }
        .bg-soft-warning { background-color: rgba(245, 158, 11, 0.1); }
        .bg-soft-success { background-color: rgba(16, 185, 129, 0.1); }
        .bg-soft-info { background-color: rgba(6, 182, 212, 0.1); }
        .bg-soft-secondary { background-color: rgba(107, 114, 128, 0.1); }
        .bg-soft-light { background-color: #f1f5f9; }
        .transition-all { transition: all 0.3s ease; }
        .last-child-no-border:last-child { border-bottom: 0 !important; }
        .italic { font-style: italic; }
      `}</style>
    </div>
  )
}

CreateReactScript((el, properties) => {
  if (!properties.can('campaigns', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Campañas' showTitle={false}>
      <Campaigns {...properties} />
    </Adminto>
  );
})