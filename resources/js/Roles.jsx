import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import PermissionsRest from './actions/PermissionsRest.js'
import RolesRest from './actions/RolesRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import Swal from 'sweetalert2'

const MODULE_METADATA = {
  leads: {
    icon: 'mdi mdi-account-star',
    color: '#2563eb',
    category: 'crm',
    label: 'Leads'
  },
  clients: {
    icon: 'mdi mdi-account-group',
    color: '#059669',
    category: 'crm',
    label: 'Clientes'
  },
  projects: {
    icon: 'mdi mdi-page-next',
    color: '#4f46e5',
    category: 'crm',
    label: 'Proyectos'
  },
  pages: {
    icon: 'mdi mdi-layers-triple',
    color: '#7c3aed',
    category: 'crm',
    label: 'Páginas de Proyectos'
  },
  tasks: {
    icon: 'mdi mdi-format-list-checks',
    color: '#d97706',
    category: 'crm',
    label: 'Tareas'
  },
  chats: {
    icon: 'mdi mdi-chat',
    color: '#0891b2',
    category: 'crm',
    label: 'Chats & Mensajería'
  },
  dashboard: {
    icon: 'mdi mdi-chart-donut-variant',
    color: '#db2777',
    category: 'crm',
    label: 'Dashboard & Analíticas'
  },
  flows: {
    icon: 'mdi mdi-source-branch',
    color: '#8b5cf6',
    category: 'automation',
    label: 'Flujos de Automatización'
  },
  campaigns: {
    icon: 'mdi mdi-google-ads',
    color: '#ea580c',
    category: 'automation',
    label: 'Campañas Meta'
  },
  'meta-forms': {
    icon: 'mdi mdi-form-select',
    color: '#0284c7',
    category: 'automation',
    label: 'Formularios Meta'
  },
  integrations: {
    icon: 'mdi mdi-api',
    color: '#0d9488',
    category: 'integrations',
    label: 'Integraciones'
  },
  whatsapp: {
    icon: 'mdi mdi-whatsapp',
    color: '#16a34a',
    category: 'integrations',
    label: 'WhatsApp'
  },
  'default-messages': {
    icon: 'mdi mdi-message-bulleted',
    color: '#9333ea',
    category: 'integrations',
    label: 'Mensajes Predeterminados'
  },
  repository: {
    icon: 'mdi mdi-database',
    color: '#475569',
    category: 'integrations',
    label: 'Repositorio'
  },
  users: {
    icon: 'mdi mdi-account-lock',
    color: '#2563eb',
    category: 'system',
    label: 'Usuarios'
  },
  roles: {
    icon: 'mdi mdi-account-convert',
    color: '#ca8a04',
    category: 'system',
    label: 'Roles'
  },
  permissions: {
    icon: 'mdi mdi-shield-key',
    color: '#dc2626',
    category: 'system',
    label: 'Permisos'
  },
  statuses: {
    icon: 'mdi mdi-format-list-bulleted-type',
    color: '#65a30d',
    category: 'system',
    label: 'Estados'
  },
  types: {
    icon: 'mdi mdi-format-list-text',
    color: '#0891b2',
    category: 'system',
    label: 'Tipos'
  },
  tables: {
    icon: 'mdi mdi-table',
    color: '#475569',
    category: 'system',
    label: 'Tablas'
  },
  processes: {
    icon: 'mdi mdi-timeline-text',
    color: '#e11d48',
    category: 'system',
    label: 'Procesos'
  },
  products: {
    icon: 'mdi mdi-layers',
    color: '#c026d3',
    category: 'system',
    label: 'Productos'
  },
  settings: {
    icon: 'mdi mdi-cogs',
    color: '#334155',
    category: 'system',
    label: 'Configuraciones'
  }
}

const CATEGORIES = [
  { id: 'all', label: 'Todos los Módulos', icon: 'mdi mdi-view-grid-outline' },
  { id: 'crm', label: 'Gestión & CRM', icon: 'mdi mdi-account-group-outline' },
  { id: 'automation', label: 'Automatización & Meta', icon: 'mdi mdi-robot-outline' },
  { id: 'integrations', label: 'Integraciones & Canales', icon: 'mdi mdi-api' },
  { id: 'system', label: 'Sistema & Configuración', icon: 'mdi mdi-cog-outline' }
]

