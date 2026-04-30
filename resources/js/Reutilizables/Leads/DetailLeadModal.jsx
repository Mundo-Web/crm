import React from "react";
import Modal from "../../components/Modal";
import LeadDetailContent from "./LeadDetailContent";

const DetailLeadModal = ({
    modalRef,
    lead,
    statuses = [],
    manageStatuses = [],
    noteTypes = [],
    users = [],
    processes = [],
    session = {},
    onLeadUpdate = () => { },
    onOpenEditModal = () => { },
    convertedLeadStatus,
    defaultClientStatus,
    defaultMessages = [],
    signs = [],
    projectTypes = []
}) => {
    if (!lead) return null;

    return (
        <Modal
            modalRef={modalRef}
            title="Detalles del lead"
            btnSubmitText="Guardar"
            size="full-width"
            bodyClass="p-3 bg-light"
            isStatic
            hideSubmit
            onSubmit={(e) => e.preventDefault()}
            zIndex={1042}
        >
            <LeadDetailContent
                lead={lead}
                statuses={statuses}
                manageStatuses={manageStatuses}
                noteTypes={noteTypes}
                users={users}
                processes={processes}
                session={session}
                onLeadUpdate={onLeadUpdate}
                onOpenEditModal={onOpenEditModal}
                convertedLeadStatus={convertedLeadStatus}
                defaultClientStatus={defaultClientStatus}
                defaultMessages={defaultMessages}
                signs={signs}
                projectTypes={projectTypes}
            />
        </Modal>
    );
};

export default DetailLeadModal;
