# Lógica de Atribución Atalaya CRM (Meta & WhatsApp)

Este documento describe cómo el sistema identifica y registra a los prospectos (leads) según su origen de entrada tras las últimas actualizaciones en `MetaController.php`.

---

## 1. Leads desde Formularios de Meta (Lead Ads)
Prospectos que completan un formulario nativo en Facebook o Instagram.

| Campo | Valor Resultante | Nota |
| :--- | :--- | :--- |
| **Origen (source)** | `Meta` | Indica que proviene del ecosistema de anuncios. |
| **Red Social (origin)** | `Facebook` o `Instagram` | Detectado automáticamente por la plataforma de Meta. |
| **Registrado en (triggered_by)** | `Formulario Facebook` o `Formulario Instagram` | Identifica el método de registro. |
| **Campaña** | *[Nombre de la Campaña]* | Vinculación directa con el ID de campaña de Meta. |

---

## 2. Leads desde Anuncios "Click to WhatsApp"
Prospectos que hacen clic en un anuncio y son redirigidos a WhatsApp para iniciar un chat.

| Campo | Valor Resultante | Nota |
| :--- | :--- | :--- |
| **Origen (source)** | `Meta` | Se considera tráfico pagado. |
| **Red Social (origin)** | `Facebook` o `Instagram` | Se detecta el origen del anuncio que disparó el chat. |
| **Registrado en (triggered_by)** | `Click to WhatsApp` | **(Actualizado)** Valor estándar para todos los anuncios de mensaje. |
| **Campaña** | *[Nombre de la Campaña]* | Vinculación directa con el ID de campaña de Meta. |

---

## 3. Prospectos Orgánicos (WhatsApp Directo)
Nuevos usuarios que escriben directamente al número de WhatsApp sin interactuar con un anuncio previo.

| Campo | Valor Resultante | Nota |
| :--- | :--- | :--- |
| **Origen (source)** | `Organico` | **(Actualizado)** Ya no se marca como "Externo" por defecto. |
| **Red Social (origin)** | `Whatsapp` | El canal directo de comunicación. |
| **Registrado en (triggered_by)** | `Whatsapp API` | **(Actualizado)** Siempre se registra como `Whatsapp API` por ser el canal de entrada directo. |
| **Campaña** | `null` | No hay campaña asociada. |

---

## 4. Re-contacto de Cliente Existente
Cuando un cliente que ya está en la base de datos vuelve a escribir (ya sea por el mismo o por otro canal).

### Escenario A: Ya tiene una campaña previa
Si el cliente ya tenía una campaña asignada (ej. vino de un Formulario hace un mes):
- **SE MANTIENEN** los valores originales de `Origen`, `Red Social`, `Registrado en` y `Campaña`.
- **PROTECCIÓN:** No se sobrescribe su historia aunque ahora escriba orgánicamente.

### Escenario B: Cliente antiguo SIN campaña escribe desde un Anuncio
Si el cliente existía (ej. fue cargado manualmente o era orgánico) y ahora interactúa con un anuncio:
- **SE ACTUALIZA** la atribución a `Meta` y la campaña correspondiente.
- **REGISTRADO EN:** Se actualiza según el tipo de anuncio:
    - Si es anuncio de mensajes: `Click to WhatsApp`.
    - Si es un formulario: `Formulario Facebook` o `Formulario Instagram`.
- **PROPÓSITO:** Permitir la trazabilidad de la inversión publicitaria incluso en clientes antiguos.

---

## Verificación en Base de Datos
Puedes verificar estos estados ejecutando:
```sql
SELECT name, source, origin, triggered_by, campaign_id FROM clients ORDER BY created_at DESC LIMIT 10;
```
