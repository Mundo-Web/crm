import React, { useEffect, useState } from "react";
import socket from "./Needed/socketService";
import LaravelSession from "../../Utils/LaravelSession";
import { toast } from "sonner";
import NotificationsRest from "../../actions/NotificationsRest";

const audio = new Audio('/assets/sounds/notification.wav');

const useWebSocket = (filters = {}) => {
  const [wsActive, setWsActive] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const defaultFilters = {
    business_id: LaravelSession.business_id,
    user_id: LaravelSession.service_user.id,
  };

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

    console.log('Conectando a socket...');

    socket.on("connect", () => {
      socket.emit("register_filters", {
        ...defaultFilters,
        ...filters,
      });
    });

    socket.on("filters_registered", ({ service, filters }) => {
      setWsActive(true);
      console.log(`✅ Conectado a eventos de ${service}`);
      const filtersArray = Object.entries(filters).map(([key, value]) => ({ Filtro: key, Valor: value }));
      console.table(filtersArray);
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

    socket.on("disconnect", () => setWsActive(false));

    return () => {
      console.log('Apagando eventos socket');
      // socket.off("notification");
      // socket.off("filters_registered");
      // socket.off("error");
      // socket.off("disconnect");
      // socket.off("connect");
    };
  }, []);

  // ✅ Este solo reacciona si cambian los filtros dinámicos
  useEffect(() => {
    if (socket.connected) {
      socket.emit("update_filters", {
        ...defaultFilters,
        ...filters,
      });
    }
  }, [JSON.stringify({ ...defaultFilters, ...filters })]);

  return { wsActive, socket, notificationsCount };
};

export default useWebSocket;
