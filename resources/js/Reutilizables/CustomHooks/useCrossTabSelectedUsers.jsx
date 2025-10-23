// useCrossTabSelectedUsers.js
import { useEffect, useState, useRef } from "react";
import { Local } from "sode-extend-react";

const useCrossTabSelectedUsers = (businessId, initialValue = []) => {
  // Creamos una clave única por empresa
  const key = `susid-${businessId}`;

  // Inicializamos desde localStorage
  const [selectedUsers, setSelectedUsers] = useState(() => {
    try {
      const stored = Local.get(key);
      return stored ? stored : initialValue;
    } catch (err) {
      console.warn("Error leyendo localStorage:", err);
      return initialValue;
    }
  });

  const channelRef = useRef(new BroadcastChannel(key));

  useEffect(() => {
    const channel = channelRef.current;

    // Escuchar cambios desde otras pestañas/ventanas
    channel.onmessage = (event) => {
      if (Array.isArray(event.data)) {
        setSelectedUsers(event.data);
        Local.set(key, event.data);
      }
    };

    // Escuchar cambios directos en localStorage (p. ej. desde otra app o tab)
    const onStorage = (e) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = Local.get(key);
          if (Array.isArray(parsed)) setSelectedUsers(parsed);
        } catch {
          console.warn("Error parseando localStorage", e.newValue);
        }
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      channel.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const updateSelectedUsers = (newArray) => {
    if (!Array.isArray(newArray)) {
      console.warn("updateSelectedUsers esperaba un array, recibió:", newArray);
      return;
    }
    setSelectedUsers(newArray);
    Local.set(key, newArray);
    channelRef.current.postMessage(newArray);
  };

  return [selectedUsers, updateSelectedUsers];
}

export default useCrossTabSelectedUsers