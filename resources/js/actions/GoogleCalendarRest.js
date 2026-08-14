import { Cookies, Fetch, JSON, Notify } from "sode-extend-react";

class GoogleCalendarRest {
  check = async () => {
    const { status, result } = await Fetch(`/api/google-calendar/check`);
    if (!status) return Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Error',
      body: result?.message || 'Ocurrió un error inesperado al verificar Google Calendar',
      type: 'danger'
    });
    return result?.data;
  };

  createEvent = async (request) => {
    const { status, result } = await Fetch(`/api/google-calendar/create-event`, {
      method: 'POST',
      headers: {
        'X-Xsrf-Token': decodeURIComponent(Cookies.get('XSRF-TOKEN'))
      },
      body: JSON.stringify(request)
    });

    if (!status) {
      Notify.add({
        icon: '/assets/img/logo-login.svg',
        title: 'Error al agendar en Google Calendar',
        body: result?.message || 'No se pudo crear el evento en el calendario',
        type: 'danger'
      });
      return null;
    }
    
    Notify.add({
      icon: '/assets/img/logo-login.svg',
      title: 'Evento Agendado',
      body: 'La cita se agregó a tu Google Calendar exitosamente.',
      type: 'success'
    });
    return result?.data ?? true;
  };

  listEvents = async () => {
    const { status, result } = await Fetch(`/api/google-calendar/events`);
    if (!status) return [];
    return result?.data ?? [];
  };
}

export default GoogleCalendarRest;
