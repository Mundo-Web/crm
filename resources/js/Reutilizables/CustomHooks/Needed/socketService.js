// socketService.js
import { io } from "socket.io-client";
import Global from "../../../Utils/Global";

const service = Global.APP_CORRELATIVE;
const eventsURL = Global.EVENTS_URL;

console.log('Evento url:', eventsURL)

const socket = io(`${eventsURL}/${service}`, {
  autoConnect: false,
});

export default socket;