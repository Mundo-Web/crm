# Plan de Implementación - Sincronización de Jerarquía de Campañas de Meta

El objetivo es permitir a los usuarios ver la estructura completa de sus esfuerzos de marketing en Meta dentro del CRM, yendo más allá del nombre de la campaña para incluir Conjuntos de Anuncios (Ad Sets) y Anuncios individuales (Ads).

## Revisión del Usuario Requerida

> [!IMPORTANT]
> - Este cambio requiere el uso de la API de Marketing de Meta. Asumimos que el `meta_access_token` actual tiene los permisos necesarios (`ads_read` y `ads_management`).
> - Propongo una interfaz **Maestro-Detalle** en la tabla de Campañas para mostrar los Conjuntos de Anuncios, y otro nivel para los Anuncios.

## Cambios Propuestos

### Base de Datos

#### [NUEVO] [create_ad_sets_table.php](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/database/migrations/xxxx_xx_xx_create_ad_sets_table.php)
Crear una tabla para almacenar los Conjuntos de Anuncios (Ad Sets), vinculados a las Campañas.

#### [NUEVO] [create_ads_table.php](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/database/migrations/xxxx_xx_xx_create_ads_table.php)
Crear una tabla para almacenar los Anuncios (Ads), vinculados a los Conjuntos de Anuncios.

### Backend

#### [NUEVO] [AdSet.php](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/app/Models/AdSet.php)
Modelo para los Conjuntos de Anuncios.

#### [NUEVO] [Ad.php](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/app/Models/Ad.php)
Modelo para los Anuncios.

#### [MODIFICAR] [MetaController.php](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/app/Http/Controllers/MetaController.php)
- Añadir un método `syncCampaigns` para obtener Campañas, Conjuntos de Anuncios y Anuncios desde la API de Marketing de Meta.

#### [MODIFICAR] [CampaignController.php](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/app/Http/Controllers/CampaignController.php)
- Añadir un endpoint para activar el proceso de sincronización.

### Frontend

#### [MODIFICAR] [Campaigns.jsx](file:///c:/xampp/htdocs/projects/atalaya_crm/crm/resources/js/Campaigns.jsx)
- Añadir un botón "Sincronizar con Meta" en la barra de herramientas.
- Implementar Maestro-Detalle de DevExtreme para mostrar Conjuntos de Anuncios al expandir una Campaña.
- Implementar otro nivel de detalle para mostrar Anuncios al expandir un Conjunto de Anuncios.

## Preguntas Abiertas

> [!NOTE]
> 1. **Persistente vs. Al momento**: ¿Deberíamos guardar todos los Conjuntos y Anuncios en la base de datos, o simplemente consultarlos a Meta cada vez que hagas clic en "Expandir"? Guardarlos es mejor para la velocidad y el seguimiento histórico.
> 2. **Alcance de la Sincronización**: ¿Deberíamos sincronizar *todas* las campañas de la cuenta de Meta, o solo actualizar las que ya están en el CRM?
