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
import { motion, AnimatePresence } from 'framer-motion'

const campaignsRest = new CampaignsRest();

const AdsList = ({ adSetId, campaignId }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAd, setExpandedAd] = useState(null);

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

  if (loading) return <div className='p-3 text-muted small d-flex align-items-center'><i className='fas fa-spinner fa-spin me-2'></i>Cargando anuncios...</div>;

  return (
    <div className='ms-4 mt-2 ps-3' style={{ borderLeft: '2px solid #e2e8f0' }}>
      {ads.length === 0 && <div className='text-muted small italic p-2 bg-light rounded'>No hay anuncios en este conjunto</div>}
      <div className="d-flex flex-column gap-3 mt-2">
        {ads.map(ad => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            key={ad.id} 
            className='bg-white rounded border shadow-sm overflow-hidden'
          >
            <div className='d-flex justify-content-between align-items-start p-3 hover-bg-light' 
                 style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                 onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}>
              <div className='d-flex gap-3 align-items-start'>
                <div className="flex-shrink-0">
                  {ad.preview_image_url ? (
                    <div className="rounded border bg-light d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px', overflow: 'hidden' }}>
                      <img src={ad.preview_image_url} alt="Ad Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className='bg-soft-primary text-primary rounded d-flex align-items-center justify-content-center shadow-sm' style={{ width: '48px', height: '48px' }}>
                      <i className='mdi mdi-bullhorn-outline h4 mb-0'></i>
                    </div>
                  )}
                </div>
                <div className="d-flex flex-column">
                  <span className='text-dark fw-bold' style={{ fontSize: '14px' }}>{ad.name}</span>
                  <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                    {Number(ad.spend) > 0 && (
                      <span className="badge bg-soft-success text-success border border-success border-opacity-25" style={{fontSize: '11px'}}>
                        <i className='mdi mdi-cash me-1'></i>Gasto: ${ad.spend}
                      </span>
                    )}
                    {ad.form_name && ad.form_name === 'WhatsApp' ? (
                      <span className="badge" style={{ backgroundColor: '#eefcf5', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '11px' }}>
                        <i className='mdi mdi-whatsapp me-1'></i>Mensajes (WhatsApp)
                      </span>
                    ) : ad.form_name && (
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '11px' }}>
                        <i className='mdi mdi-form-select me-1'></i>Formulario: {ad.form_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-2">
                <span className={`badge ${ad.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'} rounded-pill shadow-sm`} style={{ fontSize: '10px' }}>
                  {ad.status || 'INACTIVE'}
                </span>
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                  <i className={`mdi ${expandedAd === ad.id ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-muted`}></i>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {expandedAd === ad.id && ad.body_text && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-soft-light border-top"
                  style={{ overflow: 'hidden' }}
                >
                  <div className="p-3 text-secondary" style={{ fontSize: '13px' }}>
                    <div className="d-flex align-items-start gap-2">
                      <i className='mdi mdi-text-box-outline text-primary mt-1'></i> 
                      <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {ad.body_text}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
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

  if (loading) return <div className='p-3 text-muted small d-flex align-items-center'><i className='fas fa-spinner fa-spin me-2'></i>Cargando conjuntos de anuncios...</div>;

  return (
    <div className='mt-2 ps-3'>
      {adSets.length === 0 && <div className='text-muted small p-2 bg-light rounded'>No hay conjuntos de anuncios</div>}
      <div className="d-flex flex-column gap-2 mt-3">
        {adSets.map(as => (
          <motion.div key={as.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className='mb-2'>
            <div className='d-flex justify-content-between align-items-center p-3 rounded bg-white border hover-shadow-sm' 
                 style={{ cursor: 'pointer', transition: 'all 0.2s', boxShadow: expandedId === as.id ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none' }}
                 onClick={() => setExpandedId(expandedId === as.id ? null : as.id)}>
              <div className='d-flex align-items-center gap-3'>
                <div className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${expandedId === as.id ? 'bg-warning text-white shadow-sm' : 'bg-soft-warning text-warning'}`} style={{ width: '36px', height: '36px' }}>
                  <i className={`mdi ${expandedId === as.id ? 'mdi-layers' : 'mdi-layers-outline'} h5 mb-0`}></i>
                </div>
                <div className="d-flex flex-column">
                  <span className='fw-bold text-dark' style={{ fontSize: '15px' }}>{as.name}</span>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    {Number(as.spend) > 0 && <span className="text-success small fw-bold" style={{fontSize: '12px'}}><i className='mdi mdi-cash me-1'></i>Gasto AdSet: ${as.spend}</span>}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className={`badge ${as.status === 'ACTIVE' ? 'bg-success text-white' : 'bg-secondary text-white'} rounded-pill shadow-sm`} style={{ fontSize: '11px', padding: '0.4em 0.8em' }}>
                  {as.status || 'INACTIVE'}
                </span>
                <div className="bg-soft-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className={`mdi ${expandedId === as.id ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-muted h5 mb-0`}></i>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {expandedId === as.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="py-2">
                    <AdsList adSetId={as.id} campaignId={campaignId} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const CampaignItem = ({ campaign, onEdit, onDelete, onSync }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const source = sourceOptions.find(s => s.id === campaign.source);

  const cpl = (Number(campaign.spend) > 0 && Number(campaign.clients_count) > 0) 
    ? (Number(campaign.spend) / Number(campaign.clients_count)).toFixed(2) 
    : '0.00';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className={`card mb-4 border-0 shadow-sm overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-primary' : ''}`} 
      style={{ borderRadius: '16px', boxShadow: isExpanded ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
    >
      <div className='card-body p-0'>
        <div className={`d-flex align-items-center p-4 ${isExpanded ? 'bg-soft-light' : 'bg-white'}`} style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
          <div className='me-4 flex-shrink-0'>
            <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${isExpanded ? 'bg-primary text-white' : 'bg-soft-primary text-primary'}`} style={{ width: '56px', height: '56px', transition: 'all 0.3s' }}>
              <i className={`mdi ${isExpanded ? 'mdi-folder-open' : 'mdi-folder'} h3 mb-0`}></i>
            </div>
          </div>
          <div className='flex-grow-1'>
            <div className='d-flex align-items-center gap-2 mb-2'>
              <span className='badge bg-light text-secondary border font-monospace shadow-sm' style={{ fontSize: '11px', padding: '0.4em 0.8em' }}>{campaign.code}</span>
              {source && (
                <span className='badge rounded-pill d-flex align-items-center gap-1 shadow-sm' style={{ backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', fontSize: '11px', padding: '0.4em 0.8em' }}>
                   <i className={`fab fa-${source.id === 'ig' ? 'instagram' : 'facebook'} text-primary`}></i> {source.label}
                </span>
              )}
            </div>
            <h4 className='mb-3 fw-bold text-dark' style={{ letterSpacing: '-0.02em' }}>{campaign.title}</h4>
            
            <div className="d-flex align-items-center gap-3 mt-2 flex-wrap bg-light p-2 rounded-3 border">
              
              <div className="d-flex align-items-center gap-2 px-3 py-1 border-end">
                <div className="bg-soft-success text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                  <i className="mdi mdi-cash-multiple"></i>
                </div>
                <div className="d-flex flex-column">
                  <span className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gasto</span>
                  <span className="text-dark fw-bold" style={{ fontSize: '13px' }}>${Number(campaign.spend).toFixed(2)}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 px-3 py-1 border-end">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${Number(campaign.clients_count) > 0 ? 'bg-soft-primary text-primary' : 'bg-soft-secondary text-secondary'}`} style={{ width: '28px', height: '28px' }}>
                  <i className="mdi mdi-account-group"></i>
                </div>
                <div className="d-flex flex-column">
                  <span className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leads</span>
                  <span className={`${Number(campaign.clients_count) > 0 ? 'text-primary' : 'text-dark'} fw-bold`} style={{ fontSize: '13px' }}>{campaign.clients_count || 0}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 px-3 py-1 border-end">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${Number(cpl) > 0 ? 'bg-soft-danger text-danger' : 'bg-soft-secondary text-secondary'}`} style={{ width: '28px', height: '28px' }}>
                  <i className="mdi mdi-target"></i>
                </div>
                <div className="d-flex flex-column">
                  <span className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CPL</span>
                  <span className={`${Number(cpl) > 0 ? 'text-danger' : 'text-dark'} fw-bold`} style={{ fontSize: '13px' }}>${cpl}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 px-3 py-1">
                <div className="d-flex flex-column text-end">
                  <span className="text-muted" style={{ fontSize: '11px' }}><i className="mdi mdi-eye me-1"></i> {Number(campaign.impressions).toLocaleString()} Impr.</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}><i className="mdi mdi-cursor-default-click me-1"></i> {Number(campaign.clicks).toLocaleString()} Clics</span>
                </div>
              </div>

            </div>
          </div>
          <div className='d-flex align-items-center gap-3 ms-3' onClick={e => e.stopPropagation()}>
            <div className='form-check form-switch'>
              <input className='form-check-input form-check-success cursor-pointer' style={{ width: '40px', height: '20px' }} type='checkbox' checked={campaign.status} readOnly />
            </div>
            <div className='btn-group shadow-sm rounded-pill bg-white border'>
              <button className='btn btn-sm btn-white text-primary border-end' onClick={() => onEdit(campaign)} title='Editar'>
                <i className='mdi mdi-pencil'></i>
              </button>
              <button className='btn btn-sm btn-white text-danger' onClick={() => onDelete(campaign.id)} title='Eliminar'>
                <i className='mdi mdi-delete'></i>
              </button>
            </div>
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '36px', height: '36px' }}>
              <i className={`mdi ${isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'} h5 mb-0 text-secondary`}></i>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className='p-4 pt-0 border-top bg-soft-light'>
                <AdSetsList campaignId={campaign.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
              <i className='fab fa-facebook-messenger'></i> Obtener Jerarquía Meta
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
              <CampaignItem key={c.id} campaign={c} onEdit={onModalOpen} onDelete={onDeleteClicked} onSync={fetchCampaigns} />
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
        .hover-bg-light:hover { background-color: #f8fafc !important; }
        .hover-shadow-sm:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; }
        .bg-soft-primary { background-color: rgba(59, 130, 246, 0.1); }
        .bg-soft-warning { background-color: rgba(245, 158, 11, 0.1); }
        .bg-soft-success { background-color: rgba(16, 185, 129, 0.1); }
        .bg-soft-info { background-color: rgba(6, 182, 212, 0.1); }
        .bg-soft-danger { background-color: rgba(239, 68, 68, 0.1); }
        .bg-soft-secondary { background-color: rgba(100, 116, 139, 0.1); }
        .bg-soft-light { background-color: #f8fafc; }
        .transition-all { transition: all 0.3s ease; }
        .cursor-pointer { cursor: pointer; }
        .ring-2 { box-shadow: 0 0 0 2px var(--bs-primary); }
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