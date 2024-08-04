import React from 'react'

const Footer = () => {
  const fullYear = new Date().getFullYear()
  return (<footer className="footer">
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          {fullYear} &copy; Atalaya | Propiedad de <a
            href="//mundoweb.pe">Mundo Web</a>
        </div>
        <div className="col-md-6">
          <div className="text-md-end footer-links d-none d-sm-block">
            <a href="#">Sobre nosotros</a>
            <a href="#">Manual de usuario</a>
            <a href="#">Contactanos</a>
          </div>
        </div>
      </div>
    </div>
  </footer>)
}

export default Footer