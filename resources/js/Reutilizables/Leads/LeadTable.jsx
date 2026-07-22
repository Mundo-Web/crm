import React, { useContext, useEffect, useRef } from "react";
import Table from "../../components/Table";
import { renderToString } from "react-dom/server";
import ReactAppend from "../../Utils/ReactAppend";
import Global from "../../Utils/Global";
import Tippy from "@tippyjs/react";
import StatusDropdown from "../Statuses/StatusDropdown";
import TippyButton from "../../components/form/TippyButton";
import LaravelSession from "../../Utils/LaravelSession";
import LeadsRest from "../../actions/LeadsRest";
import Swal from "sweetalert2";
import ClientsRest from "../../actions/ClientsRest";
import ArrayJoin from "../../Utils/ArrayJoin";
import { LeadsContext } from "./LeadsProvider";
import sourceOptions from "../Campaigns/socials.json";

/**
 * Determina el ícono y color para un `ClientEntry` según su canal de origen.
 * Misma lógica que getChannelStyle en Leads.jsx.
 */
const getChannelStyle = (entry) => {
    const source = (entry.source || '').toLowerCase();
    const origin = (entry.origin || '').toLowerCase();
    const trigger = (entry.triggered_by || '').toLowerCase();
    const hasCampaign = !!entry.campaign_id;

    if (origin.includes('instagram') || trigger.includes('instagram')) {
        return { icon: 'mdi-instagram', color: '#C13584', label: hasCampaign ? 'Instagram (Anuncio)' : 'Instagram (Orgánico)' };
    }
    if (origin.includes('facebook') || trigger.includes('facebook') || origin.includes('meta') || source.includes('meta')) {
        return { icon: 'mdi-facebook', color: '#1877F2', label: hasCampaign ? 'Facebook (Formulario)' : 'Facebook (Orgánico)' };
    }
    if (source.includes('whatsapp') || trigger.includes('whatsapp') || origin.includes('whatsapp')) {
        return { icon: 'mdi-whatsapp', color: '#25D366', label: hasCampaign ? 'WhatsApp (Anuncio)' : 'WhatsApp (Orgánico)' };
    }
    if (source.includes('google') || origin.includes('google')) {
        return { icon: 'mdi-google', color: '#EA4335', label: 'Google Ads' };
    }
    if (source.includes('landing') || origin.includes('landing')) {
        return { icon: 'mdi-web', color: '#6c757d', label: 'Landing Page' };
    }
    if (source.includes('organico') || origin.includes('organico') || source.includes('orgánico') || origin.includes('orgánico')) {
        return { icon: 'mdi-account-circle-outline', color: '#17a2b8', label: 'Orgánico' };
    }
    if (source.toLowerCase().includes('crm') || source.toLowerCase().includes('atalaya') || source.toLowerCase().includes('interno') || source.toLowerCase().includes('internal')) {
        return { icon: 'mdi-database-outline', color: '#6c757d', label: 'CRM Interno' };
    }
    if (source.includes('externo') || origin.includes('externo')) {
        return { icon: 'mdi-link-variant', color: '#fd7e14', label: 'Externo' };
    }
    return { icon: 'mdi-account-arrow-right', color: '#adb5bd', label: origin || source || 'Otro' };
};

const leadsRest = new LeadsRest();
const clientsRest = new ClientsRest();

const LeadTable = ({
    gridRef,
    cardClass,
    otherGridRef,
    rest,
    can,
    defaultLeadStatus,
    statuses,
    manageStatuses,
    onClientStatusClicked,
    onManageStatusChange,
    onLeadClicked,
    onMessagesClicked,
    onAttendClient,
    onOpenModal,
    onMakeLeadClient,
    onArchiveClicked,
    onDeleteClicked,
    title,
    borderColor = "#315AFE",
    setStatuses,
    setManageStatuses,
    users,
    filterAssignation,
    completeRegistration,
}) => {
    const { selectedUsersId, setSelectedUsersId, defaultView } =
        useContext(LeadsContext);

    const syncInputRef = useRef(null);

    const onSyncFileChanged = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const leads = JSON.parse(event.target.result);
                const { isConfirmed } = await Swal.fire({
                    title: "¿Sincronizar Leads de Meta?",
                    text: `Se intentará sincronizar la información de ${leads.length} registros basándose en el correo electrónico.`,
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Sí, sincronizar",
                    cancelButtonText: "Cancelar",
                });

                if (!isConfirmed) return;

                Swal.fire({
                    title: "Sincronizando...",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });

                const result = await leadsRest.syncMeta(leads);
                if (result) {
                    Swal.fire(
                        "¡Éxito!",
                        "Los leads se han sincronizado correctamente.",
                        "success",
                    );
                    $(gridRef.current).dxDataGrid("instance").refresh();
                }
            } catch (error) {
                Swal.fire(
                    "Error",
                    "El archivo no es un JSON válido o tiene un formato incorrecto.",
                    "error",
                );
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const onMassiveAssignClicked = async (userId) => {
        const selectedRows = $(gridRef.current)
            .dxDataGrid("instance")
            .getSelectedRowKeys()
            .map(({ id }) => id);

        if (!selectedRows.length) {
            Swal.fire({
                icon: "warning",
                title: "No hay leads seleccionados",
                text: "Por favor seleccione al menos un lead para asignar",
            });
            return;
        }

        const isUnassigning = userId === null;
        const selectedUser = !isUnassigning
            ? users.find((user) => user.service_user.id === userId || user.id === userId)
            : null;

        const selectedRowsData = $(gridRef.current).dxDataGrid("instance").getSelectedRowsData();
        const allAssigned = selectedRowsData.every(l => l.assigned_to);
        const noneAssigned = selectedRowsData.every(l => !l.assigned_to);

        let actionLabel = "Asignar";
        let actionTitle = "Asignación";
        if (allAssigned) {
            actionLabel = "Reasignar";
            actionTitle = "Reasignación";
        } else if (!noneAssigned) {
            actionLabel = "Asignar / Reasignar";
            actionTitle = "Asignación / Reasignación";
        }

        const userName = selectedUser ? `${selectedUser.name || ''} ${selectedUser.lastname || ''}`.trim() : 'el usuario';

        const { isConfirmed } = await Swal.fire({
            icon: "question",
            title: isUnassigning
                ? "Confirmar Desasignación"
                : `Confirmar ${actionTitle}`,
            text: isUnassigning
                ? `¿Está seguro que desea quitar la asignación de ${selectedRows.length} lead(s)?`
                : `¿Está seguro que desea ${actionLabel.toLowerCase()} ${selectedRows.length} lead(s) a ${userName}?`,
            showCancelButton: true,
            confirmButtonText: isUnassigning
                ? "Sí, quitar asignación"
                : `Sí, ${actionLabel.toLowerCase()}`,
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;

        const result = await leadsRest.massiveAssign({
            leadsId: selectedRows,
            userId: userId,
        });

        if (!result) return;

        Swal.fire({
            icon: "success",
            title: isUnassigning ? "Asignación Removida" : `Leads ${actionLabel}s`,
            text: isUnassigning
                ? "Se ha quitado la asignación de los leads exitosamente"
                : `Los leads han sido ${actionLabel.toLowerCase()}s exitosamente`,
        });

        const grid = $(gridRef.current).dxDataGrid("instance");
        grid.clearSelection();
        grid.refresh();
        $(otherGridRef.current).dxDataGrid("instance").refresh();
    };

    const onMassiveArchiveClicked = async () => {
        const selectedRows = $(gridRef.current)
            .dxDataGrid("instance")
            .getSelectedRowKeys()
            .map(({ id }) => id);

        if (!selectedRows.length) {
            Swal.fire({
                icon: "warning",
                title: "No hay leads seleccionados",
                text: "Por favor seleccione al menos un lead para archivar",
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            icon: "question",
            title: "Confirmar Archivo",
            text: `¿Está seguro que desea archivar ${selectedRows.length} lead(s)?`,
            showCancelButton: true,
            confirmButtonText: "Sí, archivar",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;

        const result = await clientsRest.massiveDelete({
            clientsId: selectedRows,
        });

        if (!result) return;

        Swal.fire({
            icon: "success",
            title: "Leads Archivados",
            text: "Los leads han sido archivados exitosamente",
        });

        const grid = $(gridRef.current).dxDataGrid("instance");
        grid.clearSelection();
        grid.refresh();
    };

    const onMassiveDeleteClicked = async () => {
        const selectedRows = $(gridRef.current)
            .dxDataGrid("instance")
            .getSelectedRowKeys()
            .map(({ id }) => id);

        if (!selectedRows.length) {
            Swal.fire({
                icon: "warning",
                title: "No hay leads seleccionados",
                text: "Por favor seleccione al menos un lead para eliminar",
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            icon: "question",
            title: "Confirmar Eliminación",
            text: `¿Está seguro que desea eliminar ${selectedRows.length} lead(s)?`,
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!isConfirmed) return;

        const result = await clientsRest.massiveDelete({
            clientsId: selectedRows,
            hardDeletion: true,
        });

        if (!result) return;

        Swal.fire({
            icon: "success",
            title: "Leads Eliminados",
            text: "Los leads han sido eliminados exitosamente",
        });

        const grid = $(gridRef.current).dxDataGrid("instance");
        grid.clearSelection();
        grid.refresh();
    };

    useEffect(() => {
        // if (defaultView != 'table' || !filterAssignation) return
        // const grid = $(gridRef.current).dxDataGrid('instance');
        // grid.clearFilter('assigned_to')
        // if (selectedUsersId.length > 0) {
        //   const prevFilter = grid.filter()
        //   grid.filter(ArrayJoin([prevFilter, ArrayJoin(selectedUsersId.map(id => (['assigned_to', '=', id])), 'or')].filter(Boolean), 'and'));
        // } else {
        //   grid.refresh()
        // }
    }, [selectedUsersId, defaultView]);

    return (
        <>
            <Table
                cardClass={cardClass}
                gridRef={gridRef}
                title={
                    <>
                        <h4 className="header-title my-0">{title}</h4>
                        {filterAssignation && (
                            <div className="d-flex gap-0 mt-2 align-items-center driver-js-users-filter overflow-auto">
                                {users.map((user) => (
                                    <Tippy
                                        key={user.id}
                                        content={`${user.name} ${user.lastname}`}
                                    >
                                        <div
                                            onClick={() => {
                                                const newSelectedUsers = [
                                                    ...selectedUsersId,
                                                ];
                                                const userServiceId =
                                                    user.service_user.id;

                                                const index =
                                                    newSelectedUsers.indexOf(
                                                        userServiceId,
                                                    );
                                                if (index > -1) {
                                                    newSelectedUsers.splice(
                                                        index,
                                                        1,
                                                    );
                                                } else {
                                                    newSelectedUsers.push(
                                                        userServiceId,
                                                    );
                                                }

                                                setSelectedUsersId(
                                                    newSelectedUsers,
                                                );
                                            }}
                                            className={`rounded-pill ${selectedUsersId.includes(user.service_user.id) ? "bg-purple" : ""}`}
                                            style={{
                                                cursor: "pointer",
                                                padding: "2px",
                                                marginRight: "2px",
                                            }}
                                        >
                                            <img
                                                className="avatar-xs rounded-circle"
                                                src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                                                onError={(e) => {
                                                    e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                }}
                                                alt={user.name}
                                                style={{
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                }}
                                            />
                                        </div>
                                    </Tippy>
                                ))}
                                {selectedUsersId.length > 0 && (
                                    <Tippy content="Limpiar filtros">
                                        <button
                                            className="btn btn-xs btn-soft-danger ms-1 rounded-pill"
                                            onClick={() =>
                                                setSelectedUsersId([])
                                            }
                                        >
                                            <i className="mdi mdi-trash-can-outline"></i>
                                        </button>
                                    </Tippy>
                                )}
                            </div>
                        )}
                    </>
                }
                rest={rest}
                reloadWith={[statuses, manageStatuses]}
                filter={
                    filterAssignation
                        ? ArrayJoin(
                            selectedUsersId.map((id) => [
                                "assigned_to",
                                "=",
                                id,
                            ]),
                            "or",
                        )
                        : []
                }
                toolBar={(container) => {
                    /*  container.unshift({
                        widget: "dxButton",
                        location: "after",
                        options: {
                            icon: "refresh",
                            text: "Sincronizar Meta",
                            hint: "Sincronizar leads desde JSON de Meta",
                            elementAttr: {
                                class: "btn  btn-soft-warning btn-xs waves-effect waves-light",
                            },
                            onClick: () => syncInputRef.current.click(),
                        },
                    });*/
                }}
                keyExpr="id"
                selection={{
                    mode: "multiple",
                    allowSelectAll: true,
                    selectAllMode: "page",
                }}
                // onSelectionChanged={({selectedRowKeys}) => {
                //   console.log(selectedRowKeys)
                // }}
                massiveActions={
                    <>
                        <li>
                            <button className="dropdown-item">
                                <div className="d-flex justify-content-between gap-1">
                                    <span>
                                        <i className="mdi mdi-account me-1"></i>
                                        Asignar / Reasignar a
                                    </span>
                                    <i className="mdi mdi-chevron-right"></i>
                                </div>
                            </button>
                            <ul
                                className="dropdown-menu dropdown-submenu"
                                style={{
                                    maxHeight: "360px",
                                    overflowY: "auto",
                                }}
                            >
                                {users.map((user) => {
                                    return (
                                        <li key={user.id}>
                                            <button
                                                className="dropdown-item d-flex gap-1 align-items-center"
                                                onClick={() =>
                                                    onMassiveAssignClicked(
                                                        user.service_user.id,
                                                    )
                                                }
                                            >
                                                <img
                                                    className="avatar-xs rounded-circle"
                                                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                                                    onError={(e) => {
                                                        e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                    }}
                                                    alt={user.name}
                                                />
                                                {user.name?.split(" ")?.[0]}{" "}
                                                {user.lastname?.split(" ")?.[0]}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={() => onMassiveAssignClicked(null)}
                            >
                                <i className="mdi mdi-account-off me-1"></i>
                                Quitar Asignación
                            </button>
                        </li>
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={onMassiveArchiveClicked}
                            >
                                <i className="mdi mdi-archive me-1"></i>
                                Archivar
                            </button>
                        </li>
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={onMassiveDeleteClicked}
                            >
                                <i className="mdi mdi-delete me-1"></i>
                                Eliminar
                            </button>
                        </li>
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={() => {
                                    const grid = $(gridRef.current).dxDataGrid(
                                        "instance",
                                    );
                                    grid.clearSelection();
                                }}
                            >
                                <i className="mdi mdi-selection-off me-1"></i>
                                Quitar selección
                            </button>
                        </li>
                    </>
                }
                exportable
                height={"calc(65vh - 90px)"}
                pageSize={25}
                allowedPageSizes={[10, 25, 50, 100]}
                // selection={{
                //   mode: 'multiple',
                //   selectAllMode: 'page'
                // }}
                columns={[
                    {
                        dataField: "contact_name",
                        caption: "Lead",
                        width: 250,
                        cellTemplate: (container, { data }) => {
                            container.attr(
                                "style",
                                `height: 48px; border-left: 4px solid ${data.status.color}; cursor: pointer;`,
                            );
                            container.on("click", () => onLeadClicked(data));

                            let integrationIcon = null;

                            switch (data?.integration?.meta_service) {
                                case "messenger":
                                    integrationIcon = (
                                        <i className="mdi mdi-facebook-messenger" style={{ color: "#0084FF" }}></i>
                                    );
                                    break;
                                case "instagram":
                                    integrationIcon = (
                                        <i className="mdi mdi-instagram" style={{ color: "#E1306C" }}></i>
                                    );
                                    break;
                                case "tiktok":
                                    integrationIcon = (
                                        <i className="mdi mdi-music-note" style={{ color: "#FF0050" }}></i>
                                    );
                                    break;
                                case "google-ads":
                                    integrationIcon = (
                                        <i className="mdi mdi-google" style={{ color: "#4285F4" }}></i>
                                    );
                                    break;
                                default:
                                    integrationIcon = (
                                        <i className="mdi mdi-whatsapp" style={{ color: "#25D366" }}></i>
                                    );
                                    break;
                            }

                            ReactAppend(
                                container,
                                <div className="d-flex align-items-center justify-content-between gap-2">
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        {integrationIcon && (
                                            <TippyButton
                                                className="btn btn-xs btn-white"
                                                title="Ver mensajes"
                                                onClick={(e) => {
                                                    window.location.href = `/chat/${data.id}`;
                                                    e.stopPropagation();
                                                }}
                                            >
                                                {integrationIcon}
                                            </TippyButton>
                                        )}
                                        <div className="text-truncate">
                                            {data.status_id ==
                                                defaultLeadStatus ? (
                                                <b className="d-block text-truncate">
                                                    {data.contact_name}
                                                </b>
                                            ) : (
                                                <span className="d-block text-truncate">
                                                    {data.contact_name}
                                                </span>
                                            )}
                                            {data.products_count > 0 && (
                                                <small className="text-muted">
                                                    {data.products_count}{" "}
                                                    {data.products_count > 1
                                                        ? "productos"
                                                        : "producto"}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-none gap-1 " style={{ display: "none !important" }}>
                                        {completeRegistration && (
                                            <Tippy
                                                content={
                                                    data.complete_registration
                                                        ? "Registro manual/completo"
                                                        : "Registro incompleto"
                                                }
                                            >
                                                <span
                                                    className={
                                                        data.complete_registration
                                                            ? "text-success"
                                                            : "text-muted"
                                                    }
                                                >
                                                    {data.complete_registration ? (
                                                        <i className="mdi mdi-account-check"></i>
                                                    ) : (
                                                        <i className="mdi mdi-account-clock"></i>
                                                    )}
                                                </span>
                                            </Tippy>
                                        )}
                                        {completeRegistration &&
                                            data.form_answers !== null && (
                                                <Tippy
                                                    content={
                                                        data.complete_form
                                                            ? "Formulario completado"
                                                            : "Formulario incompleto"
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            data.complete_form
                                                                ? "text-success"
                                                                : "text-muted"
                                                        }
                                                    >
                                                        {data.complete_form ? (
                                                            <i className="mdi mdi-file-check"></i>
                                                        ) : (
                                                            <i className="mdi mdi-file-clock"></i>
                                                        )}
                                                    </span>
                                                </Tippy>
                                            )}
                                    </div>
                                </div>,
                            );
                        },
                        fixed: true,
                        fixedPosition: "left",
                    },
                    {
                        dataField: "assigned_to",
                        dataType: "string",
                        caption: "Usuario",
                        width: 58,
                        cellTemplate: (container, { data }) => {
                            container.attr("style", "height: 48px");
                            ReactAppend(
                                container,
                                <div className="d-flex align-items-center gap-1">
                                    {data.assigned_to ? (
                                        <>
                                            <Tippy
                                                content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}
                                            >
                                                <img
                                                    className="avatar-sm rounded-circle"
                                                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`}
                                                    onError={(e) => {
                                                        e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`;
                                                    }}
                                                    alt={data.assigned.name}
                                                />
                                            </Tippy>
                                        </>
                                    ) : (
                                        ""
                                    )}
                                </div>,
                            );
                        },
                        fixed: true,
                        fixedPosition: "left",
                        allowFiltering: false,
                    },
                    {
                        dataField: "contact_email",
                        caption: "Correo",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        <i className="mdi mdi-email-outline text-blue me-1"></i>
                                        {data.contact_email}
                                    </>,
                                ),
                            );
                        },
                    },
                    {
                        dataField: "contact_phone",
                        caption: "Telefono",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        <i className="mdi mdi-cellphone text-blue me-1"></i>
                                        {data.contact_phone}
                                    </>,
                                ),
                            );
                        },
                    },
                    {
                        dataField: "status.name",
                        caption: "Estado de gestión",
                        dataType: "string",
                        width: 180,
                        cellTemplate: (container, { data }) => {
                            // container.addClass('p-0')
                            container.attr("style", "overflow: visible");
                            // ReactAppend(container, <StatusDropdown
                            //   items={statuses}
                            //   defaultValue={data.status}
                            //   base={{
                            //     table_id: 'e05a43e5-b3a6-46ce-8d1f-381a73498f33'
                            //   }}
                            //   onItemClick={(status) => onClientStatusClicked(data.id, status.id)}
                            //   canCreate={can('statuses', 'all', 'create')}
                            //   canUpdate={can('statuses', 'all', 'update')}
                            //   canDelete={can('statuses', 'all', 'delete')}
                            //   onDropdownClose={(hasChanges, items) => {
                            //     if (!hasChanges) return
                            //     setStatuses(items)
                            //   }}
                            // />)
                            ReactAppend(
                                container,
                                <span
                                    className="btn rounded-pill"
                                    style={{
                                        border: "none",
                                        borderRadius: "25px",
                                        padding: "2px 12px",
                                        color: data.status?.color,
                                        fontWeight: "bolder",
                                        backgroundColor: `${data.status?.color}22`,
                                        cursor: "default",
                                    }}
                                >
                                    {data.status?.name}
                                </span>,
                            );
                        },
                    },
                    {
                        dataField: "manage_status.name",
                        caption: "Etiqueta",
                        dataType: "string",
                        width: 180,
                        cellTemplate: (container, { data }) => {
                            // container.addClass('p-0')
                            container.attr("style", "overflow: visible");
                            // ReactAppend(container, <StatusDropdown
                            //   items={manageStatuses}
                            //   defaultValue={data.manage_status}
                            //   base={{
                            //     table_id: '9c27e649-574a-47eb-82af-851c5d425434'
                            //   }}
                            //   onItemClick={(status) => onManageStatusChange(data, status)}
                            //   canCreate={can('statuses', 'all', 'create')}
                            //   canUpdate={can('statuses', 'all', 'update')}
                            //   canDelete={can('statuses', 'all', 'delete')}
                            //   onDropdownClose={(hasChanges, items) => {
                            //     if (!hasChanges) return
                            //     setManageStatuses(items)
                            //   }}
                            // />)
                            ReactAppend(
                                container,
                                <span
                                    className="btn rounded-pill"
                                    style={{
                                        border: "none",
                                        borderRadius: "25px",
                                        padding: "2px 12px",
                                        color: data.manage_status?.color,
                                        fontWeight: "bolder",
                                        backgroundColor: `${data.manage_status?.color}22`,
                                        cursor: "default",
                                    }}
                                >
                                    {data.manage_status?.name || "Sin etiqueta"}
                                </span>,
                            );
                        },
                    },
                    /* {
                         dataField: "entries",
                         caption: "Canales",
                         dataType: "string",
                         width: 130,
                         allowSorting: false,
                         allowFiltering: false,
                         cellTemplate: (container, { data }) => {
                             container.attr("style", "height: 48px; overflow: visible");
                             const entries = Array.isArray(data.entries) ? data.entries.filter(Boolean) : [];
                             if (entries.length === 0) {
                                 container.html(`<small class="text-muted">desde <b>${data.origin || 'Desconocido'}</b></small>`);
                                 return;
                             }
                             ReactAppend(
                                 container,
                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                     {entries.map((entry, idx) => {
                                         const style = getChannelStyle(entry);
                                         let label = style.label;
                                         if (entry.campaign && entry.campaign.title) label += `\nCampaña: ${entry.campaign.title}`;
                                         if (entry.ad_name) label += `\nAnuncio: ${entry.ad_name}`;
                                         return (
                                             <Tippy key={idx} content={<div style={{ whiteSpace: 'pre-line', fontSize: 12 }}>{label}</div>} placement="top">
                                                 <span style={{
                                                     display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                     width: 26, height: 26, borderRadius: '50%',
                                                     backgroundColor: style.color, color: '#fff',
                                                     fontSize: 14, cursor: 'default', position: 'relative',
                                                 }}>
                                                     <i className={`mdi ${style.icon}`} />
                                                 </span>
                                             </Tippy>
                                         );
                                     })}
                                 </div>
                             );
                         },
                     },*/
                    {
                        dataField: "origin",
                        caption: "Red Social (Campaña)",
                        dataType: "string",
                    },
                    {
                        dataField: "source",
                        caption: "Orígen",
                        dataType: "string",
                        // visible: false
                    },
                    {
                        dataField: "triggered_by",
                        caption: "Registrado en",
                        dataType: "string",
                        // visible: false
                    },
                    {
                        dataField: "source_channel",
                        caption: "Donde nos vio?",
                        dataType: "string",
                        visible: false,
                    },
                    {
                        dataField: "campaign.source",
                        caption: "RS Campaña",
                        dataType: "string",
                        width: 100,
                        visible: false,
                        lookup: {
                            dataSource: sourceOptions,
                            valueExpr: "id",
                            displayExpr: "label",
                        },
                    },
                    {
                        dataField: "campaign.title",
                        caption: "Campaña",
                        dataType: "string",
                        width: 200,
                        cellTemplate: (container, { data }) => {
                            if (!data.campaign) return;
                            const campaignTitle = data.campaign.title;
                            const campaignLink = data.campaign.link;
                            container.html(
                                renderToString(
                                    campaignLink ? (
                                        <a
                                            className="text-truncate d-flex align-items-center text-decoration-none"
                                            style={{
                                                maxWidth: "100%",
                                                color: "inherit",
                                            }}
                                            href={campaignLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <code
                                                style={{
                                                    color: "#ff8acc",
                                                    maxWidth: "50px",
                                                }}
                                                className="d-inline-block text-truncate"
                                            >
                                                {data.campaign.code || "---"}
                                            </code>
                                            <small className="ms-1">
                                                {campaignTitle}
                                            </small>
                                        </a>
                                    ) : (
                                        <div
                                            className="text-truncate d-flex align-items-center"
                                            style={{ maxWidth: "100%" }}
                                        >
                                            <code
                                                style={{ maxWidth: "50px" }}
                                                className="d-inline-block text-truncate"
                                            >
                                                {data.campaign.code || "---"}
                                            </code>
                                            <small className="ms-1">
                                                {campaignTitle}
                                            </small>
                                        </div>
                                    ),
                                ),
                            );
                        },
                    },
                    {
                        dataField: "adset_name",
                        caption: "Grupo de anuncios",
                        dataType: "string",
                        width: 150,
                    },
                    {
                        dataField: "ad_name",
                        caption: "Anuncio",
                        dataType: "string",
                        width: 150,
                    },
                    {
                        dataField: "business_sector.name",
                        caption: "Rubro",
                        dataType: "string",
                        width: 150,
                        cellTemplate: (container, { data }) => {
                            container.text(data.business_sector?.name || "-");
                        },
                    },
                    {
                        dataField: "created_at",
                        caption: "Fecha creacion",
                        dataType: "date",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        <i className="mdi mdi-calendar-blank text-blue me-1"></i>
                                        {moment(
                                            data.created_at.replace(
                                                "Z",
                                                "+05:00",
                                            ),
                                        ).format("lll")}
                                    </>,
                                ),
                            );
                        },
                        sortOrder: "desc",
                    },
                    {
                        dataField: "updated_at",
                        caption: "Fecha actualización",
                        dataType: "date",
                        cellTemplate: (container, { data }) => {
                            container.html(
                                renderToString(
                                    <>
                                        <i className="mdi mdi-calendar-blank text-blue me-1"></i>
                                        {moment(
                                            data.updated_at.replace(
                                                "Z",
                                                "+05:00",
                                            ),
                                        ).format("lll")}
                                    </>,
                                ),
                            );
                        },
                    },
                    {
                        caption: "Acciones",
                        width: 240,
                        cellTemplate: (container, { data }) => {
                            container.attr(
                                "style",
                                "display: flex; gap: 8px; height: 47px; overflow: visible; align-items: center",
                            );

                            ReactAppend(
                                container,
                                <TippyButton
                                    className="btn btn-xs btn-soft-warning"
                                    title="Editar lead"
                                    onClick={() => onOpenModal(data)}
                                >
                                    <i className="fa fa-pen"></i>
                                </TippyButton>,
                            );

                            ReactAppend(
                                container,
                                <TippyButton
                                    className="btn btn-xs btn-soft-primary"
                                    title="Ver detalles"
                                    onClick={() => onLeadClicked(data)}
                                >
                                    <i className="fa fa-eye"></i>
                                </TippyButton>,
                            );

                            if (!data.assigned_to) {
                                ReactAppend(
                                    container,
                                    <TippyButton
                                        className="btn btn-xs btn-soft-dark"
                                        title="Atender lead"
                                        onClick={() =>
                                            onAttendClient(data.id, true)
                                        }
                                    >
                                        <i className="fas fa-hands-helping"></i>
                                    </TippyButton>,
                                );
                            } else if (
                                data.assigned_to ==
                                LaravelSession.service_user.id
                            ) {
                                ReactAppend(
                                    container,
                                    <TippyButton
                                        className="btn btn-xs btn-soft-danger"
                                        title="Dejar de atender"
                                        onClick={() =>
                                            onAttendClient(data.id, false)
                                        }
                                    >
                                        <i className="fas fa-hands-wash"></i>
                                    </TippyButton>,
                                );
                            }

                            ReactAppend(
                                container,
                                <TippyButton
                                    className="btn btn-xs btn-soft-success"
                                    title="Convertir en cliente"
                                    onClick={async () => onMakeLeadClient(data)}
                                >
                                    <i className="fa fa-user-plus"></i>
                                </TippyButton>,
                            );
                            ReactAppend(
                                container,
                                <TippyButton
                                    className="btn btn-xs btn-soft-dark"
                                    title="Archivar lead"
                                    onClick={(e) => onArchiveClicked(data, e)}
                                >
                                    <i className="mdi mdi-archive"></i>
                                </TippyButton>,
                            );
                            ReactAppend(
                                container,
                                <TippyButton
                                    className="btn btn-xs btn-soft-danger"
                                    title="Eliminar lead"
                                    onClick={() => onDeleteClicked(data)}
                                >
                                    <i className="fa fa-trash"></i>
                                </TippyButton>,
                            );
                        },
                        allowFiltering: false,
                        allowExporting: false,
                    },
                ]}
                cardStyle={{
                    borderRight: `6px solid ${borderColor}`,
                }}
                masterDetail={{
                    enabled: true,
                    autoExpandAll: false,
                    template: (container, { data }) => {
                        const entries = Array.isArray(data.entries) ? data.entries.filter(Boolean) : [];
                        ReactAppend(
                            container,
                            <div style={{ padding: '16px 24px', backgroundColor: '#fafbfe', borderTop: '1px solid #eef2f7' }}>
                                <div className="card shadow-sm border mb-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                                    <div className="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                                        <h6 className="card-title my-0 text-dark font-weight-bold" style={{ fontSize: '13.5px', letterSpacing: '0.3px' }}>
                                            <i className="mdi mdi-source-branch me-2 text-primary" style={{ fontSize: '16px', verticalAlign: 'middle' }} />
                                            Historial de Orígenes de Registro ({entries.length})
                                        </h6>
                                        <small className="text-muted">Registro cronológico de orígenes</small>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-sm table-striped table-hover mb-0" style={{ fontSize: '12.5px' }}>
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="border-0 px-3 py-2 text-muted" style={{ width: '50px' }}>#</th>
                                                        <th className="border-0 px-3 py-2 text-muted" style={{ width: '180px' }}>Origen / Canal</th>
                                                        <th className="border-0 px-3 py-2 text-muted">Campaña</th>
                                                        <th className="border-0 px-3 py-2 text-muted">Grupo de Anuncios</th>
                                                        <th className="border-0 px-3 py-2 text-muted">Anuncio</th>
                                                        <th className="border-0 px-3 py-2 text-muted" style={{ width: '150px' }}>Fecha</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {entries.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} className="text-center py-3 text-muted">
                                                                Sin historial de orígenes registrado.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        entries.map((entry, idx) => {
                                                            const style = getChannelStyle(entry);
                                                            const entryDate = entry.entry_date
                                                                ? new Date(entry.entry_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                                : '—';
                                                            return (
                                                                <tr key={idx} style={{ verticalAlign: 'middle' }}>
                                                                    <td className="px-3 py-2 text-secondary">{idx + 1}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className="badge px-2 py-1 rounded-pill" style={{
                                                                            backgroundColor: style.color + '15',
                                                                            color: style.color,
                                                                            border: `1px solid ${style.color}25`,
                                                                            fontSize: '11.5px',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            fontWeight: 600
                                                                        }}>
                                                                            <i className={`mdi ${style.icon}`} style={{ fontSize: '13px' }} />
                                                                            {style.label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-dark font-weight-semibold">
                                                                        {entry.campaign ? entry.campaign.title || entry.campaign.code || '—' : '—'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-secondary">{entry.adset_name || '—'}</td>
                                                                    <td className="px-3 py-2 text-secondary">{entry.ad_name || '—'}</td>
                                                                    <td className="px-3 py-2 text-secondary">{entryDate}</td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                }}
            />
            <input
                type="file"
                ref={syncInputRef}
                style={{ display: "none" }}
                accept=".json"
                onChange={onSyncFileChanged}
            />
        </>
    );
};

export default LeadTable;
