import { useContext, useEffect, useRef } from "react";
import { LeadsContext } from "./LeadsProvider";
import Tippy from "@tippyjs/react";
import Global from "../../Utils/Global";

const LeadChat = ({ users }) => {
    const { leads, getLeads, getMoreLeads, setLeads, defaultView, selectedUsersId, setSelectedUsersId } = useContext(LeadsContext)
    const simplebarRef = useRef(null);

    useEffect(() => {
        if (simplebarRef.current) {
            simplebarRef.current.SimpleBar?.recalculate();
        }
    }, [leads]);

    useEffect(() => {
        if (defaultView != 'chat') return
        setLeads([])
        getLeads()
    }, [selectedUsersId, defaultView])

    return <div className="row">

        <div className="col-xl-3 col-lg-4">
            <div className="card chat-list-card mb-xl-0">
                <div className="card-body">
                    <div className="d-flex w-100 gap-0 align-items-center">
                        {users.map(user => (
                            <Tippy
                                key={user.id}
                                content={`${user.name} ${user.lastname}`}
                            >
                                <div
                                    onClick={() => {
                                        const newSelectedUsers = [...selectedUsersId];
                                        const userServiceId = user.service_user.id;

                                        const index = newSelectedUsers.indexOf(userServiceId);
                                        if (index > -1) {
                                            newSelectedUsers.splice(index, 1);
                                        } else {
                                            newSelectedUsers.push(userServiceId);
                                        }

                                        setSelectedUsersId(newSelectedUsers);
                                    }}
                                    className={`rounded-pill ${selectedUsersId.includes(user.service_user.id) ? 'bg-purple' : ''}`}
                                    style={{ cursor: 'pointer', padding: '2px', marginRight: '2px' }}
                                >
                                    <img
                                        className='avatar-xs rounded-circle'
                                        src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${user.relative_id}`}
                                        alt={user.name}
                                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                                    />
                                </div>
                            </Tippy>
                        ))}
                        {
                            selectedUsersId.length > 0 &&
                            <Tippy content="Limpiar filtros">
                                <button
                                    className="btn btn-xs btn-soft-danger ms-1 rounded-pill"
                                    onClick={() => setSelectedUsersId([])}
                                >
                                    <i className="mdi mdi-trash-can-outline"></i>
                                </button>
                            </Tippy>
                        }
                    </div>

                    <hr className="my-2" />

                    <div className="search-box chat-search-box mb-2">
                        <input type="text" className="form-control" placeholder="Search..." />
                        <i className="mdi mdi-magnify search-icon"></i>
                    </div>

                    <div className="">
                        <ul className="list-unstyled chat-list mb-0" style={{ height: 'calc(100vh - 380px)' }}
                            ref={simplebarRef}>
                            {leads
                                .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
                                .map(lead => (
                                    <li key={lead.id} className={lead.unread ? 'unread' : ''}>
                                        <a href="#">
                                            <div className="d-flex">
                                                <div className={`flex-shrink-0 chat-user-img ${lead.online ? 'active' : ''} align-self-center me-2`}>
                                                    {lead.avatar ? (
                                                        <img src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${lead.avatar}`}
                                                            className="rounded-circle avatar-sm" alt={lead.name} />
                                                    ) : (
                                                        <span className={`avatar-title rounded-circle bg-soft-${lead.color} text-${lead.color}`}>
                                                            <i className="mdi mdi-account"></i>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex-grow-1 overflow-hidden">
                                                    <h5 className="text-truncate font-14 mt-0 mb-1">{lead.name}</h5>
                                                    <p className="text-truncate mb-0">{lead.last_message}</p>
                                                </div>
                                                <div className="font-11">{lead.last_time}</div>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div className="col-xl-9 col-lg-8">
            <div className="conversation-list-card card">
                <div className="card-body">
                    <div className="dropdown float-end">
                        <a href="#" className="dropdown-toggle arrow-none card-drop font-20"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="mdi mdi-dots-vertical"></i>
                        </a>
                        <div className="dropdown-menu dropdown-menu-end">
                            <a href="javascript:void(0);" className="dropdown-item">Action</a>
                            <a href="javascript:void(0);" className="dropdown-item">Another action</a>
                            <a href="javascript:void(0);" className="dropdown-item">Something else</a>
                            <div className="dropdown-divider"></div>
                            <a href="javascript:void(0);" className="dropdown-item">Separated link</a>
                        </div>
                    </div>
                    <div className="d-flex">
                        <div className="flex-grow-1">
                            <h5 className="mt-0 mb-1 text-truncate">Margaret Clayton</h5>
                            <p className="font-13 text-muted mb-0"><i
                                className="mdi mdi-circle text-success me-1 font-11"></i> Active</p>
                        </div>
                    </div>
                    <hr className="my-3" />

                    <div>
                        <ul className="conversation-list slimscroll" style={{ height: 'calc(100vh - 455px)' }}
                            data-simplebar>
                            <li>
                                <div className="chat-day-title">
                                    <span className="title">Today</span>
                                </div>
                            </li>
                            <li>
                                <div className="message-list">
                                    <div className="chat-avatar">
                                        <img src="assets/images/users/user-2.jpg" alt="" />
                                    </div>
                                    <div className="conversation-text">
                                        <div className="ctext-wrap">
                                            <span className="user-name">Margaret Clayton</span>
                                            <p>
                                                Hello!
                                            </p>
                                        </div>
                                        <span className="time">10:00</span>
                                    </div>
                                </div>
                            </li>

                            <li className="odd">
                                <div className="message-list">
                                    <div className="chat-avatar">
                                        <img src="assets/images/users/user-1.jpg" alt="" />
                                    </div>
                                    <div className="conversation-text">
                                        <div className="ctext-wrap">
                                            <span className="user-name">Nowak Helme</span>
                                            <p>
                                                Hi, How are you? What about our next meeting?
                                            </p>
                                        </div>
                                        <span className="time">10:01</span>
                                    </div>
                                </div>
                            </li>

                            <li>
                                <div className="message-list">
                                    <div className="chat-avatar">
                                        <img src="assets/images/users/user-2.jpg" alt="" />

                                    </div>
                                    <div className="conversation-text">
                                        <div className="ctext-wrap">
                                            <span className="user-name">Margaret Clayton</span>
                                            <p>
                                                Yeah everything is fine
                                            </p>
                                        </div>
                                        <span className="time">10:03</span>
                                    </div>
                                </div>
                            </li>
                            <li>
                                <div className="message-list">
                                    <div className="chat-avatar">
                                        <img src="assets/images/users/user-2.jpg" alt="male" />

                                    </div>
                                    <div className="conversation-text">
                                        <div className="ctext-wrap">
                                            <span className="user-name">Margaret Clayton</span>
                                            <p>
                                                & Next meeting tomorrow 10.00AM
                                            </p>
                                        </div>
                                        <span className="time">10:03</span>
                                    </div>
                                </div>
                            </li>

                            <li className="odd">
                                <div className="message-list">
                                    <div className="chat-avatar">
                                        <img src="assets/images/users/user-1.jpg" alt="" />
                                    </div>
                                    <div className="conversation-text">
                                        <div className="ctext-wrap">
                                            <span className="user-name">Nowak Helme</span>
                                            <p>
                                                Wow that's great
                                            </p>
                                        </div>
                                        <span className="time">10:04</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="p-3 conversation-input border-top">
                    <div className="row">
                        <div className="col">
                            <div>
                                <input type="text" className="form-control" placeholder="Enter Message..." />
                            </div>
                        </div>
                        <div className="col-auto">
                            <button type="submit"
                                className="btn btn-primary chat-send width-md waves-effect waves-light"><span
                                    className="d-none d-sm-inline-block me-2">Send</span> <i
                                        className="mdi mdi-send"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
}

export default LeadChat