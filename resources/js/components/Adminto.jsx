import React, { useState } from 'react'
import RigthBar from './RightBar'
import NavBar from './NavBar'
import Menu from './Menu'
import Footer from './Footer'
import WhatsAppModal from './modals/WhatsAppModal'

moment.tz.setDefault('UTC');

const Adminto = ({ session, children, notificationsCount, title, can, WA_URL, APP_URL, presets, businesses, APP_PROTOCOL, APP_DOMAIN, leadsCount, tasksCount }) => {
  const [whatsappStatus, setWhatsAppStatus] = useState(null)

  console.log('El estado de WhatsApp en base es:', whatsappStatus)

  return (<>
    <div id="wrapper">
      <NavBar session={session} title={title} can={can} whatsappStatus={whatsappStatus} businesses={businesses} APP_DOMAIN={APP_DOMAIN} APP_PROTOCOL={APP_PROTOCOL} notificationsCount={notificationsCount} />
      <Menu session={session} can={can} presets={presets} whatsappStatus={whatsappStatus} APP_DOMAIN={APP_DOMAIN} businesses={businesses} APP_PROTOCOL={APP_PROTOCOL} leadsCount={leadsCount} tasksCount={tasksCount} />
      <div className="content-page">
        <div className="content">
          <div className="container-fluid">
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