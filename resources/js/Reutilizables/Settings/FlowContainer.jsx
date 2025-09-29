import { useEffect, useState } from 'react';

const FlowContainer = ({ isOpen, setIsOpen }) => {
    const [questions, setQuestions] = useState([
        { id: 1, text: '¿Cuál es tu nombre?' },
        { id: 2, text: 'Correo electrónico' },
        { id: 3, text: 'Teléfono' },
        { id: 4, text: '¿Cómo supiste de nosotros?' }
    ]);
    const [newQuestion, setNewQuestion] = useState('');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    const handleAddQuestion = () => {
        if (newQuestion.trim()) {
            setQuestions([...questions, { id: Date.now(), text: newQuestion.trim() }]);
            setNewQuestion('');
        }
    };

    const handleDeleteQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleEditQuestion = (id, text) => {
        setEditingId(id);
        setEditText(text);
    };

    const handleSaveEdit = () => {
        setQuestions(questions.map(q => q.id === editingId ? { ...q, text: editText } : q));
        setEditingId(null);
        setEditText('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const reordered = [...questions];
        const draggedItem = reordered[draggedIndex];
        reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);
        setQuestions(reordered);
        setDraggedIndex(null);
    };

    useEffect(() => {
        if (!isOpen) return;
        console.log(questions)
    }, [isOpen, questions])

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
                        <div className="rounded-pill bg-success bg-opacity-10 text-success px-4 py-1 fw-semibold">
                            Inicio
                        </div>
                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                        {/* Initial Greeting (client) */}
                        <div className="rounded bg-primary bg-opacity-10 text-primary px-4 py-1 fw-semibold">
                            Saludo inicial (cliente)
                        </div>

                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                        {/* Data Collection (bot) */}
                        <div className="rounded bg-primary bg-opacity-10 text-primary px-4 py-1 fw-semibold">
                            Recolección de datos (bot)
                        </div>

                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50 mb-2" style={{ fontSize: '24px' }}></i>

                        {/* Questions list with full CRUD and drag-and-drop */}
                        <fieldset className="w-100 border rounded position-relative p-2" style={{ minWidth: '480px' }}>
                            <legend className="position-absolute top-0 start-50 translate-middle bg-white px-2 fw-semibold text-uppercase small text-muted mb-0" style={{ width: 'max-content' }}>Preguntas extra</legend>
                            {questions.map((q, idx) => (
                                <div
                                    key={q.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onDoubleClick={() => handleEditQuestion(q.id, q.text)}
                                    className="d-flex align-items-center rounded bg-light border px-2 py-2 mb-2 mt-0 cursor-move"
                                >
                                    <i className="mdi mdi-drag me-2 text-muted"></i>
                                    {editingId === q.id ? (
                                        <div className="flex-grow-1 d-flex gap-1">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            />
                                            <button className="btn btn-xs btn-outline-success " onClick={handleSaveEdit}>
                                                <i className="mdi mdi-check"></i>
                                            </button>
                                            <button className="btn btn-xs btn-outline-secondary " onClick={handleCancelEdit}>
                                                <i className="mdi mdi-close"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-grow-1">{q.text}</span>
                                            <button className="btn btn-xs btn-outline-primary ms-1" onClick={() => handleEditQuestion(q.id, q.text)}>
                                                <i className="mdi mdi-pencil"></i>
                                            </button>
                                            <button className="btn btn-xs btn-outline-danger ms-1" onClick={() => handleDeleteQuestion(q.id)}>
                                                <i className="mdi mdi-trash-can"></i>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                            {/* Add new question */}
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nueva pregunta"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                                />
                                <button className="btn btn-outline-primary" onClick={handleAddQuestion}>
                                    <i className="mdi mdi-plus"></i>
                                </button>
                            </div>
                        </fieldset>

                         <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                        {/* Final Greeting (assistant) */}
                        <div className="rounded bg-primary bg-opacity-10 text-primary px-4 py-1 fw-semibold">
                            Saludo final (asistente)
                        </div>
                        <i className="d-block mdi mdi-pan-down text-secondary opacity-50" style={{ fontSize: '24px' }}></i>

                        {/* End */}
                        <div className="rounded-pill bg-danger bg-opacity-10 text-danger px-4 py-1 fw-semibold">
                            Fin
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlowContainer