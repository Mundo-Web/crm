import { useCallback, useEffect, useState } from 'react';
import SettingsRest from '../../actions/SettingsRest';
import areArraySame from '../../Utils/areArraySame';

const settingsRest = new SettingsRest()

const FlowContainer = ({ questions: questionsDB, isOpen, setIsOpen, onModalOpen }) => {
    // questionsDB is now expected to be an array of forms: [{id, title, questions:[{id,text,closed?,answers?}]}]
    const [forms, setForms] = useState(questionsDB);
    const [savedForms, setSavedForms] = useState(questionsDB)

    // UI states
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editText, setEditText] = useState('');
    const [newFormTitle, setNewFormTitle] = useState('');
    const [newQuestionText, setNewQuestionText] = useState('');
    const [activeFormId, setActiveFormId] = useState(null);
    const [newQuestionClosed, setNewQuestionClosed] = useState(false);
    const [newAnswers, setNewAnswers] = useState(['']);
    const [editClosed, setEditClosed] = useState(false);
    const [editAnswers, setEditAnswers] = useState(['']);

    // --- Form CRUD ---
    const addForm = () => {
        if (!newFormTitle.trim()) return;
        const newForm = {
            id: Date.now(),
            title: newFormTitle.trim(),
            questions: []
        };
        setForms([...forms, newForm]);
        setNewFormTitle('');
    };

    const deleteForm = (formId) => {
        setForms(forms.filter(f => f.id !== formId));
    };

    // --- Question CRUD inside a form ---
    const addQuestion = (formId) => {
        if (!newQuestionText.trim()) return;
        const answers = newQuestionClosed ? newAnswers.filter(a => a.trim()) : null;
        if (newQuestionClosed && answers.length === 0) return;
        setForms(forms.map(f =>
            f.id === formId
                ? { ...f, questions: [...f.questions, { id: Date.now(), text: newQuestionText.trim(), closed: newQuestionClosed, answers }] }
                : f
        ));
        setNewQuestionText('');
        setNewQuestionClosed(false);
        setNewAnswers(['']);
    };

    const deleteQuestion = (formId, questionId) => {
        setForms(forms.map(f =>
            f.id === formId
                ? { ...f, questions: f.questions.filter(q => q.id !== questionId) }
                : f
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
        setForms(forms.map(f => ({
            ...f,
            questions: f.questions.map(q =>
                q.id === editingQuestionId ? { ...q, text: editText, closed: editClosed, answers } : q
            )
        })));
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

    // --- Drag & Drop for questions inside the same form ---
    const handleDragStart = (formId, qIndex) => {
        setDraggedIndex({ formId, qIndex });
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e, formId, dropIndex) => {
        e.preventDefault();
        if (!draggedIndex || draggedIndex.formId !== formId || draggedIndex.qIndex === dropIndex) return;

        setForms(forms.map(f => {
            if (f.id !== formId) return f;
            const reordered = [...f.questions];
            const [draggedItem] = reordered.splice(draggedIndex.qIndex, 1);
            reordered.splice(dropIndex, 0, draggedItem);
            return { ...f, questions: reordered };
        }));
        setDraggedIndex(null);
    };

    // --- Drag & Drop for forms ---
    const handleFormDragStart = (index) => {
        setDraggedIndex({ type: 'form', index });
    };

    const handleFormDrop = (e, dropIndex) => {
        e.preventDefault();
        if (!draggedIndex || draggedIndex.type !== 'form' || draggedIndex.index === dropIndex) return;

        const reordered = [...forms];
        const [draggedItem] = reordered.splice(draggedIndex.index, 1);
        reordered.splice(dropIndex, 0, draggedItem);
        setForms(reordered);
        setDraggedIndex(null);
    };

    // --- Persist ---
    const saveForms = useCallback(async () => {
        const result = await settingsRest.save({
            type: 'json',
            name: 'gemini-extra-questions',
            value: JSON.stringify(forms)
        });
        if (!result) return;
        setSavedForms(forms);
    }, [forms]);

    useEffect(() => {
        if (!isOpen) return;
        if (areArraySame(forms, savedForms)) return;
        saveForms();
    }, [isOpen, forms, savedForms, saveForms]);

    return (
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
                            <small className='d-block border-bottom fw-normal cursor-pointer text-center' style={{width: 'max-content'}} onClick={(e) => onModalOpen(e, 'gemini-first-message', 'Mensaje inicial', 'text', 'Hola soy boti, me permites tus datos personales')}>
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
                                <small className='border-bottom fw-normal cursor-pointer' onClick={(e) => onModalOpen(e, 'gemini-api-key', 'API Key - Gemini', 'text')}>
                                    <i className='mdi mdi-key me-1'></i><span>API Key</span>
                                </small>
                                <small className='border-bottom fw-normal cursor-pointer' onClick={(e) => onModalOpen(e, 'gemini-personality', 'Personalidad - Gemini', 'text', 'Ej. Sé claro y respetuoso.')}>
                                    <i className='mdi mdi-pencil me-1'></i><span>Personalidad</span>
                                </small>

                            </div>
                        </div>
                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50 mb-2" style={{ fontSize: '24px' }}></i>

                        {/* Forms & Questions */}
                        <div className="w-100" style={{ minWidth: '480px' }}>
                            {/* Draggable forms list */}
                            {forms.map((form, idx) => (
                                <div
                                    key={form.id}
                                    draggable
                                    onDragStart={() => handleFormDragStart(idx)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleFormDrop(e, idx)}
                                    className="border rounded mb-2 shadow-sm bg-white transition-all hover:shadow"
                                >
                                    <div
                                        className="d-flex align-items-center justify-content-between p-2 bg-gradient-to-r from-gray-50 to-white rounded-top cursor-pointer"
                                        onClick={() => setActiveFormId(activeFormId === form.id ? null : form.id)}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="mdi mdi-drag text-gray-400"></i>
                                            <span className="fw-semibold text-gray-700">{`${idx + 1}. ${form.title}`}</span>
                                            <span className="badge bg-soft-secondary text-secondary ms-2">{form.questions?.length || 0}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <i className={`mdi ${activeFormId === form.id ? 'mdi-chevron-up' : 'mdi-chevron-down'} text-muted`}></i>
                                            <button
                                                className="btn btn-xs btn-outline-danger border-0 rounded-pill"
                                                onClick={(e) => { e.stopPropagation(); deleteForm(form.id); }}
                                                title="Eliminar formulario"
                                            >
                                                <i className="mdi mdi-trash-can"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {activeFormId === form.id && (
                                        <div className="p-2 bg-gray-50 rounded-bottom">
                                            {/* Questions list with CRUD & drag-drop inside this form */}
                                            {form.questions?.map((q, qIdx) => (
                                                <div
                                                    key={q.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(form.id, qIdx)}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, form.id, qIdx)}
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
                                                                    <label className="form-label small fw-semibold mb-2 text-gray-600">Posibles respuestas:</label>
                                                                    {editAnswers.map((ans, i) => (
                                                                        <div key={i} className="input-group input-group-sm mb-2">
                                                                            <input
                                                                                type="text"
                                                                                className="form-control rounded-start-pill"
                                                                                value={ans}
                                                                                onChange={(e) => updateEditAnswer(i, e.target.value)}
                                                                                placeholder="Respuesta"
                                                                            />
                                                                            <button className="btn btn-outline-danger rounded-end-pill" onClick={() => removeEditAnswerField(i)}>
                                                                                <i className="mdi mdi-minus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={addEditAnswerField}>
                                                                        <i className="mdi mdi-plus"></i> Añadir respuesta
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex-grow-1">
                                                                <div className="small text-gray-800 fw-medium">{q.text}</div>
                                                                {q.closed && (
                                                                    <div className="mt-0">
                                                                        <span className="badge bg-soft-primary text-primary small">Cerrada</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="d-flex gap-1">
                                                                <button
                                                                    className="btn btn-xs btn-outline-primary"
                                                                    onClick={() => startEditQuestion(q.id, q.text, q.closed, q.answers)}
                                                                    title="Editar"
                                                                >
                                                                    <i className="mdi mdi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-xs btn-outline-danger"
                                                                    onClick={() => deleteQuestion(form.id, q.id)}
                                                                    title="Eliminar"
                                                                >
                                                                    <i className="mdi mdi-trash-can"></i>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add new question to this form */}
                                            <div className="bg-white rounded border-dashed border-2 border-gray-300">
                                                <label className="form-label small fw-semibold text-gray-600 mb-2">Nueva pregunta</label>
                                                <div className="input-group input-group-sm">
                                                    <input
                                                        type="text"
                                                        className="form-control rounded-start-pill"
                                                        placeholder="Escribe la pregunta"
                                                        value={newQuestionText}
                                                        onChange={(e) => setNewQuestionText(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addQuestion(form.id)}
                                                    />
                                                    <button className="btn btn-sm btn-primary rounded-end-pill" onClick={() => addQuestion(form.id)}>
                                                        <i className="mdi mdi-plus"></i> Añadir
                                                    </button>
                                                </div>
                                                <div className="form-check mt-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`new-closed-${form.id}`}
                                                        checked={newQuestionClosed}
                                                        onChange={(e) => setNewQuestionClosed(e.target.checked)}
                                                    />
                                                    <label className="form-check-label small fw-medium" htmlFor={`new-closed-${form.id}`}>
                                                        Pregunta cerrada (con opciones)
                                                    </label>
                                                </div>
                                                {newQuestionClosed && (
                                                    <div className="mt-2">
                                                        <label className="form-label small fw-semibold mb-2 text-gray-600">Posibles respuestas:</label>
                                                        {newAnswers.map((ans, i) => (
                                                            <div key={i} className="input-group input-group-sm mb-2">
                                                                <input
                                                                    type="text"
                                                                    className="form-control rounded-start-pill"
                                                                    value={ans}
                                                                    onChange={(e) => updateNewAnswer(i, e.target.value)}
                                                                    placeholder="Respuesta"
                                                                />
                                                                <button className="btn btn-outline-danger rounded-end-pill" onClick={() => removeNewAnswerField(i)}>
                                                                    <i className="mdi mdi-minus"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={addNewAnswerField}>
                                                            <i className="mdi mdi-plus"></i> Añadir respuesta
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add new form */}
                            <div className="bg-white rounded border-dashed border-2 border-gray-300">
                                <label className="form-label small fw-semibold text-gray-600 mb-2">Nuevo formulario</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="text"
                                        className="form-control rounded-start-pill"
                                        placeholder="Título del nuevo formulario"
                                        value={newFormTitle}
                                        onChange={(e) => setNewFormTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addForm()}
                                    />
                                    <button className="btn btn-sm btn-primary rounded-end-pill" onClick={addForm}>
                                        <i className="mdi mdi-plus"></i> Crear
                                    </button>
                                </div>
                            </div>
                        </div>
                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                        {/* Final Greeting (assistant) */}
                        <div className="rounded bg-primary bg-opacity-10 text-primary text-center px-2 py-1 fw-semibold cursor-pointer" onClick={(e) => onModalOpen(e, 'whatsapp-new-lead-notification-message-client', 'Notificacion al lead', 'simpleHTML')}>
                            <i className="mdi mdi-message-text-outline me-1"></i> Saludo final (asistente)
                        </div>
                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                        {/* End */}
                        <div className="rounded-pill bg-danger bg-opacity-10 text-danger px-4 py-1 fw-semibold">Fin</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlowContainer
