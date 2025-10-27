import Global from "../../Utils/Global";

const ChatHeader = ({ contact, contactDetails, setContactDetails, loading, theme }) => {
    return <div
        className={`card-header ${theme == 'light' ? 'bg-white' : 'bg-light'}`}
        style={{ cursor: 'pointer' }}
        onClick={() => contact?.id && setContactDetails(contactDetails ? null : contact)}
    >
        <div className="d-flex align-items-center">
            {/* Avatar */}
            {!loading && contact && (
                <img
                    src={`/api/whatsapp/profile/${contact.contact_phone}`}
                    className="rounded-circle avatar-sm bg-light me-2"
                    alt={contact.contact_name}
                    style={{ padding: 0, border: 'none' }}
                    onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                />
            )}
            {loading && (
                <div className="placeholder-glow">
                    <div className="rounded-circle avatar-sm me-2 placeholder" style={{ width: 36, height: 36 }} />
                </div>
            )}

            <div className={`flex-grow-1 ${loading ? 'placeholder-glow' : ''}`}>
                <h5 className={`mt-0 mb-1 text-truncate ${loading ? 'placeholder col-3' : ''}`}>
                    {contact?.contact_name}
                </h5>
                <p className={`d-block font-13 text-muted mb-0 ${loading ? 'placeholder col-2' : ''}`}>
                    <i className="mdi mdi-phone me-1 font-11"></i>
                    {contact?.contact_phone}
                </p>
            </div>

            {/* Arrow icon */}
            {!loading && contact && (
                <div className="ms-2">
                    <i className={`mdi mdi-24px mdi-chevron-double-${contactDetails ? 'right' : 'left'} text-muted`} />
                </div>
            )}
        </div>
    </div>
}

export default ChatHeader