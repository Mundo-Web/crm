# Guía Completa de Configuración: Google Cloud & Google Ads API

Esta guía documenta los pasos necesarios para configurar desde cero la integración de **Google OAuth** (para Gmail y Google Ads) y el **Google Ads Developer Token** en Atalaya CRM.

---

## 📋 Índice
1. [Paso 1: Crear Proyecto en Google Cloud Console](#paso-1-crear-proyecto-en-google-cloud-console)
2. [Paso 2: Habilitar las APIs Necesarias](#paso-2-habilitar-las-apis-necesarias)
3. [Paso 3: Configurar la Pantalla de Consentimiento OAuth](#paso-3-configurar-la-pantalla-de-consentimiento-oauth)
4. [Paso 4: Crear Credenciales OAuth 2.0](#paso-4-crear-credenciales-oauth-20)
5. [Paso 5: Descargar e Instalar `credentials.json`](#paso-5-descargar-e-instalar-credentialsjson)
6. [Paso 6: Configurar el Google Ads Developer Token (Explicación Detallada)](#paso-6-configurar-el-google-ads-developer-token)
7. [Paso 7: Verificación de Marca en Google (Para Quitar el Límite de 100 Usuarios)](#paso-7-verificacion-de-marca-en-google)

---

## 📌 Paso 1: Crear Proyecto en Google Cloud Console
1. Entra a [Google Cloud Console](https://console.cloud.google.com/) e inicia sesión con una cuenta corporativa.
2. En la barra superior, haz clic en el selector de proyectos ➔ **"Nuevo proyecto" (New Project)**.
3. Asigna el nombre al proyecto, por ejemplo: `Atalaya CRM`.
4. Haz clic en **"Crear"**.

---

## 📌 Paso 2: Habilitar las APIs Necesarias
1. En el menú lateral izquierdo, ve a **APIs y servicios** ➔ **Biblioteca (Library)**.
2. Busca e habilita las siguientes APIs:
   - **Google Ads API** *(para obtener campañas, grupos de anuncios y métricas)*.
   - **Gmail API** *(para envío y lectura de correos de clientes)*.
   - *(Opcional)* **Google Calendar API** *(para integraciones de agenda)*.

---

## 📌 Paso 3: Configurar la Pantalla de Consentimiento OAuth
1. En el menú lateral, ve a **APIs y servicios** ➔ **Pantalla de consentimiento de OAuth**.
2. Selecciona **"Externo" (External)** y haz clic en **Crear**.
3. Rellena los datos principales:
   - **Nombre de la aplicación:** `Atalaya CRM`
   - **Correo de soporte al usuario:** Tu correo electrónico.
   - **Dominios autorizados:** `atalaya.pe`
   - **Información de contacto del desarrollador:** Tu correo electrónico.
4. En el paso de **Permisos (Scopes)**, añade:
   - `https://www.googleapis.com/auth/adwords` (Google Ads)
   - `https://www.googleapis.com/auth/gmail.send` (Gmail)
   - `https://www.googleapis.com/auth/gmail.readonly` (Gmail)
5. En **Usuarios de prueba (Test users)**, añade tu correo personal/corporativo para probar.
6. **Publicar la App:** Vuelve a la pantalla principal de consentimiento y haz clic en **"Publicar aplicación" (Publish App)** para pasarla a Producción.

---

## 📌 Paso 4: Crear Credenciales OAuth 2.0
1. En el menú lateral, ve a **APIs y servicios** ➔ **Credenciales (Credentials)**.
2. Haz clic en **"+ Crear credenciales"** ➔ **ID de cliente de OAuth (OAuth Client ID)**.
3. Tipo de aplicación: **"Aplicación web" (Web application)**.
4. Nombre: `Atalaya CRM Client`.
5. En **Orígenes autorizados de JavaScript**:
   - `https://crm.atalaya.pe`
   - `http://localhost`
6. En **URIs de redireccionamiento autorizados (Authorized redirect URIs)**, agrega **exactamente**:
   - `https://crm.atalaya.pe/google-ads/callback`
   - `https://crm.atalaya.pe/gmail/callback`
   - `http://localhost/google-ads/callback`
   - `http://localhost/gmail/callback`
7. Haz clic en **Crear**.

---

## 📌 Paso 5: Descargar e Instalar `credentials.json`
1. En la ventana emergente de confirmación, haz clic en **"Descargar JSON"**.
2. Renombra el archivo descargado a: `credentials.json`.
3. Guárdalo en la ruta de tu servidor:
   `crm/storage/app/google/credentials.json`

Estructura esperada del JSON:
```json
{
  "web": {
    "client_id": "TU_NUEVO_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "atalaya-crm",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "TU_NUEVO_CLIENT_SECRET",
    "redirect_uris": [
      "https://crm.atalaya.pe/google-ads/callback",
      "https://crm.atalaya.pe/gmail/callback"
    ]
  }
}
```

---

## 📌 Paso 6: Configurar el Google Ads Developer Token

### 🧠 ¿Qué es y para qué sirve el Developer Token?
Para entender el Developer Token, imagínalo como una **"Licencia de Software para Desarrolladores"** emitida por Google Ads.

* **OAuth (`credentials.json` - Pasos 1 al 5):** Es el permiso que te da **el cliente** para que el CRM pueda ver los datos de su cuenta publicitaria.
* **Developer Token (Paso 6):** Es la llave que le da **Google Ads a tu CRM** para habilitar la capacidad técnica de hacer consultas (descargar campañas, impresiones, clics, costos). Sin este token, Google rechaza cualquier consulta de datos a la API de Ads.

---

### 🔑 Paso a Paso para obtener el Developer Token:

1. **Crear o usar una Cuenta de Administrador de Google Ads (MCC):**
   - Un **Developer Token** solo se emite a cuentas de administrador de Google Ads (MCC - My Client Center).
   - Si no tienes una cuenta MCC, crea una gratuitamente en: [Google Ads Manager Accounts](https://ads.google.com/home/tools/manager-accounts/).

2. **Acceder al Centro de API de Google Ads:**
   - Inicia sesión en tu cuenta de Administrador (MCC) de Google Ads.
   - En el menú superior, ve a **Herramientas y configuración (Tools & Settings)** ➔ **Configuración (Setup)** ➔ **Centro de API (API Center)**.

3. **Copiar o Solicitar el Developer Token:**
   - En la pantalla del **Centro de API**, verás un código alfanumérico de 22 caracteres. Ese es tu **Developer Token**.
   - **Niveles de Acceso del Token:**
     - **Test Access (Acceso de prueba):** Te permite hacer pruebas usando cuentas de prueba.
     - **Basic Access (Acceso básico - Recomendado):** Te permite realizar hasta 15,000 peticiones diarias a la API de Google Ads (más que suficiente para gestionar cientos de clientes en el CRM).
     - *Para solicitar Acceso Básico:* Simplemente llena el formulario breve en esa misma pantalla explicando que Atalaya CRM es un software de gestión de leads y reportes. Google suele aprobarlo rápidamente.

4. **Configurar el Token en el servidor CRM:**
   - Abre el archivo `.env` de tu servidor en la carpeta `crm/`:
     ```env
     GOOGLE_ADS_DEVELOPER_TOKEN=tu_token_de_22_caracteres_aqui
     ```
   - O bien asegúrate de que esté guardado en la base de datos del CRM bajo la configuración `google-ads-developer-token`.

---

## 📌 Paso 7: Verificación de Marca en Google (Para Quitar el Límite de 100 Usuarios)

### 🧐 ¿Qué significa el "Límite de 100 usuarios" de Google OAuth?
Al poner la aplicación **"En Producción"**, Google le otorga a la app un **límite inicial de 100 cuentas de Google distintas** para otorgar permisos. Este límite es una medida de seguridad temporal de Google para aplicaciones que no han sido verificadas oficialmente.

> ℹ️ **Nota:** Tu CRM **NO está limitado permanentemente a 100 clientes**. Puedes empezar a conectar hasta 100 cuentas de inmediato y luego solicitar la verificación para eliminar el límite por completo.

---

### 🛡️ Paso a Paso para Solicitar la Verificación Oficial de Google:

1. **Acceder a la Consola de Google Auth:**
   - En [Google Cloud Console](https://console.cloud.google.com/), ve al menú lateral izquierdo **Google Auth Platform** (o *APIs y servicios*).
   - Haz clic en **Centro de verificación (Verification Center)** o **Información de la marca (Brand Information)**.

2. **Completar los Datos de Marca:**
   - **Nombre de la app:** `Atalaya CRM`
   - **Logotipo de la app:** Sube el logo oficial de la empresa (formato PNG o JPG cuadrado).
   - **Dominio de la app:** `atalaya.pe`
   - **Enlace a la Política de Privacidad:** `https://atalaya.pe/politica-de-privacidad` (o tu URL de privacidad).
   - **Enlace a los Términos de Servicio:** `https://atalaya.pe/terminos` (opcional).

3. **Enviar para Revisión:**
   - Revisa que toda la información esté completa y haz clic en **"Enviar para verificación"**.
   - El equipo de revisión de Google procesará la solicitud en un plazo de **2 a 5 días hábiles**.

4. **Resultado de la Verificación:**
   - **Límite de usuarios eliminado:** El tope de 100 usuarios desaparece y tu CRM podrá conectar **clientes ilimitados**.
   - **Sin pantallas de advertencia:** Tus clientes se conectarán directamente mediante el flujo OAuth oficial de Google sin ver ninguna advertencia de "app no verificada".
