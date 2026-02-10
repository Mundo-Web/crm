import React, { useEffect, useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RigthBar from './RightBar'
import NavBar from './NavBar'
import Menu from './Menu'
import Footer from './Footer'
import WhatsAppModal from './modals/WhatsAppModal'
import { Toaster } from 'sonner'
import { Local } from 'sode-extend-react'
import useWebSocket from '../Reutilizables/CustomHooks/useWebSocket'

moment.tz.setDefault('UTC');

const SortablePinnedButton = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.href })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <a
      ref={setNodeRef}
      style={style}
      href={item.href}
      className='d-block btn btn-light btn-sm d-flex align-items-center gap-1 rounded-pill'
      {...attributes}
      {...listeners}
    >
      <i className={item.icon} />
      <span>{item.name}</span>
    </a>
  )
}

const Adminto = ({ session, children, notificationsCount, prefixes, title, showTitle = true, description, floatEnd, can, WA_URL, APP_URL, presets, businesses, services, APP_PROTOCOL, APP_DOMAIN, leadsCount, tasksCount, setWAPhone = () => { }, setThemeParent = () => { } }) => {

  const settings = Local.get('adminto_settings') ?? {}
  const _pinned = Local.get('menu-pinned') ?? []
  const [theme, setTheme] = useState(settings.theme ?? 'light')
  const [whatsappStatus, setWhatsAppStatus] = useState(null)
  const [pinned, setPinned] = useState(_pinned)

  const { wsActive } = useWebSocket()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setThemeParent(theme)
  }, [theme])

  useEffect(() => {
    Local.set('menu-pinned', pinned)
  }, [pinned])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setPinned((items) => {
        const oldIndex = items.findIndex(item => item.href === active.id)
        const newIndex = items.findIndex(item => item.href === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        Local.set('menu-pinned', newItems)
        return newItems
      })
    }
  }

  return (<>
    <div id="wrapper">
      <Toaster />
      <NavBar session={session} services={services} theme={theme} setTheme={setTheme} title={title} can={can} whatsappStatus={whatsappStatus} businesses={businesses} APP_DOMAIN={APP_DOMAIN} APP_PROTOCOL={APP_PROTOCOL} notificationsCount={notificationsCount} wsActive={wsActive} pinned={pinned} setPinned={setPinned} />
      <Menu session={session} theme={theme} can={can} presets={presets} whatsappStatus={whatsappStatus} APP_DOMAIN={APP_DOMAIN} businesses={businesses} APP_PROTOCOL={APP_PROTOCOL} leadsCount={leadsCount} tasksCount={tasksCount} wsActive={wsActive} pinned={pinned} setPinned={setPinned} />
      <div className="content-page">
        <div className="content">
          {
            pinned.length > 0 &&
            <div className='container-fluid' style={{ marginTop: '1rem' }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={pinned.map(item => item.href)} strategy={horizontalListSortingStrategy}>
                  <div className='d-flex flex-wrap align-items-center gap-2'>
                    <i className='mdi mdi-pin' />
                    {pinned.map(item => (
                      <SortablePinnedButton
                        key={item.href}
                        item={item}
                        onClick={(e) => {
                          // Only allow navigation if the item hasn't just been reordered
                          if (!e.currentTarget.dataset.reordered) {
                            return true;
                          }
                          e.preventDefault();
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          }
          <div className="container-fluid mt-2">
            <div className='mb-2 d-flex flex-wrap gap-2 justify-content-between align-items-center'>
              {
                showTitle &&
                <div>
                  <h4 className='my-0'>{title}</h4>
                  {description && <small className=''>{description}</small>}
                </div>
              }
              <div>
                {floatEnd}
              </div>
            </div>
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
    {can('whatsapp', 'all') && <WhatsAppModal session={session} prefixes={prefixes} status={whatsappStatus} setStatus={setWhatsAppStatus} WA_URL={WA_URL} APP_URL={APP_URL} setWAPhone={setWAPhone} />}
    <RigthBar />
    <div className="rightbar-overlay"></div>
  </>)
}

export default Adminto