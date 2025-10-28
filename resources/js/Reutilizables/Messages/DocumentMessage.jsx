import React from "react";
import HtmlContent from "../../Utils/HtmlContent";
import wa2html from "../../Utils/wa2html";

const DocumentMessage = ({ fromMe, theme, url, time, mask, caption }) => {
    const fileName = mask || url?.split("/").pop();

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
    };

    return (
        <>
            <div
                className={`ctext-wrap d-flex align-items-start ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`}
                style={{
                    minWidth: '240px',
                    maxWidth: '320px',
                    padding: '8px',
                    boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px'
                }}
            >
                <div className="flex-grow-1 position-relative">
                    <div
                        className="d-flex align-items-center justify-content-end rounded gap-2"
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, .125)',
                            padding: '3px 6px',
                            cursor: 'pointer'
                        }}
                        onClick={handleDownload}
                    >
                        {/* Icono de documento */}
                        <div>
                            <i className="mdi mdi-file-document mdi-24px" />
                        </div>

                        {/* Nombre del archivo */}
                        <div className="flex-grow-1 text-truncate text-start">
                            <div className="font-14 text-truncate">{fileName}</div>
                        </div>

                        {/* Icono de descarga */}
                        <div>
                            <i className="mdi mdi-download mdi-24px"></i>
                        </div>
                    </div>

                    <HtmlContent className={`text-start font-14 ${caption && 'mt-1'}`} html={wa2html(caption + `<span class="time mt-0 float-end" style="font-size: 10px; margin-left: 6px; margin-top: 8px !important">${time}</span>`)} />
                </div>
            </div>
        </>
    );
};

export default DocumentMessage;
