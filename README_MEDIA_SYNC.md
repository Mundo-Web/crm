# Sincronización de Multimedia de WhatsApp

Este documento detalla el problema identificado con la sincronización de archivos multimedia (imágenes, audios, documentos) en el CRM y la solución implementada.

## El Problema

Anteriormente, el sistema presentaba las siguientes deficiencias al recibir mensajes multimedia a través de la API oficial de WhatsApp (Meta):

1. **Falta de Captura**: El `MetaController` solo estaba extrayendo el cuerpo de texto de los mensajes entrantes. Si un cliente enviaba una imagen o un audio, el sistema simplemente ignoraba el contenido multimedia o guardaba un mensaje vacío.
2. **Almacenamiento Inexistente**: No existía una lógica para descargar los archivos desde los servidores de Meta. Los mensajes de WhatsApp de Meta no envían el archivo directamente, sino un `media_id` que debe ser consultado para obtener una URL de descarga temporal.
3. **Incompatibilidad de Rutas**: Los archivos enviados desde el CRM se guardaban en una carpeta privada (`storage/app/images/whatsapp`) que no era accesible vía URL pública, lo que impedía que el frontend (`Chat.jsx`) o la propia API de WhatsApp pudieran visualizar/descargar los archivos.
4. **Formato de Mensaje**: El frontend espera prefijos específicos como `/image:`, `/audio:` o `/document:` para renderizar los componentes adecuados (como el reproductor de audio o el visor de imágenes). Estos prefijos no se estaban generando para los mensajes entrantes.

## La Solución Implementada

Se han realizado cambios estructurales en los controladores para resolver estos problemas:

### 1. Descarga Automática de Meta
Se implementó el método `getAndSaveMediaFromMeta` en `MetaController.php`. Este método:
- Consulta la información del medio en Meta usando el `media_id`.
- Obtiene la URL de descarga segura.
- Descarga el contenido binario y lo guarda localmente con una extensión adecuada basada en el `mime_type`.

### 2. Estandarización de Almacenamiento Público
Se han actualizado `MetaController`, `WhatsAppController` y `WebhookController` para guardar todos los archivos en:
`storage/app/public/images/whatsapp/`

Esto asegura que, una vez creado el enlace simbólico de Laravel, los archivos sean accesibles públicamente a través de:
`{URL_APP}/storage/images/whatsapp/`

### 3. Formateo de Mensajes Entrantes
El webhook de Meta ahora detecta el tipo de mensaje (`image`, `audio`, `voice`, `document`, `video`) y formatea el contenido del mensaje en la base de datos con los prefijos que el frontend reconoce, incluyendo el nombre del archivo guardado y el comentario (caption) si existe.

## Requisitos para el Funcionamiento Correcto

Para que los cambios surtan efecto y las imágenes sean visibles en el navegador, **es obligatorio** ejecutar el siguiente comando en la terminal del servidor:

```bash
php artisan storage:link
```

Esto creará el acceso directo necesario desde la carpeta pública hacia la carpeta de almacenamiento de archivos.

## Resumen de Cambios Técnicos
- **MetaController.php**: Nuevo motor de descarga de medios y actualización del procesamiento de webhooks.
- **WhatsAppController.php**: Cambio de disco de almacenamiento de `local` a `public`.
- **WebhookController.php**: Cambio de ruta de almacenamiento a la carpeta `public`.
- **Base de Datos**: Se añadieron los campos `message_id` y `mask` al registro de mensajes de Meta para mayor trazabilidad y soporte de nombres de archivo originales.
