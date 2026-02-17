import Modal from "../../components/Modal";

const ImportModal = ({ modalRef, fields, onSubmit, disabled, onClose, mapping, setMapping }) => {
    return <Modal modalRef={modalRef} title='Importar leads' onClose={onClose} onSubmit={onSubmit} loading={disabled} btnSubmitText='Importar'>
        <div className="row">
            {/* Campos primarios a la izquierda */}
            <div className="col-6">
                <label className="form-label text-muted small fw-semibold mb-2">Campos primarios</label>
                <div className="mb-2">
                    <label className="form-label small">Fecha creación</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.date || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, date: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Nombre */}
                <div className="mb-2">
                    <label className="form-label small">Nombre</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.name || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, name: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Correo */}
                <div className="mb-2">
                    <label className="form-label small">Correo</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.email || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, email: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Teléfono */}
                <div className="mb-2">
                    <label className="form-label small">Teléfono</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.phone || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, phone: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Formulario */}
                <div className="mb-2">
                    <label className="form-label small">Formulario (opcional)</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-wrap text-break"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.form?.length > 0 ? mapping.form.join(', ') : 'Seleccionar columna(s)'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => {
                                const isSelected = mapping.form?.includes(field);
                                return (
                                    <li key={idx}>
                                        <button
                                            className="dropdown-item small d-flex justify-content-between align-items-center w-full"
                                            type="button"
                                            onClick={() => {
                                                setMapping(prev => {
                                                    const current = prev.form || [];
                                                    const next = isSelected
                                                        ? current.filter(f => f !== field)
                                                        : [...current, field];
                                                    return { ...prev, form: next };
                                                });
                                            }}
                                        >
                                            <span className='d-inline-block text-truncate'>{field}</span>
                                            {isSelected && <i className="mdi mdi-check" />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Vista previa del mapeo a la derecha */}
            <div className="col-6">
                {/* Teléfono */}
                <div className="mb-2">
                    <label className="form-label small">Plataforma de importación</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.source || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, source: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mb-2">
                    <label className="form-label small">Disparado por</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.triggered_by || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, triggered_by: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="p-2 bg-light rounded">
                    <label className="form-label small">Así se importarán los leads:</label>
                    <ul className="list-unstyled mb-0 small">
                        <li><b>Nombre:</b> {mapping.name || '—'}</li>
                        <li><b>Correo:</b> {mapping.email || '—'}</li>
                        <li><b>Teléfono:</b> {mapping.phone || '—'}</li>
                        <li>
                            <b>Formulario:</b>
                            {
                                mapping.form?.length > 0
                                    ? <ol className="mb-0 ps-2">
                                        {mapping.form.map((f, idx) => <li key={idx} className="text-break">{f}</li>)}
                                    </ol>
                                    : <span className='ms-1'>—</span>
                            }
                        </li>
                    </ul>
                </div>
                {/* <div className="mt-2 text-muted small">
            Se importarán {rowsCount} filas
          </div> */}
            </div>
        </div>
    </Modal>
}

export default ImportModal