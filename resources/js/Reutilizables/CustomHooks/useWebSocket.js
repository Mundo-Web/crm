import { useEffect, useState } from "react";
import socket from "./socketService";
import LaravelSession from "../../Utils/LaravelSession";
import { toast } from "sonner";

const audio = new Audio('/assets/sounds/notification.wav');

const useWebSocket = ({ fetchNotificationsCount = () => { } }) => {
  const [wsActive, setWsActive] = useState(false);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // Emitir filtros una sola vez
    socket.on("connect", () => {
      socket.emit("register_filters", {
        business_id: LaravelSession.business_id,
        user_id: LaravelSession.service_user.id,
      });
    });

    socket.on("filters_registered", ({ service }) => {
      setWsActive(true);
      console.log(`✅ Conectado a eventos de ${service}`);
    });

    socket.on("notification", (message) => {
      toast(message, { icon: <i className="mdi mdi-bell" /> });
      fetchNotificationsCount();

      if (!document.hasFocus()) {
        const broadcast = new BroadcastChannel("focus-check");
        let otherTabHasFocus = false;

        broadcast.postMessage("check-focus");

        broadcast.onmessage = (event) => {
          if (event.data === "has-focus") otherTabHasFocus = true;
        };

        setTimeout(() => {
          // if (!otherTabHasFocus) {
          audio.play();
          // }
          broadcast.close();
        }, 100);
      }
    });

    socket.on("error", (error) => {
      console.error("❌ Error:", error);
    });

    socket.on("disconnect", () => {
      setWsActive(false);
      console.log("🔌 Desconectado del servidor");
    });

    // ✅ No desconectamos en cleanup para mantener un único socket global
    return () => {
      socket.off("notification");
      socket.off("filters_registered");
      socket.off("error");
      socket.off("disconnect");
      socket.off("connect");
    };
  }, []);

  return { wsActive, socket };
};

export default useWebSocket;