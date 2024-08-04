import React from "react";
import UsersByProjectsRest from "../../actions/UsersByProjectsRest";
import Tippy from "@tippyjs/react";
import { renderToString } from "react-dom/server";

const Assigneds = (relatives) => {
    return (
      <div className='avatar-group m-0'>
        {
          relatives.map(relative_id => <Tippy key={`user-${relative_id}`} content="Cargando..." allowHTML={true} onShow={async (instance) => {
            const user = await UsersByProjectsRest.getUser(relative_id)
            const userDate = moment(user.created_at)
            const now = moment()
            const diffHours = now.diff(userDate, 'hours')
            const time = diffHours > 12 ? userDate.format('lll') : userDate.fromNow()

            $(instance.popper).find('.tippy-content').addClass('p-0')
            instance.setContent(renderToString(<div className="card mb-0" style={{
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.25)'
            }}>
              <div className="card-body widget-user p-2">
                <div className="d-flex align-items-center">
                  <div className="avatar-lg me-3 flex-shrink-0">
                    <img src={`/api/profile/thumbnail/${relative_id}`} className="img-fluid rounded-circle" alt="user" />
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <h5 className="text-blue mt-0 mb-1"> {user.name} {user.lastname}</h5>
                    <p className="text-dark mb-1 font-13 text-truncate">{user.email}</p>
                    <small className='text-muted'>Asignado: <b>{time}</b></small>
                  </div>
                </div>
              </div>
            </div>))
          }}>
            <img
              className='avatar-group-item avatar-xs rounded-circle mb-0'
              src={`/api/profile/thumbnail/${relative_id}`}
              style={{ backdropFilter: 'blur(40px)', marginRight: '6px' }}
            />
          </Tippy>)
        }
      </div>
    )
}

export default Assigneds;