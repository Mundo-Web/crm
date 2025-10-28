const ChatEmpty = () => {
    return <div className="d-flex flex-column align-items-center justify-content-center text-center px-4" style={{ height: 'calc(100vh - 186px)' }}>
        <div className="mb-3">
            <i className="mdi mdi-account-off-outline text-muted" style={{ fontSize: '4rem' }}></i>
        </div>
        <h5 className="text-muted mb-2">Este contacto no existe en la empresa seleccionada</h5>
        <p className="text-muted mb-3">
            Por favor, elige otro contacto desde la lista o intenta refrescar la página si crees que debería estar aquí.
        </p>
        <button
            className="btn btn-outline-primary"
            onClick={() => window.location.reload()}
        >
            <i className="mdi mdi-refresh me-1"></i>Refrescar página
        </button>
    </div>
}

export default ChatEmpty