import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Adminto from './components/Adminto'
import CreateReactScript from './Utils/CreateReactScript'

const Welcome = () => {
  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">
            Bienvenido al CRM de Atalaya
          </h1>
          <h2 className="h4 text-muted mb-4">
            CRM inteligente · Gestiona tus clientes y ventas
          </h2>
          <p className="lead mb-5">
            Control total sobre tus clientes y oportunidades de negocio.
          </p>

          <div className="row g-4 mb-5">
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="mdi mdi-folder-multiple-outline h1 text-primary"></i>
                  </div>
                  <h5 className="card-title">Gestión centralizada</h5>
                  <p className="card-text small text-muted">
                    Organiza clientes y contactos fácilmente.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="mdi mdi-bell-outline h1 text-primary"></i>
                  </div>
                  <h5 className="card-title">Seguimiento automático</h5>
                  <p className="card-text small text-muted">
                    Recibe recordatorios de tareas clave.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="mdi mdi-chart-line h1 text-primary"></i>
                  </div>
                  <h5 className="card-title">Reportes avanzados</h5>
                  <p className="card-text small text-muted">
                    Analiza métricas de ventas en segundos.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <div className="mb-3">
                    <i className="mdi mdi-link-variant h1 text-primary"></i>
                  </div>
                  <h5 className="card-title">Integración total</h5>
                  <p className="card-text small text-muted">
                    Conéctalo con emails y WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* <button className="btn btn-primary btn-lg px-5">
            Comenzar ahora
          </button> */}
        </div>
      </div>
    </div>
  );
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title={`Bienvenido`}>
      <Welcome {...properties} />
    </Adminto>
  );
})