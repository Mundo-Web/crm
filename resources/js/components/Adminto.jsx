import React, { useState } from 'react'
import RigthBar from './RightBar'
import NavBar from './NavBar'
import Menu from './Menu'
import Footer from './Footer'
import WhatsAppModal from './modals/WhatsAppModal'

moment.tz.setDefault('UTC');

const Adminto = ({ session, children, notificationsCount, title, description, floatEnd, can, WA_URL, APP_URL, presets, businesses, APP_PROTOCOL, APP_DOMAIN, leadsCount, tasksCount }) => {

  const settings = Local.get('adminto_settings') ?? {}
  const [theme, setTheme] = useState(settings.theme ?? 'ligth');
  const [whatsappStatus, setWhatsAppStatus] = useState(null)

  return (<>
    <div id="wrapper">
      <NavBar session={session} theme={theme} setTheme={setTheme} title={title} can={can} whatsappStatus={whatsappStatus} businesses={businesses} APP_DOMAIN={APP_DOMAIN} APP_PROTOCOL={APP_PROTOCOL} notificationsCount={notificationsCount} />
      <Menu session={session} theme={theme} can={can} presets={presets} whatsappStatus={whatsappStatus} APP_DOMAIN={APP_DOMAIN} businesses={businesses} APP_PROTOCOL={APP_PROTOCOL} leadsCount={leadsCount} tasksCount={tasksCount} />
      <div className="content-page">
        <div className="content">
          <div className="container-fluid mt-3">
            <div className='mb-2 d-flex flex-wrap gap-2 justify-content-between align-items-center'>
              <div>
                <h4 className='my-0'>{title}</h4>
                {description && <small className=''>{description}</small>}
              </div>
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
    {can('whatsapp', 'all') && <WhatsAppModal session={session} status={whatsappStatus} setStatus={setWhatsAppStatus} WA_URL={WA_URL} APP_URL={APP_URL} />}
    <RigthBar />
    <div className="rightbar-overlay"></div>
  </>)
}

export default Adminto