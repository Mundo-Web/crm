import React from "react"

const NotificationItem = ({ id, name, message, description, created_at, link_to, creator, icon, APP_DOMAIN }) => {
  return <>
    <a href={`${link_to}#${id}` || '#'} className="dropdown-item notify-item">
      <div className={`notify-icon ${!creator ? 'bg-primary' : ''}`}>
        {
          creator
            ? <div className="position-relative">
              <img src={`//${APP_DOMAIN}/api/profile/${creator.relative_id}`} className="img-fluid rounded-circle" alt={creator.fullname} />
              <span className="position-absolute top-100 translate-middle badge rounded-pill bg-success text-sm">
                <small className={icon}></small>
              </span>
            </div>
            : <i className={icon}></i>
        }

      </div>
      <p className="notify-details mb-0">{name}</p>
      <p className={`text-muted mb-1 user-msg`}>
        {message}
      </p>
      {description && <p className="notify-details mb-1 border py-1 px-2" style={{ borderRadius: '4px', textWrap: 'wrap', maxHeight: '48px', overflow: 'hidden', lineClamp: 2, textOverflow: 'ellipsis', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
        <small>{description}</small>
      </p>}
      <p className="text-muted mb-0 user-msg">
        <small>{moment(created_at).format('LLL')}</small>
      </p>
    </a>
  </>
}

export default NotificationItem