import Modal from "../../components/Modal";

const ImportModal = ({ modalRef, fields, onSubmit, disabled, onClose, mapping, setMapping }) => {
    return <Modal modalRef={modalRef} title='Importar leads' onClose={onClose} onSubmit={onSubmit} loading={disabled} btnSubmitText='Importar'>
        <div className="row">
            {/* Campos primarios a la izquierda */}
            <div className="col-6">
                <label className="form-label text-muted small fw-semibold mb-2">
                    Campos del lead
                    <span className="ms-2 text-muted fw-normal" style={{ fontSize: '10px' }}>
                        (* obligatorio)
                    </span>
                </label>
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
                    <label className="form-label small">Nombre <span className="text-danger">*</span></label>
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
                    <label className="form-label small">Correo <span className="text-muted" style={{fontSize:'10px'}}>(obligatorio si no hay teléfono)</span></label>
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
                    <label className="form-label small">Teléfono <span className="text-muted" style={{fontSize:'10px'}}>(obligatorio si no hay correo)</span></label>
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
                    <label className="form-label small">Plataforma de importación <span className="text-muted" style={{fontSize:'10px'}}>(opcional)</span></label>
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
                    <label className="form-label small">Disparado por <span className="text-muted" style={{fontSize:'10px'}}>(opcional)</span></label>
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
                <div className="mb-2">
                    <label className="form-label small">ID de Campaña (opcional)</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.campaign_id || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <li>
                                <button
                                    className="dropdown-item small text-truncate text-muted"
                                    type="button"
                                    onClick={() => setMapping(prev => ({ ...prev, campaign_id: null }))}
                                >
                                    Ninguno
                                </button>
                            </li>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, campaign_id: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mb-2">
                    <label className="form-label small">Nombre de Campaña (opcional)</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.campaign_name || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <li>
                                <button
                                    className="dropdown-item small text-truncate text-muted"
                                    type="button"
                                    onClick={() => setMapping(prev => ({ ...prev, campaign_name: null }))}
                                >
                                    Ninguno
                                </button>
                            </li>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, campaign_name: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mb-2">
                    <label className="form-label small">Grupo de Anuncio / AdSet (opcional)</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.adset_name || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <li>
                                <button
                                    className="dropdown-item small text-truncate text-muted"
                                    type="button"
                                    onClick={() => setMapping(prev => ({ ...prev, adset_name: null }))}
                                >
                                    Ninguno
                                </button>
                            </li>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, adset_name: field }))}
                                    >
                                        {field}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mb-2">
                    <label className="form-label small">Anuncio / Ad (opcional)</label>
                    <div className="dropdown">
                        <button
                            className="btn btn-sm btn-white dropdown-toggle w-100 text-start border text-truncate"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            {mapping.ad_name || 'Seleccionar columna'}
                        </button>
                        <ul className="dropdown-menu w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <li>
                                <button
                                    className="dropdown-item small text-truncate text-muted"
                                    type="button"
                                    onClick={() => setMapping(prev => ({ ...prev, ad_name: null }))}
                                >
                                    Ninguno
                                </button>
                            </li>
                            {fields?.map((field, idx) => (
                                <li key={idx}>
                                    <button
                                        className="dropdown-item small text-truncate"
                                        type="button"
                                        onClick={() => setMapping(prev => ({ ...prev, ad_name: field }))}
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
                        {mapping.campaign_id && <li><b>Campaña ID:</b> {mapping.campaign_id}</li>}
                        {mapping.campaign_name && <li><b>Campaña Nombre:</b> {mapping.campaign_name}</li>}
                        {mapping.adset_name && <li><b>Grupo de Anuncio:</b> {mapping.adset_name}</li>}
                        {mapping.ad_name && <li><b>Anuncio:</b> {mapping.ad_name}</li>}
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