const Roles = ({ permissions: rawPermissions = [], can }) => {
  // Group raw permissions by origin
  const groupedPermissions = useMemo(() => {
    const map = {}
    rawPermissions.forEach((item) => {
      const [origin] = item.name.split('.')
      if (!map[origin]) {
        const meta = MODULE_METADATA[origin] || {
          icon: 'mdi mdi-cube-outline',
          color: '#6b7280',
          category: 'system',
          label: item.model_name || origin
        }
        map[origin] = {
          origin,
          model_name: meta.label || item.model_name || origin,
          icon: meta.icon,
          color: meta.color,
          category: meta.category,
          items: []
        }
      }
      map[origin].items.push(item)
    })
    return Object.values(map)
  }, [rawPermissions])

  const totalPermissionsCount = rawPermissions.length

  const gridRef = useRef()
  const modalRef = useRef()
  const modalPermissionRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [rolActive, setRolActive] = useState({})
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onPermissionsModalOpen = async (data) => {
    setRolActive(data)
    setSearchTerm('')
    setActiveCategory('all')
    setCollapsedGroups({})
    setIsLoadingPermissions(true)
    $(modalPermissionRef.current).modal('show')

    try {
      const userPermissions = await PermissionsRest.byRole(data.id)
      setSelectedPermissions(userPermissions.map(p => p.id))
    } catch (err) {
      console.error(err)
      setSelectedPermissions([])
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  // Smart cascade toggle: clicking "Todos" toggles all items in that module, and checking all items auto-checks "Todos"
  const onPermissionToggle = (perm, group) => {
    const isTotal = perm.name.endsWith('.all') || perm.beauty?.toLowerCase() === 'todos'
    const isCurrentlyChecked = selectedPermissions.includes(perm.id)
    const groupIds = group.items.map(x => x.id)
    const totalPerm = group.items.find(x => x.name.endsWith('.all') || x.beauty?.toLowerCase() === 'todos')
    const granularPerms = group.items.filter(x => x !== totalPerm)

    setSelectedPermissions(prev => {
      if (isTotal) {
        if (!isCurrentlyChecked) {
          // Turning ON "Todos": select ALL permissions in this group
          const toAdd = groupIds.filter(id => !prev.includes(id))
          return [...prev, ...toAdd]
        } else {
          // Turning OFF "Todos": deselect ALL permissions in this group
          return prev.filter(id => !groupIds.includes(id))
        }
      } else {
        // Toggling a granular permission
        let newSelected
        if (isCurrentlyChecked) {
          // Unchecking this item -> also uncheck "Todos" if it was checked
          newSelected = prev.filter(x => x !== perm.id && x !== totalPerm?.id)
        } else {
          // Checking this item
          newSelected = [...prev, perm.id]
          // If now ALL granular items are checked, also auto-check "Todos"
          const allGranularChecked = granularPerms.length > 0 && granularPerms.every(p => newSelected.includes(p.id))
          if (allGranularChecked && totalPerm && !newSelected.includes(totalPerm.id)) {
            newSelected.push(totalPerm.id)
          }
        }
        return newSelected
      }
    })
  }

  const onToggleGroup = (groupItems, forceState = null) => {
    const groupIds = groupItems.map(x => x.id)
    const isAllGroupSelected = groupIds.every(id => selectedPermissions.includes(id))
    const shouldSelect = forceState !== null ? forceState : !isAllGroupSelected

    setSelectedPermissions(prev => {
      if (shouldSelect) {
        const toAdd = groupIds.filter(id => !prev.includes(id))
        return [...prev, ...toAdd]
      } else {
        return prev.filter(id => !groupIds.includes(id))
      }
    })
  }

  const onToggleAll = (select) => {
    if (select) {
      const allIds = rawPermissions.map(p => p.id)
      setSelectedPermissions(allIds)
    } else {
      setSelectedPermissions([])
    }
  }

  const toggleCollapseGroup = (origin) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [origin]: !prev[origin]
    }))
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await RolesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onPermissionsModalSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const request = {
      role_id: rolActive.id,
      permissions: selectedPermissions
    }

    const result = await PermissionsRest.massiveByRole(request)
    setIsSaving(false)
    if (!result) return

    $(modalPermissionRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar rol',
      text: '¿Está seguro de eliminar este rol?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await RolesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  // Filtered groups based on search & category
  const filteredGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    return groupedPermissions.filter(group => {
      // Category filter
      if (activeCategory !== 'all' && group.category !== activeCategory) {
        return false
      }

      // Search filter
      if (!q) return true

      const matchesGroup = group.model_name.toLowerCase().includes(q) || group.origin.toLowerCase().includes(q)
      const matchesItem = group.items.some(item =>
        (item.beauty && item.beauty.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      )

      return matchesGroup || matchesItem
    }).map(group => {
      if (!q) return group

      const qMatchesGroup = group.model_name.toLowerCase().includes(q) || group.origin.toLowerCase().includes(q)
      if (qMatchesGroup) return group

      // Only show items matching search query
      const matchingItems = group.items.filter(item =>
        (item.beauty && item.beauty.toLowerCase().includes(q)) ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      )

      return {
        ...group,
        items: matchingItems
      }
    }).filter(g => g.items.length > 0)
  }, [groupedPermissions, activeCategory, searchTerm])

  const selectedCount = selectedPermissions.length
  const progressPercent = totalPermissionsCount > 0 ? Math.round((selectedCount / totalPermissionsCount) * 100) : 0

  return (<>
    <Table gridRef={gridRef} title='Roles' rest={RolesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('roles', 'all', 'create') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onModalOpen()
        }))
      }}
      columns={[
        {
          dataField: 'name',
          caption: 'Rol'
        },
        {
          dataField: 'description',
          caption: 'Descripcion'
        },
        {
          dataField: 'created_at',
          caption: 'Fecha creacion',
          dataType: 'date',
          width: '150px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span>{moment(data.created_at).format('LL')}</span>)
          }
        },
        {
          dataField: 'updated_at',
          caption: 'Fecha actualizacion',
          dataType: 'date',
          width: '150px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span>{moment(data.updated_at).format('LL')}</span>)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 8px; height: 47px; overflow: visible; align-items: center')

            can('roles', 'all', 'update') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)

            can('roles', 'all', 'permissions') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Modificar permisos' onClick={() => onPermissionsModalOpen(data)} data-loading-text='<i class="fa fa-spinner fa-spin"></i>'>
              <i className='fas fa-th-list'></i>
            </TippyButton>)

            can('roles', 'all', 'delete') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />

    {/* Modal Agregar / Editar Rol */}
    <Modal modalRef={modalRef} title={isEditing ? 'Editar rol' : 'Agregar rol'} onSubmit={onModalSubmit}>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Rol' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' />
      </div>
    </Modal>

    {/* Modal Espacioso, Centrado y Moderno de Permisos */}
    <Modal
      modalRef={modalPermissionRef}
      title={
        <div className="d-flex align-items-center gap-3 py-1">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#2563eb',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}
          >
            <i className="mdi mdi-shield-account fs-3" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="m-0 fw-bold text-dark font-18">Gestión de Permisos:</h4>
              <span className="badge bg-primary text-white font-13 px-3 py-1 rounded-pill fw-bold shadow-sm">
                {rolActive.name || 'Cargando...'}
              </span>
            </div>
            <p className="text-muted font-12 m-0 mt-0.5">
              {rolActive.description || 'Configura los privilegios, accesos y acciones permitidas para este rol en la plataforma.'}
            </p>
          </div>
        </div>
      }
      btnSubmitText='Guardar Permisos'
      onSubmit={onPermissionsModalSubmit}
      size='xl'
      bodyClass="p-4"
      loading={isSaving}
    >
      <div style={{ backgroundColor: '#f8fafc', margin: '-1.5rem', padding: '1.5rem' }}>
        {/* Barra Superior: Búsqueda, Estadísticas y Acciones Globales en 1 sola fila */}
        <div className=" pb-3  mb-3">
          <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-3">
            {/* Input de Búsqueda Elegante */}
            <div className="position-relative  flex-grow-1" style={{ maxWidth: '340px' }}>
              <i
                className="mdi mdi-magnify text-muted position-absolute fs-5"
                style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                className="form-control rounded-pill"
                placeholder="Buscar módulo, acción o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  height: '40px',
                  paddingLeft: '42px',
                  paddingRight: '36px',
                  fontSize: '13px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-link position-absolute p-0 text-muted text-decoration-none d-flex align-items-center justify-content-center"
                  onClick={() => setSearchTerm('')}
                  style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px' }}
                >
                  <i className="mdi mdi-close-circle fs-5" />
                </button>
              )}
            </div>

            {/* Asignados + Marcar Todo + Desmarcar Todo en la MISMA fila */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap flex-sm-nowrap">
              {/* Badge Asignados */}
              <div
                className="d-inline-flex align-items-center justify-content-center gap-2 px-3 rounded-pill border flex-shrink-0"
                style={{
                  height: '40px',
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  width: 'auto',
                }}
              >
                <i className="mdi mdi-check-decagram text-primary font-16 d-flex align-items-center" />
                <span className="font-12 text-secondary fw-semibold">Asignados:</span>
                <span
                  className="badge bg-primary rounded-pill font-11 fw-bold px-2.5 py-1 d-inline-flex align-items-center justify-content-center"
                  style={{ lineHeight: 1 }}
                >
                  {selectedCount} / {totalPermissionsCount}
                </span>
                <div
                  className="progress rounded-pill flex-shrink-0"
                  style={{
                    width: '56px',
                    height: '6px',
                    backgroundColor: '#e2e8f0',
                    overflow: 'hidden',
                    margin: 0
                  }}
                >
                  <div
                    className="progress-bar bg-primary rounded-pill transition-all"
                    role="progressbar"
                    style={{ width: `${progressPercent}%`, height: '100%' }}
                  />
                </div>
              </div>

              {/* Botón Marcar Todo */}
              <button
                type="button"
                className="btn btn-soft-success d-inline-flex align-items-center justify-content-center gap-1.5 rounded-pill px-3 fw-semibold font-12 shadow-none flex-shrink-0"
                onClick={() => onToggleAll(true)}
                style={{ height: '40px' }}
              >
                <i className="mdi mdi-check-all fs-5" />
                <span>Marcar Todo</span>
              </button>

              {/* Botón Desmarcar Todo */}
              <button
                type="button"
                className="btn btn-soft-danger d-inline-flex align-items-center justify-content-center gap-1.5 rounded-pill px-3 fw-semibold font-12 shadow-none flex-shrink-0"
                onClick={() => onToggleAll(false)}
                style={{ height: '40px' }}
              >
                <i className="mdi mdi-close-circle-outline fs-5" />
                <span>Desmarcar Todo</span>
              </button>
            </div>
          </div>

          {/* Filtro de Categorías / Tabs Alineado Verticalmente */}
          <div className="d-flex flex-wrap align-items-center gap-2 mt-2 pt-2  border-top">
            <span className="font-11 text-muted fw-bold me-1 text-uppercase letter-spacing-1 d-flex align-items-center" style={{ height: '32px' }}>
              Filtrar por:
            </span>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn rounded-pill d-inline-flex align-items-center justify-content-center gap-1.5 px-3 py-1 font-12 transition-all shadow-none ${isActive
                    ? 'btn-primary shadow-sm fw-bold'
                    : 'btn-soft-secondary text-dark'
                    }`}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{ height: '32px' }}
                >
                  <i className={`${cat.icon} font-14`} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid de Módulos Espacioso y Centrado */}
        {isLoadingPermissions ? (
          <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-4">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <h5 className="text-dark fw-bold mb-1">Cargando permisos del rol...</h5>
            <p className="text-muted font-12">Por favor espera un momento.</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-4">
            <div
              className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: 72, height: 72 }}
            >
              <i className="mdi mdi-shield-search fs-1 text-muted" />
            </div>
            <h4 className="text-dark fw-bold mb-2 font-16">No se encontraron permisos</h4>
            <p className="text-muted font-13 mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
              No hay ningún módulo o acción que coincida con tu búsqueda "<strong>{searchTerm}</strong>".
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-none"
              onClick={() => {
                setSearchTerm('')
                setActiveCategory('all')
              }}
            >
              <i className="mdi mdi-undo-variant" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        ) : (
          <div
            className="row g-4"
            style={{
              maxHeight: '62vh',
              overflowY: 'auto',
              paddingRight: '6px',
              paddingBottom: '12px'
            }}
          >
            {filteredGroups.map((group) => {
              const groupItemIds = group.items.map(x => x.id)
              const selectedInGroup = groupItemIds.filter(id => selectedPermissions.includes(id)).length
              const isAllSelected = selectedInGroup === group.items.length && group.items.length > 0
              const isPartiallySelected = selectedInGroup > 0 && !isAllSelected
              const isCollapsed = Boolean(collapsedGroups[group.origin])

              // Separate "Todos" (Acceso Total) from granular action permissions
              const totalPerm = group.items.find(x => x.name.endsWith('.all') || x.beauty?.toLowerCase() === 'todos')
              const granularItems = group.items.filter(x => x !== totalPerm)

              return (
                <div key={`module-${group.origin}`} className="col-xl-6 col-lg-6 col-md-12">
                  <div
                    className="card h-100 shadow-sm rounded-4 border-0 mb-0 transition-all overflow-hidden"
                    style={{
                      backgroundColor: '#ffffff',
                      borderLeft: `5px solid ${group.color || '#2563eb'}`,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Encabezado del Módulo con Icono y Toggle General */}
                    <div
                      className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleCollapseGroup(group.origin)}
                    >
                      {/* Lado Izquierdo: Icono + Título del Módulo */}
                      <div className="d-flex align-items-center gap-3 text-truncate" style={{ maxWidth: '68%' }}>
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            backgroundColor: `${group.color}15`,
                            color: group.color
                          }}
                        >
                          <i className={`${group.icon} fs-4`} />
                        </div>
                        <div className="text-truncate">
                          <h5 className="fw-bold text-dark font-15 m-0 text-truncate" title={group.model_name}>
                            {group.model_name}
                          </h5>
                          <span className="badge bg-light text-secondary font-11 px-2.5 py-0.5 mt-0.5 rounded-pill border">
                            {group.origin}
                          </span>
                        </div>
                      </div>

                      {/* Lado Derecho: Conteo + Botón Marcar Módulo + Chevron */}
                      <div className="d-flex align-items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Tippy content={isAllSelected ? "Desmarcar todos los permisos de este módulo" : "Marcar todos los permisos de este módulo"}>
                          <button
                            type="button"
                            className={`btn btn-xs rounded-pill px-3 py-1.5 d-inline-flex align-items-center justify-content-center gap-1.5 font-12 fw-bold transition-all shadow-none ${isAllSelected
                              ? 'btn-success text-white shadow-sm'
                              : isPartiallySelected
                                ? 'btn-soft-primary text-primary border border-primary border-opacity-50'
                                : 'btn-soft-secondary text-muted'
                              }`}
                            onClick={() => onToggleGroup(group.items)}
                            style={{ height: '34px' }}
                          >
                            <i className={isAllSelected ? 'mdi mdi-check-circle fs-5' : isPartiallySelected ? 'mdi mdi-minus-circle fs-5' : 'mdi mdi-circle-outline fs-5'} />
                            <span>{selectedInGroup} / {group.items.length}</span>
                          </button>
                        </Tippy>

                        <button
                          type="button"
                          className="btn btn-link btn-xs text-muted p-1 ms-1 d-inline-flex align-items-center justify-content-center shadow-none"
                          onClick={() => toggleCollapseGroup(group.origin)}
                          style={{ width: '30px', height: '30px' }}
                        >
                          <i className={`mdi mdi-chevron-${isCollapsed ? 'down' : 'up'} fs-4`} />
                        </button>
                      </div>
                    </div>

                    {/* Cuerpo del Módulo: Permisos Individuales */}
                    {!isCollapsed && (
                      <div className="card-body p-3.5">
                        {/* Hero Banner Destacado para 'Acceso Total' (si existe) */}
                        {totalPerm && (
                          <div
                            className={`p-3 rounded-3 border mb-3 d-flex align-items-center justify-content-between transition-all ${selectedPermissions.includes(totalPerm.id)
                              ? 'border-primary border-opacity-50 shadow-sm'
                              : 'bg-light bg-opacity-60 border-secondary border-opacity-20'
                              }`}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: selectedPermissions.includes(totalPerm.id) ? '#eff6ff' : '#f8fafc'
                            }}
                            onClick={() => onPermissionToggle(totalPerm, group)}
                          >
                            <div className="d-flex align-items-center gap-3 text-truncate" style={{ maxWidth: '85%' }}>
                              {/* Switch Centrado */}
                              <div
                                className="d-flex align-items-center justify-content-center flex-shrink-0"
                                onClick={e => e.stopPropagation()}
                                style={{ width: '40px', height: '24px' }}
                              >
                                <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input m-0"
                                    id={`perm-sw-${totalPerm.id}`}
                                    checked={selectedPermissions.includes(totalPerm.id)}
                                    onChange={() => onPermissionToggle(totalPerm, group)}
                                    style={{
                                      cursor: 'pointer',
                                      width: '38px',
                                      height: '21px'
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="text-truncate d-flex flex-column justify-content-center">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <span className="font-13 fw-bold text-dark text-truncate">
                                    {totalPerm.beauty || 'Acceso Completo'}
                                  </span>
                                  <span className="badge bg-warning text-dark font-10 px-2 py-0.5 rounded-pill fw-bold">
                                    Acceso Total
                                  </span>
                                </div>
                                <span
                                  className="text-muted font-11 d-block text-truncate mt-0.5"
                                  title={totalPerm.description}
                                >
                                  {totalPerm.description || 'Otorga todos los permisos y acciones sobre este módulo'}
                                </span>
                              </div>
                            </div>

                            {totalPerm.description && (
                              <Tippy content={totalPerm.description} arrow={true}>
                                <span className="text-muted opacity-75 ps-2 d-inline-flex align-items-center justify-content-center flex-shrink-0">
                                  <i className="mdi mdi-information-outline fs-5" />
                                </span>
                              </Tippy>
                            )}
                          </div>
                        )}

                        {/* Sub-Grid de 2 Columnas para Acciones Granulares */}
                        {granularItems.length > 0 && (
                          <div className="row g-2">
                            {granularItems.map((perm) => {
                              const isChecked = selectedPermissions.includes(perm.id)

                              return (
                                <div
                                  key={`perm-item-${perm.id}`}
                                  className={granularItems.length === 1 ? "col-12" : "col-md-6 col-sm-12"}
                                >
                                  <div
                                    className={`px-3 py-2.5 rounded-3 border h-100 d-flex align-items-center justify-content-between transition-all ${isChecked
                                      ? 'border-primary border-opacity-50 shadow-none'
                                      : 'bg-white border-secondary border-opacity-15'
                                      }`}
                                    style={{
                                      cursor: 'pointer',
                                      backgroundColor: isChecked ? '#f0f7ff' : '#ffffff',
                                      minHeight: '52px'
                                    }}
                                    onClick={() => onPermissionToggle(perm, group)}
                                  >
                                    {/* Switch y Texto Centrado */}
                                    <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '85%' }}>
                                      <div
                                        className="d-flex  align-items-center justify-content-center flex-shrink-0"
                                        onClick={e => e.stopPropagation()}
                                        style={{ width: '36px', height: '20px' }}
                                      >
                                        <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                                          <input
                                            type="checkbox"
                                            className="form-check-input m-0"
                                            id={`perm-sw-${perm.id}`}
                                            checked={isChecked}
                                            onChange={() => onPermissionToggle(perm, group)}
                                            style={{
                                              cursor: 'pointer',
                                              width: '34px',
                                              height: '19px'
                                            }}
                                          />
                                        </div>
                                      </div>

                                      <div className="text-truncate d-flex flex-column justify-content-center">
                                        <span
                                          className={`font-12 text-truncate ${isChecked ? 'fw-bold text-dark' : 'text-secondary fw-medium'
                                            }`}
                                        >
                                          {perm.beauty || perm.name}
                                        </span>
                                        {perm.description && (
                                          <span
                                            className="text-muted font-10 d-block text-truncate mt-0.5"
                                            title={perm.description}
                                            style={{ opacity: 0.85 }}
                                          >
                                            {perm.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Icono de Info / Tooltip a la derecha */}
                                    {perm.description && (
                                      <Tippy content={perm.description} arrow={true}>
                                        <span
                                          className="text-muted opacity-75 ps-1 d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                          style={{ width: '20px', height: '20px' }}
                                        >
                                          <i className="mdi mdi-information-outline font-13" />
                                        </span>
                                      </Tippy>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('roles', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Roles'>
      <Roles {...properties} />
    </Adminto>
  );
})