import Tippy from "@tippyjs/react"
import Modal from "../../components/Modal"
import SimpleEmailRow from "./SimpleEmailRow"

const InvitationsModal = ({ modalRef, invitations, setInvitations, match }) => {
  return (
    <Modal modalRef={modalRef} title='Invitaciones externas' hideFooter onSubmit={e => e.preventDefault()} size='lg' >
      <div style={{ minHeight: '360px' }}>
        <table className='table table-sm mb-0'>
          <thead className='table-light'>
            <tr>
              <th>Correo</th>
              <th>Primer envío</th>
              <th>Último envío</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {
              invitations.map((invitation, i) => <SimpleEmailRow key={i} {...invitation} setInvitations={setInvitations} match={match} />)
            }
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

export default InvitationsModal

