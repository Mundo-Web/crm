import React, { useState } from 'react'
import RigthBar from './RightBar'
import NavBar from './NavBar'
import Menu from './Menu'
import Footer from './Footer'
import WhatsAppModal from './modals/WhatsAppModal'

moment.tz.setDefault('UTC');

const Adminto = ({ session, children, title, can, WA_URL, APP_URL, presets, businesses, APP_DOMAIN }) => {
  const [whatsappStatus, setWhatsappStatus] = useState('verifying')

  return (<>
    <div id="wrapper">
      <NavBar session={session} title={title} can={can} whatsappStatus={whatsappStatus} businesses={businesses} APP_DOMAIN={APP_DOMAIN} />
      <Menu session={session} can={can} presets={presets} APP_DOMAIN={APP_DOMAIN} />
      <div className="content-page">
        <div className="content">
          <div className="container-fluid">
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
    {can('whatsapp', 'all') && <WhatsAppModal session={session} status={whatsappStatus} setStatus={setWhatsappStatus} WA_URL={WA_URL} APP_URL={APP_URL} />}
    <RigthBar />
    <div className="rightbar-overlay"></div>
  </>)
}

export default Adminto