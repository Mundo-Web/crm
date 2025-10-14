// socketService.js
import { io } from "socket.io-client";
import Global from "../../../Utils/Global";

const service = Global.APP_CORRELATIVE;

const socket = io(`${Global.EVENTS_URL}/${service}`, {
  autoConnect: false,
});

export default socket;