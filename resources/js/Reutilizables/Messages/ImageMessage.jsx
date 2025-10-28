import React, { useState, useRef } from "react";
import HtmlContent from "../../Utils/HtmlContent";
import wa2html from "../../Utils/wa2html";

const ImageMessage = ({ fromMe, theme, url, time, caption }) => {
    const [showModal, setShowModal] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);

    const openModal = () => setShowModal(true);
    const closeModal = () => {
        setShowModal(false);
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const handleMouseMove = (e) => {
        if (scale > 1) {
            const rect = imgRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setPosition({ x, y });
        }
    };

    return (
        <>
            <div
                className={`ctext-wrap d-flex align-items-start ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`}
                style={{
                    minWidth: '240px',
                    maxWidth: '320px',
                    padding: '3px',
                    boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px'
                }}
            >
                <div className="flex-grow-1 position-relative">
                    <img
                        src={url}
                        alt="imagen"
                        onClick={openModal}
                        style={{
                            width: '100%',
                            borderRadius: '6px',
                            cursor: 'zoom-in'
                        }}
                        onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/image-404.svg`; }}
                    />
                    {
                        !caption && <span className="position-absolute time" style={{ 
                            fontSize: '10px', 
                            right: '6px', bottom: '2px', 
                            textShadow: '0 0 5px rgba(0,0,0,1)' ,
                            color: theme != 'dark' ? '#fafafa' : undefined
                        
                        }}>{time}</span>
                    }
                    {caption?.trim() && <div style={{padding: '3px 5px', marginTop: '6px'}}>
                        <HtmlContent className="text-start font-14" html={wa2html(caption + `<span class="time mt-0 float-end" style="font-size: 10px; margin-left: 6px; margin-top: 8px !important">${time}</span>`)} />
                    </div>
                    }

                </div>
            </div>

            {showModal && (
                <div
                    onClick={closeModal}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        zIndex: 1002,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out'
                    }}
                >
                    <img
                        ref={imgRef}
                        src={url}
                        alt="imagen ampliada"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={handleWheel}
                        onMouseMove={handleMouseMove}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            transform: `scale(${scale}) translate(${position.x}%, ${position.y}%)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease',
                            cursor: 'grab'
                        }}
                        draggable={false}
                    />
                </div>
            )}
        </>
    );
};

export default ImageMessage;
