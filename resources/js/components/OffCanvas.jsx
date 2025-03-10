import React, { useEffect, useRef, useState } from "react"
import MessagesRest from "../actions/MessagesRest"
import LaravelSession from "../Utils/LaravelSession"
import Global from "../Utils/Global"

const messagesRest = new MessagesRest()

const OffCanvas = ({ offCanvasRef, dataLoaded, setDataLoaded }) => {

  if (!offCanvasRef) offCanvasRef = useRef()

  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!dataLoaded?.contact_phone) return
    getMessages();
  }, [dataLoaded])

  const getMessages = async () => {
    const { data } = await messagesRest.paginate({
      isLoadingAll: true,
      filter: ['wa_id', 'contains', dataLoaded?.contact_phone],
      sort: [{
        selector: 'microtime',
        desc: true
      }]
    })
    setMessages((data ?? []).reverse())
  }

  useEffect(() => {
    offCanvasRef.current.addEventListener('hidden.bs.offcanvas', () => {
      setDataLoaded(null)
      setMessages([]);
    });
  }, [null]);

  return <form ref={offCanvasRef} className="offcanvas offcanvas-end" tabIndex="-1" aria-labelledby="offcanvasRightLabel" style={{
    visibility: 'hidden',
    width: '95%',
    maxWidth: '480px'
  }}
    aria-hidden="true">
    <div className="offcanvas-header">
      <h5 id="offcanvasRightLabel">Mensajes - {dataLoaded?.contact_name}</h5>
      <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>

    <div className="offcanvas-body">
      <ul className="conversation-list slimscroll w-100 align-items-bottom"
        data-simplebar>
        {
          messages.map((message, i) => {
            const content = message.message.replace(/\{\{.*?\}\}/gs, '')
            const fromMe = message.role !== 'Human'
            return <li key={i} className={message.role == 'Human' ? '' : 'odd'}>
              <div className="message-list">
                <div className="chat-avatar">
                  <img src={fromMe ? `//${Global.APP_DOMAIN}/api/profile/thumbnail/${LaravelSession.relative_id}` :`${Global.WA_URL}/api/profile/${LaravelSession.business_uuid}/${message.wa_id}`} alt="" />
                </div>
                <div className="conversation-text">
                  <div className="ctext-wrap">
                    {/* <span className="user-name">{message.role == 'Human' ? dataLoaded?.contact_name : ''}</span> */}
                    <p>
                      {content}
                    </p>
                  </div>
                  <span className="time">{moment(message.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
              </div>
            </li>
          })
        }
      </ul>
    </div>

    <div className="offcanvas-footer">
      <div className="form-group p-2">
        <div className="input-group">
          <input type="text" className="form-control" placeholder="Ingrese su mensaje aqui" required/>
          <button className="btn input-group-text btn-dark waves-effect waves-light" type="submit">
            <i className="mdi mdi-arrow-top-right"></i>
          </button>
        </div>
      </div>
    </div>
  </form>
}

export default OffCanvas