import React from "react";
import { Fetch } from "sode-extend-react";
import AuthRest from "../../actions/AuthRest";

const BusinessCard = ({
    id,
    uuid,
    name,
    person,
    session,
    APP_PROTOCOL,
    APP_DOMAIN,
}) => {
    const clickable = id != session.business_id;

    const onBusinessClicked = async () => {
        const result = await AuthRest.activeService(uuid);
        if (!result) return;
        location.reload();
    };

    return (
        <span
            className="dropdown-item notify-item"
            style={{ cursor: clickable ? "pointer" : "default" }}
            onClick={onBusinessClicked}
        >
            <div className="d-flex align-items-center">
                <img
                    className="d-flex me-2 rounded-circle"
                    src={`//${APP_DOMAIN}/api/logo/thumbnail/null`}
                    alt={name}
                    height="32"
                />
                <div className="w-100">
                    <h5
                        className={`m-0 ${!clickable && "text-muted"} text-truncate`}
                        style={{ width: "115px", fontSize: "16px" }}
                    >
                        {name}
                    </h5>
                    <span className="font-12 mb-0" style={{ display: "none" }}>
                        RUC: {person.document_number}
                    </span>
                </div>
            </div>
        </span>
    );
};

export default BusinessCard;
