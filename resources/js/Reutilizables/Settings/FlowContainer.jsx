import { useCallback, useEffect, useRef, useState } from 'react';
import SettingsRest from '../../actions/SettingsRest';
import areArraySame from '../../Utils/areArraySame';
import Modal from '../../components/Modal';

const settingsRest = new SettingsRest();

const FlowContainer = ({ questions: questionsDB, isOpen, setIsOpen }) => {
    // questionsDB is now expected to be an array of items: [{id, title, type, ...}]
    const [items, setItems] = useState(questionsDB);
    const [savedItems, setSavedItems] = useState(questionsDB);

    // UI states
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editText, setEditText] = useState('');
    const [newFormTitle, setNewFormTitle] = useState('');
    const [newQuestionText, setNewQuestionText] = useState('');
    const [activeItemId, setActiveItemId] = useState(null);
    const [newQuestionClosed, setNewQuestionClosed] = useState(false);
    const [newAnswers, setNewAnswers] = useState(['']);
    const [editClosed, setEditClosed] = useState(false);
    const [editAnswers, setEditAnswers] = useState(['']);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState(null);
    const modalRef = useRef()

    // Form builder states
    const [formTitle, setFormTitle] = useState('');
    const [formQuestions, setFormQuestions] = useState([]);

    // Preset messages list (mock)
    const presetMessages = [
        { id: 'kh2yw2oaypvi7uh', title: 'Bienvenida' },
        { id: 'abc123', title: 'Despedida' },
        { id: 'def456', title: 'Información de contacto' },
    ];

    // Repository files list (mock)
    const repoFiles = [
        { id: 'file1', title: 'Contrato.pdf' },
        { id: 'file2', title: 'Manual.pdf' },
        { id: 'file3', title: 'Políticas.pdf' },
    ];

    // Products list (mock)
    const products = [
        { id: 'prod1', title: 'Producto A' },
        { id: 'prod2', title: 'Producto B' },
        { id: 'prod3', title: 'Producto C' },
    ];

    // --- Modal handlers ---
    const openModal = (type, title, data = null) => {
        setModalType(type);
        setModalTitle(title);
        setModalData(data);
        $(modalRef.current).modal('show');
    };

    const closeModal = () => {
        $(modalRef.current).modal('hide');
        setModalType('');
        setModalTitle('');
        setModalData(null);
        setFormTitle('');
        setFormQuestions([]);
    };

    // --- Form builder helpers ---
    const addFormQuestion = () => {
        setFormQuestions([...formQuestions, { id: Date.now(), text: '', closed: false, answers: [''] }]);
    };

    const updateFormQuestion = (idx, field, value) => {
        const updated = [...formQuestions];
        updated[idx][field] = value;
        setFormQuestions(updated);
    };

    const updateFormQuestionAnswer = (qIdx, aIdx, value) => {
        const updated = [...formQuestions];
        updated[qIdx].answers[aIdx] = value;
        setFormQuestions(updated);
    };

    const addFormQuestionAnswer = (qIdx) => {
        const updated = [...formQuestions];
        updated[qIdx].answers.push('');
        setFormQuestions(updated);
    };

    const removeFormQuestionAnswer = (qIdx, aIdx) => {
        const updated = [...formQuestions];
        updated[qIdx].answers.splice(aIdx, 1);
        setFormQuestions(updated);
    };

    const removeFormQuestion = (idx) => {
        setFormQuestions(formQuestions.filter((_, i) => i !== idx));
    };

    // --- Item CRUD ---
    const addItem = (type) => {
        switch (type) {
            case 'form':
                setFormTitle('');
                setFormQuestions([]);
                openModal('form', 'Crear Formulario');
                break;
            case 'message':
                openModal('message', 'Seleccionar Mensaje Predeterminado');
                break;
            case 'file':
                openModal('file', 'Seleccionar Archivo de Repositorio');
                break;
            case 'products':
                openModal('products', 'Seleccionar Lista de Productos');
                break;
        }
    };

    const handleModalSave = () => {
        let newItem;
        switch (modalType) {
            case 'form':
                if (!formTitle.trim() || formQuestions.length === 0) return;
                newItem = {
                    id: Date.now(),
                    title: formTitle.trim(),
                    type: 'form',
                    questions: formQuestions.map(q => ({
                        ...q,
                        answers: q.closed ? q.answers.filter(a => a.trim()) : null
                    }))
                };
                setItems([...items, newItem]);
                break;
            case 'message':
                if (!modalData) return;
                newItem = {
                    id: Date.now(),
                    title: modalData.title,
                    type: 'default_message',
                    message_id: modalData.id
                };
                setItems([...items, newItem]);
                break;
            case 'file':
                if (!modalData) return;
                newItem = {
                    id: Date.now(),
                    title: modalData.title,
                    type: 'repository',
                    file_id: modalData.id
                };
                setItems([...items, newItem]);
                break;
            case 'products':
                if (!modalData) return;
                newItem = {
                    id: Date.now(),
                    title: modalData.title,
                    type: 'product',
                    product_id: modalData.id
                };
                setItems([...items, newItem]);
                break;
        }
        closeModal();
    };

    const deleteItem = (itemId) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    // --- Question CRUD inside a form item ---
    const addQuestion = (itemId) => {
        if (!newQuestionText.trim()) return;
        const answers = newQuestionClosed ? newAnswers.filter(a => a.trim()) : null;
        if (newQuestionClosed && answers.length === 0) return;
        setItems(items.map(i =>
            i.id === itemId && i.type === 'form'
                ? { ...i, questions: [...i.questions, { id: Date.now(), text: newQuestionText.trim(), closed: newQuestionClosed, answers }] }
                : i
        ));
        setNewQuestionText('');
        setNewQuestionClosed(false);
        setNewAnswers(['']);
    };

    const deleteQuestion = (itemId, questionId) => {
        setItems(items.map(i =>
            i.id === itemId && i.type === 'form'
                ? { ...i, questions: i.questions.filter(q => q.id !== questionId) }
                : i
        ));
    };

    const startEditQuestion = (questionId, text, closed, answers) => {
        setEditingQuestionId(questionId);
        setEditText(text);
        setEditClosed(!!closed);
        setEditAnswers(answers ? [...answers] : ['']);
    };

    const saveEditQuestion = () => {
        const answers = editClosed ? editAnswers.filter(a => a.trim()) : null;
        if (editClosed && answers.length === 0) return;
        setItems(items.map(i => {
            if (i.type !== 'form') return i;
            return {
                ...i,
                questions: i.questions.map(q =>
                    q.id === editingQuestionId ? { ...q, text: editText, closed: editClosed, answers } : q
                )
            };
        }));
        setEditingQuestionId(null);
        setEditText('');
        setEditClosed(false);
        setEditAnswers(['']);
    };

    const cancelEditQuestion = () => {
        setEditingQuestionId(null);
        setEditText('');
        setEditClosed(false);
        setEditAnswers(['']);
    };

    const addNewAnswerField = () => setNewAnswers([...newAnswers, '']);
    const removeNewAnswerField = (idx) => setNewAnswers(newAnswers.filter((_, i) => i !== idx));
    const updateNewAnswer = (idx, val) => {
        const updated = [...newAnswers];
        updated[idx] = val;
        setNewAnswers(updated);
    };

    const addEditAnswerField = () => setEditAnswers([...editAnswers, '']);
    const removeEditAnswerField = (idx) => setEditAnswers(editAnswers.filter((_, i) => i !== idx));
    const updateEditAnswer = (idx, val) => {
        const updated = [...editAnswers];
        updated[idx] = val;
        setEditAnswers(updated);
    };

    // --- Drag & Drop for questions inside the same form item ---
    const handleDragStart = (itemId, qIndex) => {
        setDraggedIndex({ itemId, qIndex });
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e, itemId, dropIndex) => {
        e.preventDefault();
        if (!draggedIndex || draggedIndex.itemId !== itemId || draggedIndex.qIndex === dropIndex) return;

        setItems(items.map(i => {
            if (i.id !== itemId || i.type !== 'form') return i;
            const reordered = [...i.questions];
            const [draggedItem] = reordered.splice(draggedIndex.qIndex, 1);
            reordered.splice(dropIndex, 0, draggedItem);
            return { ...i, questions: reordered };
        }));
        setDraggedIndex(null);
    };

    // --- Drag & Drop for items ---
    const handleItemDragStart = (index) => {
        setDraggedIndex({ type: 'item', index });
    };

    const handleItemDrop = (e, dropIndex) => {
        e.preventDefault();
        if (!draggedIndex || draggedIndex.type !== 'item' || draggedIndex.index === dropIndex) return;

        const reordered = [...items];
        const [draggedItem] = reordered.splice(draggedIndex.index, 1);
        reordered.splice(dropIndex, 0, draggedItem);
        setItems(reordered);
        setDraggedIndex(null);
    };

    // --- Persist ---
    const saveItems = useCallback(async () => {
        const result = await settingsRest.save({
            type: 'json',
            name: 'gemini-extra-questions',
            value: JSON.stringify(items)
        });
        if (!result) return;
        setSavedItems(items);
    }, [items]);

    useEffect(() => {
        if (!isOpen) return;
        if (areArraySame(items, savedItems)) return;
        saveItems();
    }, [isOpen, items, savedItems, saveItems]);

    return (
        <>
            <div className="card" style={{ minHeight: 'calc(100vh - 160px)' }} hidden={!isOpen}>
                <div className="card-body">
                    <button className="btn btn-soft-danger btn-xs position-absolute" onClick={() => setIsOpen(false)}>
                        <i className="mdi mdi-pan-left me-1"></i>
                        Volver
                    </button>

                    {/* Flow Diagram */}
                    <div className="d-flex justify-content-center align-items-start" style={{ minHeight: 'calc(100vh - 220px)' }}>
                        <div className="d-flex flex-column align-items-center">

                            {/* Start */}
                            <div className="rounded-pill bg-success bg-opacity-10 text-success px-4 py-1 fw-semibold">Inicio</div>
                            <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                            {/* Initial Greeting (client) */}
                            <div className="rounded bg-primary bg-opacity-10 text-primary px-2 py-1 fw-semibold">Saludo inicial (cliente)</div>
                            <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                            <div className="rounded bg-primary bg-opacity-10 text-primary px-2 py-1 fw-semibold">
                                <span className='d-block'>Mensaje inicial (Bot)</span>
                                <small className='d-block border-bottom fw-normal cursor-pointer text-center mx-auto' style={{ width: 'max-content' }}>
                                    <i className='mdi mdi-chat me-1'></i><span>Mensaje inicial</span>
                                </small>
                            </div>
                            <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                            {/* Data Collection (bot) */}
                            <div className="rounded bg-white border text-primary px-2 py-1 fw-semibold">
                                <div className='mb-1 text-center'>
                                    <i className="mdi mdi-star-four-points me-1"></i>
                                    <span>Recolección de datos (bot)</span>
                                </div>
                                <div className="d-flex flex-wrap justify-content-center text-default gap-2" style={{ maxWidth: '200px' }}>
                                    <small className='border-bottom fw-normal cursor-pointer'>
                                        <i className='mdi mdi-key me-1'></i><span>API Key</span>
                                    </small>
                                    <small className='border-bottom fw-normal cursor-pointer'>
                                        <i className='mdi mdi-pencil me-1'></i><span>Personalidad</span>
                                    </small>
                                </div>
                            </div>
                            <i className="d-block mdi mdi-pan-down text-secondary opacity-50 mb-2" style={{ fontSize: '24px' }}></i>

                            {/* Add Item Buttons */}
                            <div className="dropdown mb-3">
                                <button
                                    className="btn btn-sm btn-outline-primary dropdown-toggle"
                                    type="button"
                                    id="addItemDropdown"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="mdi mdi-plus me-1"></i>Agregar
                                </button>
                                <ul className="dropdown-menu" aria-labelledby="addItemDropdown">
                                    <li>
                                        <button className="dropdown-item" onClick={() => addItem('form')}>
                                            <i className="mdi mdi-form-select me-1"></i>Agregar Formulario
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => addItem('message')}>
                                            <i className="mdi mdi-message me-1"></i>Agregar Mensaje
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => addItem('file')}>
                                            <i className="mdi mdi-file me-1"></i>Agregar Archivo
                                        </button>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={() => addItem('products')}>
                                            <i className="mdi mdi-package me-1"></i>Agregar Productos
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Items List */}
                            <div className="w-100" style={{ minWidth: '480px' }}>
                                {items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => handleItemDragStart(idx)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleItemDrop(e, idx)}
                                        className="border rounded mb-2 shadow-sm bg-white transition-all hover:shadow"
                                    >
                                        <div
                                            className="d-flex align-items-center justify-content-between p-2 bg-gradient-to-r from-gray-50 to-white rounded-top cursor-pointer"
                                            onClick={() => setActiveItemId(activeItemId === item.id ? null : item.id)}
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="mdi mdi-drag text-gray-400"></i>
                                                <span className="fw-semibold text-gray-700">{`${idx + 1}. ${item.title}`}</span>
                                                <span className="badge bg-soft-secondary text-secondary ms-2">
                                                    {item.type === 'form' ? (item.questions?.length || 0) :
                                                        item.type === 'message' || item.type === 'default_message' ? 'Mensaje' :
                                                            item.type === 'file' || item.type === 'repository' ? 'Archivo' :
                                                                item.type === 'products' || item.type === 'product' ? 'Productos' : ''}
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`mdi ${activeItemId === item.id ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-muted`}></i>
                                                <button
                                                    className="btn btn-xs btn-outline-danger border-0 rounded-pill"
                                                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                                    title="Eliminar"
                                                >
                                                    <i className="mdi mdi-trash-can"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {activeItemId === item.id && item.type === 'form' && (
                                            <div className="p-2 bg-gray-50 rounded-bottom">
                                                {/* Questions list with CRUD & drag-drop inside this form item */}
                                                {item.questions?.map((q, qIdx) => (
                                                    <div
                                                        key={q.id}
                                                        draggable
                                                        onDragStart={() => handleDragStart(item.id, qIdx)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, item.id, qIdx)}
                                                        onDoubleClick={() => editingQuestionId !== q.id && startEditQuestion(q.id, q.text, q.closed, q.answers)}
                                                        className="d-flex align-items-center rounded bg-white border p-2 mb-2 shadow-xs cursor-grab active:cursor-grabbing transition-transform hover:scale-[1.01]"
                                                    >
                                                        <i className="mdi mdi-drag mt-1 me-3 text-gray-400"></i>
                                                        {editingQuestionId === q.id ? (
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex gap-1 mb-2">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={editText}
                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditQuestion()}
                                                                        placeholder="Texto de la pregunta"
                                                                    />
                                                                    <button className="btn btn-xs btn-outline-success" onClick={saveEditQuestion}>
                                                                        <i className="mdi mdi-check"></i>
                                                                    </button>
                                                                    <button className="btn btn-xs btn-outline-secondary" onClick={cancelEditQuestion}>
                                                                        <i className="mdi mdi-close"></i>
                                                                    </button>
                                                                </div>
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`edit-closed-${q.id}`}
                                                                        checked={editClosed}
                                                                        onChange={(e) => setEditClosed(e.target.checked)}
                                                                    />
                                                                    <label className="form-check-label small fw-medium" htmlFor={`edit-closed-${q.id}`}>
                                                                        Pregunta cerrada (con opciones)
                                                                    </label>
                                                                </div>
                                                                {editClosed && (
                                                                    <div className="mb-0 mt-2">
                                                                        {editAnswers.map((ans, aIdx) => (
                                                                            <div key={aIdx} className="d-flex gap-1 mb-1">
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control form-control-sm"
                                                                                    value={ans}
                                                                                    onChange={(e) => updateEditAnswer(aIdx, e.target.value)}
                                                                                    placeholder={`Opción ${aIdx + 1}`}
                                                                                />
                                                                                <button className="btn btn-xs btn-outline-danger" onClick={() => removeEditAnswerField(aIdx)}>
                                                                                    <i className="mdi mdi-trash-can"></i>
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        <button className="btn btn-xs btn-outline-primary" onClick={addEditAnswerField}>
                                                                            <i className="mdi mdi-plus me-1"></i>Agregar opción
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex-grow-1">
                                                                <div className="fw-semibold text-gray-700">{q.text}</div>
                                                                {q.closed && q.answers && (
                                                                    <small className="text-muted">Opciones: {q.answers.join(', ')}</small>
                                                                )}
                                                            </div>
                                                        )}
                                                        {editingQuestionId !== q.id && (
                                                            <button
                                                                className="btn btn-xs btn-outline-danger border-0 rounded-pill ms-auto"
                                                                onClick={() => deleteQuestion(item.id, q.id)}
                                                                title="Eliminar"
                                                            >
                                                                <i className="mdi mdi-trash-can"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Add new question */}
                                                <div className="rounded bg-white border p-2 shadow-xs">
                                                    <div className="d-flex gap-1 mb-2">
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={newQuestionText}
                                                            onChange={(e) => setNewQuestionText(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && addQuestion(item.id)}
                                                            placeholder="Nueva pregunta"
                                                        />
                                                        <button className="btn btn-xs btn-outline-success" onClick={() => addQuestion(item.id)}>
                                                            <i className="mdi mdi-check"></i>
                                                        </button>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`new-closed-${item.id}`}
                                                            checked={newQuestionClosed}
                                                            onChange={(e) => setNewQuestionClosed(e.target.checked)}
                                                        />
                                                        <label className="form-check-label small fw-medium" htmlFor={`new-closed-${item.id}`}>
                                                            Pregunta cerrada (con opciones)
                                                        </label>
                                                    </div>
                                                    {newQuestionClosed && (
                                                        <div className="mb-0 mt-2">
                                                            {newAnswers.map((ans, aIdx) => (
                                                                <div key={aIdx} className="d-flex gap-1 mb-1">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={ans}
                                                                        onChange={(e) => updateNewAnswer(aIdx, e.target.value)}
                                                                        placeholder={`Opción ${aIdx + 1}`}
                                                                    />
                                                                    <button className="btn btn-xs btn-outline-danger" onClick={() => removeNewAnswerField(aIdx)}>
                                                                        <i className="mdi mdi-trash-can"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button className="btn btn-xs btn-outline-primary" onClick={addNewAnswerField}>
                                                                <i className="mdi mdi-plus me-1"></i>Agregar opción
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal modalRef={modalRef} isOpen={modalOpen} onClose={closeModal} title={modalTitle} hideFooter>
                {modalType === 'form' && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Título del formulario</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Ej. FORMULARIO DE RESERVA"
                            />
                        </div>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-semibold mb-0">Preguntas</label>
                                <button className="btn btn-sm btn-outline-primary" onClick={addFormQuestion} type='button'>
                                    <i className="mdi mdi-plus me-1"></i>Agregar pregunta
                                </button>
                            </div>
                            {formQuestions.map((q, qIdx) => (
                                <div key={q.id} className="border rounded p-2 mb-2 bg-light">
                                    <div className="d-flex gap-1 mb-2">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={q.text}
                                            onChange={(e) => updateFormQuestion(qIdx, 'text', e.target.value)}
                                            placeholder="Texto de la pregunta"
                                        />
                                        <button className="btn btn-xs btn-outline-danger" onClick={() => removeFormQuestion(qIdx)}>
                                            <i className="mdi mdi-trash-can"></i>
                                        </button>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={q.closed}
                                            onChange={(e) => updateFormQuestion(qIdx, 'closed', e.target.checked)}
                                        />
                                        <label className="form-check-label small fw-medium">Pregunta cerrada (con opciones)</label>
                                    </div>
                                    {q.closed && (
                                        <div className="mt-2">
                                            {q.answers.map((ans, aIdx) => (
                                                <div key={aIdx} className="d-flex gap-1 mb-1">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={ans}
                                                        onChange={(e) => updateFormQuestionAnswer(qIdx, aIdx, e.target.value)}
                                                        placeholder={`Opción ${aIdx + 1}`}
                                                    />
                                                    <button className="btn btn-xs btn-outline-danger" onClick={() => {
                                                        const updated = [...formQuestions];
                                                        updated[qIdx].answers.splice(aIdx, 1);
                                                        setFormQuestions(updated);
                                                    }}>
                                                        <i className="mdi mdi-trash-can"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            <button className="btn btn-xs btn-outline-primary" onClick={() => addFormQuestionAnswer(qIdx)}>
                                                <i className="mdi mdi-plus me-1"></i>Agregar opción
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-success" onClick={handleModalSave}>Guardar Formulario</button>
                        </div>
                    </div>
                )}

                {modalType === 'message' && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Seleccione un mensaje predeterminado</label>
                            {presetMessages.map((msg) => (
                                <div key={msg.id} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="presetMessage"
                                        id={`msg-${msg.id}`}
                                        checked={modalData?.id === msg.id}
                                        onChange={() => setModalData(msg)}
                                    />
                                    <label className="form-check-label" htmlFor={`msg-${msg.id}`}>
                                        {msg.title}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-success" onClick={handleModalSave}>Guardar</button>
                        </div>
                    </div>
                )}

                {modalType === 'file' && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Seleccione un archivo del repositorio</label>
                            {repoFiles.map((file) => (
                                <div key={file.id} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="repoFile"
                                        id={`file-${file.id}`}
                                        checked={modalData?.id === file.id}
                                        onChange={() => setModalData(file)}
                                    />
                                    <label className="form-check-label" htmlFor={`file-${file.id}`}>
                                        {file.title}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-success" onClick={handleModalSave}>Guardar</button>
                        </div>
                    </div>
                )}

                {modalType === 'products' && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Seleccione una lista de productos</label>
                            {products.map((prod) => (
                                <div key={prod.id} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="products"
                                        id={`prod-${prod.id}`}
                                        checked={modalData?.id === prod.id}
                                        onChange={() => setModalData(prod)}
                                    />
                                    <label className="form-check-label" htmlFor={`prod-${prod.id}`}>
                                        {prod.title}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-success" onClick={handleModalSave}>Guardar</button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default FlowContainer;
