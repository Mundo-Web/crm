# Guía Completa de Configuración: Google Cloud, Gmail, Google Calendar & Google Ads

Esta guía documenta los pasos necesarios para configurar desde cero todas las integraciones de **Google** en **Atalaya CRM**:
1. 📧 **Gmail:** Envío de correos, historial de mensajes, respuestas y adjuntos en el detalle del lead.
2. 📅 **Google Calendar:** Sincronización automática de citas, tareas y reuniones con invitaciones al cliente y videollamada.
3. 📢 **Google Ads:** Sincronización de campañas, grupos de anuncios, métricas de rendimiento y leads en tiempo real.

---

## 📋 Índice
1. [Paso 1: Crear Proyecto en Google Cloud Console](#paso-1-crear-proyecto-en-google-cloud-console)
2. [Paso 2: Habilitar las APIs Necesarias (Ads, Gmail, Calendar)](#paso-2-habilitar-las-apis-necesarias)
3. [Paso 3: Configurar la Pantalla de Consentimiento OAuth y Permisos (Scopes)](#paso-3-configurar-la-pantalla-de-consentimiento-oauth)
4. [Paso 4: Crear Credenciales OAuth 2.0 y URIs de Redirección](#paso-4-crear-credenciales-oauth-20)
5. [Paso 5: Descargar e Instalar `credentials.json`](#paso-5-descargar-e-instalar-credentialsjson)
6. [Paso 6: Configurar el Google Ads Developer Token](#paso-6-configurar-el-google-ads-developer-token)
7. [Paso 7: Cómo Funciona la Integración de Gmail](#paso-7-como-funciona-la-integracion-de-gmail)
8. [Paso 8: Cómo Funciona la Integración de Google Calendar](#paso-8-como-funciona-la-integracion-de-google-calendar)
9. [Paso 9: Verificación de Marca en Google (Para Usuarios Ilimitados)](#paso-9-verificacion-de-marca-en-google)

---

## 📌 Paso 1: Crear Proyecto en Google Cloud Console
1. Entra a [Google Cloud Console](https://console.cloud.google.com/) e inicia sesión con una cuenta corporativa de Google.
2. En la barra superior, haz clic en el selector de proyectos ➔ **"Nuevo proyecto" (New Project)**.
3. Asigna el nombre al proyecto, por ejemplo: `Atalaya CRM`.
4. Haz clic en **"Crear"**.

---

## 📌 Paso 2: Habilitar las APIs Necesarias
1. En el menú lateral izquierdo, ve a **APIs y servicios** ➔ **Biblioteca (Library)**.
2. Busca y haz clic en **"Habilitar"** para cada una de las siguientes 3 APIs:
   - **Google Ads API** *(para campañas, costos, impresiones y clics)*.
   - **Gmail API** *(para envío y lectura de correos desde el CRM)*.
   - **Google Calendar API** *(para agendar y sincronizar citas con clientes)*.

---

## 📌 Paso 3: Configurar la Pantalla de Consentimiento OAuth
1. En el menú lateral, ve a **APIs y servicios** ➔ **Pantalla de consentimiento de OAuth**.
2. Selecciona tipo de usuario **"Externo" (External)** y haz clic en **Crear**.
3. Rellena los datos básicos:
   - **Nombre de la aplicación:** `Atalaya CRM`
   - **Correo de soporte al usuario:** Tu correo electrónico o el de la empresa.
   - **Dominios autorizados:** `atalaya.pe`
   - **Información de contacto del desarrollador:** Tu correo electrónico.
4. En el paso de **Permisos (Scopes)**, haz clic en **"Agregar o quitar permisos"** y añade los siguientes scopes:
   - `https://www.googleapis.com/auth/adwords` *(Google Ads)*
   - `https://www.googleapis.com/auth/gmail.send` *(Enviar correos desde Gmail)*
   - `https://www.googleapis.com/auth/gmail.readonly` *(Leer historial de correos de Gmail)*
   - `https://www.googleapis.com/auth/calendar.events` *(Crear y editar eventos en Calendar)*
   - `https://www.googleapis.com/auth/calendar.readonly` *(Leer citas del calendario)*
5. En **Usuarios de prueba (Test users)**, añade los correos de los asesores/administradores que probarán el CRM.
6. **Publicar la App:** Vuelve a la pantalla principal de consentimiento y haz clic en **"Publicar aplicación" (Publish App)** para activarla en Producción.

---

## 📌 Paso 4: Crear Credenciales OAuth 2.0
1. En el menú lateral, ve a **APIs y servicios** ➔ **Credenciales (Credentials)**.
2. Haz clic en **"+ Crear credenciales"** ➔ **ID de cliente de OAuth (OAuth Client ID)**.
3. Tipo de aplicación: **"Aplicación web" (Web application)**.
4. Nombre: `Atalaya CRM Web Client`.
5. En **Orígenes autorizados de JavaScript (Authorized JavaScript origins)**:
   - `https://crm.atalaya.pe`
   - `http://localhost`
6. En **URIs de redireccionamiento autorizados (Authorized redirect URIs)**, agrega **todas** las siguientes URLs:
   - `https://crm.atalaya.pe/google-ads/callback`
   - `https://crm.atalaya.pe/gmail/callback`
   - `https://crm.atalaya.pe/google-calendar/callback`
   - `http://localhost/google-ads/callback`
   - `http://localhost/gmail/callback`
   - `http://localhost/google-calendar/callback`
7. Haz clic en **Crear**.

---

## 📌 Paso 5: Descargar e Instalar `credentials.json`
1. En la ventana emergente de confirmación, haz clic en **"Descargar JSON"**.
2. Renombra el archivo descargado a: `credentials.json`.
3. Guárdalo en la ruta del servidor:
   `crm/storage/app/google/credentials.json`

Estructura esperada del archivo `credentials.json`:
```json
{
  "web": {
    "client_id": "TU_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "atalaya-crm",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "TU_CLIENT_SECRET",
    "redirect_uris": [
      "https://crm.atalaya.pe/google-ads/callback",
      "https://crm.atalaya.pe/gmail/callback",
      "https://crm.atalaya.pe/google-calendar/callback"
    ]
  }
}
```

---

## 📌 Paso 6: Configurar el Google Ads Developer Token
* **OAuth (`credentials.json`):** Autoriza al CRM a acceder a la cuenta publicitaria del cliente.
* **Developer Token:** Es la llave emitida por Google Ads a tu empresa para habilitar técnicamente las consultas de campañas y métricas.

### 🔑 Cómo obtener el Developer Token:
1. Inicia sesión en tu cuenta de Administrador de Google Ads (MCC): [Google Ads Manager Accounts](https://ads.google.com/home/tools/manager-accounts/) o [Centro de API (API Center)](https://ads.google.com/aw/apicenter).
2. En el menú superior, ve a **Herramientas y configuración** ➔ **Configuración** ➔ **Centro de API (API Center)**.
3. Copia el **Developer Token** de 22 caracteres.
4. Solicita el nivel **Basic Access** (hasta 15,000 peticiones diarias gratuitas) indicando que Atalaya CRM es un software de gestión de leads y métricas publicitarias.
5. Configura el token en el archivo `.env` del servidor:
   ```env
   GOOGLE_ADS_DEVELOPER_TOKEN=tu_token_de_22_caracteres_aqui
   ```

---

## 📌 Paso 7: Cómo Funciona la Integración de Gmail
1. **Conexión en 1 Clic:**
   - En **Ajustes ➔ Integraciones / Webhooks**, haz clic en la tarjeta **Gmail** ➔ **"Conectar con Google"**.
   - Se abrirá una ventana emergente para otorgar permisos a la cuenta de correo de tu empresa o asesor.
2. **Envío y Lectura en el Detalle del Lead:**
   - Al abrir un lead que posea correo electrónico registrado, aparecerá la pestaña **"Correos"**.
   - Haz clic en **"Redactar"** para enviar un correo con formato enriquecido y adjuntos.
   - Todo el historial de correos enviados y recibidos con ese cliente se mostrará automáticamente dentro de la ficha del lead.

---

## 📌 Paso 8: Cómo Funciona la Integración de Google Calendar
1. **Conexión en 1 Clic:**
   - En **Ajustes ➔ Integraciones / Webhooks**, haz clic en la tarjeta **Google Calendar** ➔ **"Conectar con Google"**.
   - Autoriza el acceso a tu calendario.
2. **Sincronización Automática de Citas:**
   - Al crear una tarea en el detalle del lead con tipo **"Cita"**, **"Reunión"** o **"Llamada"** e indicar fecha y hora:
     - El CRM creará el evento en tu **Google Calendar**.
     - Si el lead tiene correo electrónico, se le agregará automáticamente como **invitado** con confirmación por correo.
     - La cita quedará vinculada en el historial de notas y tareas del lead con su enlace directo a Calendar.

---

## 📌 Paso 9: Verificación de Marca en Google (Para Quitar el Límite de 100 Usuarios)
Al poner la app en **Producción**, Google asigna un límite inicial de 100 cuentas vinculadas. Para habilitar cuentas ilimitadas y eliminar avisos:

1. En [Google Cloud Console](https://console.cloud.google.com/), ve a **APIs y servicios** ➔ **Pantalla de consentimiento de OAuth** ➔ **Información de la marca**.
2. Completa los datos de marca:
   - **Nombre:** `Atalaya CRM`
   - **Logotipo:** Sube el logo oficial (cuadrado).
   - **Dominio:** `atalaya.pe`
   - **Política de Privacidad:** `https://atalaya.pe/politica-de-privacidad`
3. Haz clic en **"Enviar para verificación"**.
4. La revisión demora entre 2 y 5 días hábiles. Una vez aprobada, el límite de 100 usuarios desaparece por completo y el CRM admitirá conexiones ilimitadas.
