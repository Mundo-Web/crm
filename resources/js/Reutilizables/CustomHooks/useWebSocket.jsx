import React, { useEffect, useState } from "react";
import socket from "./Needed/socketService";
import LaravelSession from "../../Utils/LaravelSession";
import { toast } from "sonner";
import NotificationsRest from "../../actions/NotificationsRest";

const audio = new Audio('/assets/sounds/notification.wav');

const useWebSocket = () => {
  const [wsActive, setWsActive] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const fetchNotificationsCount = async () => {
    const notiRest = new NotificationsRest()
    const { totalCount, status } = await notiRest.paginate({
      requireTotalCount: true,
      requireData: false
    })
    if (status == 200) setNotificationsCount(totalCount)
  }

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

    socket.on("filters_registered", ({ service, filters }) => {
      setWsActive(true);
      console.log(`✅ Conectado a eventos de ${service}`);
      console.log(Object.keys(filters).map(key => `${key}: ${filters[key]}`).join('\n'))
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

  return { wsActive, socket, notificationsCount };
};

export default useWebSocket;
