# Plan de Implementación de la Integración de Google Ads (Organizado en Sprints)

> **Para trabajadores agentes:** SUB-HABILIDAD REQUERIDA: Usa superpowers:subagent-driven-development (grupales o unitarios) para ejecutar el plan sprint por sprint. Los pasos usan la sintaxis de casillas de verificación (`- [ ]`) para el seguimiento.

**Objetivo:** Integrar el ecosistema de Google Ads en Atalaya CRM para la captura de leads en tiempo real y la sincronización de métricas de campañas.

---

## SPRINT 1: Estructura Base y Captura de Leads (Webhook)
*Objetivo del Sprint: Crear los recursos visuales, rutas, vistas y el controlador básico necesario para recibir leads en tiempo real desde Google Ads.*

- [ ] **Tarea 1.1: Crear el recurso SVG de Google Ads**
  - Crear: `crm/public/assets/img/google-ads.svg` con la estructura del logotipo oficial.
- [ ] **Tarea 1.2: Crear el archivo Blade de Callback OAuth**
  - Crear: `crm/resources/views/google_ads_callback.blade.php` para transferir los tokens desde el popup al CRM padre en React.
- [ ] **Tarea 1.3: Definir rutas de Google Ads**
  - Modificar: `crm/routes/meta.php` (POST del Webhook público: `/meta/google-ads/{business_uuid}`).
  - Modificar: `crm/routes/web.php` (OAuth connect y callback).
  - Modificar: `crm/routes/api.php` (Ruta POST protegida `/google-ads/sync-campaigns`).
- [ ] **Tarea 1.4: Crear GoogleAdsController básico**
  - Crear: `crm/app/Http/Controllers/GoogleAdsController.php` con el constructor, `connect`, `callback`, y la recepción del `webhook` de leads.

---

## SPRINT 2: Integración de la API de Google Ads y Sincronización
*Objetivo del Sprint: Implementar el intercambio de tokens de Google, validación de perfiles (Customer ID) y sincronización de datos de campañas (spend, clicks, impressions).*

- [ ] **Tarea 2.1: Registrar el servicio Google Ads en IntegrationController**
  - Modificar: `crm/app/Http/Controllers/IntegrationController.php` para soportar `'google-ads'` en `beforeSave` y `getProfile` llamando al controlador de Google Ads.
- [ ] **Tarea 2.2: Implementar la sincronización de campañas en GoogleAdsController**
  - Modificar: `crm/app/Http/Controllers/GoogleAdsController.php` agregando el método `syncGoogleAdsCampaigns` para consultar la API REST de Google Ads y actualizar las tablas locales (`campaigns`, `ad_sets`, `ads`).

---

## SPRINT 3: Interfaz de Usuario y Ajustes del Panel (React)
*Objetivo del Sprint: Actualizar las interfaces del panel de Webhooks y la tabla de Leads para configurar la integración y visualizar el ícono del servicio.*

- [ ] **Tarea 3.1: Actualizar el Asistente de Integraciones (Webhooks.jsx)**
  - Modificar: `crm/resources/js/Webhooks.jsx` para agregar la tarjeta de Google Ads, definir el flujo del asistente (pasos de configuración), configurar el webhook url/key y vincular el botón de sincronización de campañas.
- [ ] **Tarea 3.2: Renderizar el ícono de Google en el listado de Leads**
  - Modificar: `crm/resources/js/Reutilizables/Leads/LeadTable.jsx` agregando el caso `'google-ads'` en la columna de integraciones para mostrar el ícono de Google (`mdi-google` con color `#4285F4`).

---

## SPRINT 4: Pruebas y Verificación
*Objetivo del Sprint: Ejecutar pruebas automatizadas y realizar control de calidad final.*

- [ ] **Tarea 4.1: Crear la prueba automatizada del webhook**
  - Crear: `crm/tests/Feature/GoogleAdsWebhookTest.php` para simular peticiones del webhook receptor de Google y verificar el guardado de los leads con sus metadatos.
- [ ] **Tarea 4.2: Ejecutar verificación final**
  - Ejecutar: `php artisan test --filter=GoogleAdsWebhookTest`
  - Validar de forma manual la UI de integraciones y el flujo de autenticación simulado.
