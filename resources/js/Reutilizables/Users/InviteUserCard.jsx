import React, { useState } from "react"
import Global from "../../Utils/Global"
import AtalayaUsersRest from "../../actions/Atalaya/UsersRest"
import Tippy from "@tippyjs/react"
import { toast } from "sonner"

const atalayaUsersRest = new AtalayaUsersRest()

const InviteUserCard = ({ relative_id, fullname, email, match, setUsers, setInvitations }) => {
    const [inviting, setInviting] = useState(false)
    const [invited, setInvited] = useState(false)

    const onInviteClicked = async () => {
        setInviting(true)
        const { status, message, data, summary } = await atalayaUsersRest.invite({ match, email })
        setInviting(false)
        if (!status) return toast(message ?? 'Ocurrió un error inesperado', { icon: <i className='mdi mdi-alert text-danger' /> })
        setInvited(true)
        console.log(summary)
        if (summary?.external) setInvitations(old => {
            const exists = old.some(inv => inv.email === data.email);
            if (exists) {
                return old.map(inv => inv.email === data.email ? data : inv);
            } else {
                return [...old, data];
            }
        })
        else setUsers(users => [...users, data])
    }

    const OptionalTippy = (children) => relative_id ? <>{children}</> : <Tippy content='Invitar usuario a Atalaya'>{children}</Tippy>

    return <div className="card border mb-0">
        <div className="card-body p-2 d-flex align-items-center gap-2">
            <img
                src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${relative_id}`}
                className="rounded-circle"
                alt={fullname}
                width="40"
                height="40"
            />
            <div className="flex-grow-1">
                <h5 className="mt-0 mb-1">{fullname}</h5>
                <div className="text-muted">{email}</div>
            </div>
            {
                OptionalTippy(<button className="btn btn-white btn-sm rounded-pill" onClick={() => onInviteClicked()} disabled={inviting || invited}>
                    {
                        inviting ? (
                            <i className="mdi mdi-loading mdi-spin" />
                        ) : invited ? (
                            <i className="mdi mdi-email-check" />
                        ) : (
                            <i className={`mdi ${relative_id ? 'mdi-account-plus' : 'mdi mdi-email-send'}`} />
                        )
                    }
                </button>)
            }
        </div>
    </div>
}

export default InviteUserCard