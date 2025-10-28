import HtmlContent from "../../Utils/HtmlContent"
import wa2html from "../../Utils/wa2html"

const AnyMessage = ({fromMe, content, attachment, theme, time, campaign}) => {
    return <div className={`ctext-wrap ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`} style={{
        boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px',
        padding: '6px 8px'
    }}>
        {campaign && (
            <div className="rounded p-2 mb-2" style={{ backgroundColor: 'rgba(240, 240, 240, 0.125)', cursor: campaign.link ? 'pointer' : 'default', maxWidth: '240px' }}
                onClick={() => {
                    if (campaign.link) window.open(campaign.link, '_blank')
                }}>
                <div className="d-flex gap-1" style={{ maxWidth: '100%' }}>
                    <div className="fw-bold">{campaign.code}</div>
                    <div className="small text-truncate">{campaign.title}</div>
                </div>
                <small className="d-block text-truncate" style={{ maxWidth: 300 }}>{campaign.link}</small>
            </div>
        )}
        {attachment && (
            <>
                <img src={attachment.replace('/attachment:', '')} className="mb-1" alt="attachment"
                    style={{
                        minWidth: '300px',
                        width: '100%',
                        maxWidth: '100%',
                        minHeight: '200px',
                        maxHeight: '300px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                    }}
                    onError={e => {
                        const img = e.target
                        if (img && img.parentNode) {
                            img.style.display = 'none'
                        }
                    }} />
                <div className="d-flex justify-content-end">
                    <a className="btn btn-xs btn-light mb-1 text-nowrap d-flex text-end" href={attachment.replace('/attachment:', '')} target="_blank" rel="noreferrer" download>
                        <i className="mdi mdi-download me-1"></i>
                        <span>Descargar adjunto</span>
                    </a>
                </div>
                {
                    !content.trim() &&
                    <span className="time mt-0 float-end" style={{ fontSize: '10px', marginLeft: '6px', marginTop: '8px !important' }}>{time}</span>
                }
            </>
        )}
        {
            content.trim() &&
            <HtmlContent className="text-start font-14" html={wa2html(content + `<span class="time mt-0 float-end" style="font-size: 10px; margin-left: 6px; margin-top: 8px !important">${time}</span>`)} />
        }
    </div>
}

export default AnyMessage