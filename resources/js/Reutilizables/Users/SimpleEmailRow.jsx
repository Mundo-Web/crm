import Tippy from "@tippyjs/react"
import { useState } from "react"
import { toast } from "sonner"
import AtalayaUsersRest from "../../actions/Atalaya/UsersRest"

const atalayaUsersRest = new AtalayaUsersRest()

const SimpleEmailRow = ({ id, email, created_at, updated_at, setInvitations, match }) => {
    const [sending, setSending] = useState(false)

    const onResendInvitation = async () => {
        setSending(true)
        const { status, message, data } = await atalayaUsersRest.invite({ match, email })
        setSending(false)
        if (!status) return toast(message ?? 'Ocurrió un error inesperado', { icon: <i className='mdi mdi-alert text-danger' /> })
        setInvitations(old => old.map(inv => inv.email === data.email ? data : inv))
    }

    const onDeleteInvitation = async () => {
        setSending(true)
        const { status, message } = await atalayaUsersRest.deleteInvitation(id)
        setSending(false)
        if (!status) return toast(message ?? 'Ocurrió un error inesperado', { icon: <i className='mdi mdi-alert text-danger' /> })
        setInvitations(old => old.filter(inv => inv.id !== id))
    }

    return <tr>
        <td valign="middle">{email}</td>
        <td valign="middle">{moment(created_at).subtract(5, 'hours').format('lll')}</td>
        <td valign="middle">{moment(updated_at).subtract(5, 'hours').format('lll')}</td>
        <td>
            <div className="d-flex gap-1">
                <Tippy content='Reenviar'>
                    <button className='btn btn-xs btn-white waves-effect' type="button" onClick={() => onResendInvitation(email)} disabled={sending}>
                        {sending
                            ? <i className="mdi mdi-loading mdi-spin" />
                            : <i className='mdi mdi-email-send text-primary'></i>}
                    </button>
                </Tippy>
                <Tippy content='Eliminar'>
                    <button className='btn btn-xs btn-white waves-effect' type="button" onClick={() => onDeleteInvitation()} disabled={sending}>
                        <i className='mdi mdi-delete text-danger'></i>
                    </button>
                </Tippy>
            </div>
        </td>

    </tr>
}

export default SimpleEmailRow
