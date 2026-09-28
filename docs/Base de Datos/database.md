# Base de Datos

## Descripción

La aplicación utiliza MySQL como sistema de gestión de base de datos. El esquema se denomina `inventario_proformas` y contiene las entidades necesarias para gestionar empresas, usuarios, clientes, materiales, trabajos, proformas, pedidos, facturación, proveedores, solicitudes de materiales, autenticación, auditoría y operaciones relacionadas con inteligencia artificial.

## Índice

- [Descripción](#descripción)
- [Motor y esquema](#motor-y-esquema)
- [Modelo de datos](#modelo-de-datos)
- [Multiempresa](#multiempresa)
- [Integridad](#integridad)
- [Índices](#índices)
- [Triggers](#triggers)
- [Procedimientos](#procedimientos)
- [Migraciones](#migraciones)
- [Concurrencia](#concurrencia)
- [Documentación relacionada](#documentación-relacionada)

## Motor y esquema

| Característica | Valor |
|---|---|
| Sistema gestor | MySQL |
| Base de datos | `inventario_proformas` |
| Identificación principal | Claves primarias por entidad |
| Integridad referencial | Claves foráneas |
| Restricciones | `CHECK`, `UNIQUE` y `ENUM` |
| Automatización | Triggers |
| Procedimientos auxiliares | Procedimientos almacenados |

## Modelo de datos

El modelo de datos está organizado mediante entidades relacionadas que representan los principales procesos de la aplicación.

Las entidades se agrupan funcionalmente en:

| Área | Entidades principales |
|---|---|
| Empresas y usuarios | `empresas`, `usuarios`, `usuarios_sesiones` |
| Clientes | `clientes` |
| Materiales | `materiales`, `materiales_variantes`, `colores`, `material_colores` |
| Proveedores | `proveedores`, `proveedor_materiales` |
| Trabajos | `trabajos`, `recetas`, `trabajo_referencias` |
| Proformas | `proformas`, `proforma_items`, `proforma_detalle` |
| Pedidos | `pedidos`, `pedido_detalle` |
| Facturación | `facturas`, `factura_detalle`, `autorizaciones_sri` |
| Solicitudes de materiales | `solicitudes_materiales`, `solicitud_items` |
| Configuración | `configuracion`, `secuencias_comprobantes` |
| Autenticación | `password_resets`, `token_blacklist` |
| Inteligencia artificial | `ia_requests` |
| Auditoría | `auditoria_acciones` |

## Multiempresa

El modelo utiliza `empresa_id` en diferentes entidades para asociar los registros con una empresa.

Entre las principales entidades que utilizan este campo se encuentran:

- `usuarios`
- `clientes`
- `materiales`
- `colores`
- `proveedores`
- `trabajos`
- `proformas`
- `pedidos`
- `facturas`
- `ia_requests`
- `auditoria_acciones`

La relación con `empresas` se mantiene mediante claves foráneas.

El aislamiento de los datos entre empresas debe complementarse con las validaciones y filtros aplicados por la capa de acceso a datos de la aplicación.

## Integridad

La integridad del modelo se mantiene mediante diferentes mecanismos:

- Claves primarias.
- Claves foráneas.
- Restricciones `CHECK`.
- Restricciones `UNIQUE`.
- Valores `ENUM`.
- Reglas de eliminación.
- Relaciones entre entidades.

Las claves foráneas permiten mantener la consistencia entre registros relacionados y las restricciones limitan la persistencia de valores incompatibles con las reglas definidas por el esquema.

## Índices

El esquema contiene índices destinados a optimizar consultas frecuentes y operaciones de relación.

Se utilizan índices sobre campos como:

- `empresa_id`.
- Identificadores de usuarios.
- Fechas.
- Estados lógicos.
- Claves de documentos.
- Claves utilizadas en relaciones.
- Identificadores de sesiones y tokens.

La documentación específica de los índices se encuentra en:

`docs/Base de Datos/Indices/indices.md`

## Triggers

El esquema contiene triggers para mantener automáticamente determinados valores derivados.

Los triggers documentados actualmente corresponden a:

- Actualización de totales de facturas.
- Actualización de totales de pedidos.
- Actualización de totales de proformas.

La documentación específica se encuentra en:

`docs/Base de Datos/Triggers/triggers.md`

## Procedimientos

La base de datos contiene procedimientos auxiliares para operaciones condicionales sobre el esquema.

Entre ellos se encuentran:

- `_add_column_if_not_exists`
- `_crear_indice`

La documentación específica se encuentra en:

`docs/Base de Datos/Procedimientos/procedimientos.md`

## Migraciones

Los cambios estructurales de la base de datos deben gestionarse de forma controlada y reproducible.

Las modificaciones pueden involucrar:

- Tablas.
- Columnas.
- Índices.
- Claves foráneas.
- Restricciones.
- Triggers.
- Procedimientos.

La estrategia de migraciones se documenta en:

`docs/Base de Datos/Migraciones/migraciones.md`

## Concurrencia

Las operaciones que modifican información compartida deben considerar ejecuciones simultáneas.

Los principales puntos de atención son:

- Actualización de inventario.
- Generación de secuencias de comprobantes.
- Creación de documentos y sus detalles.
- Gestión de sesiones y tokens.
- Actualización de valores derivados.

La documentación específica de concurrencia se encuentra en:

`docs/Base de Datos/Concurrencia/concurrencia.md`

## Documentación relacionada

La documentación de la base de datos se encuentra organizada por áreas:

| Documento | Contenido |
|---|---|
| `Entidades/` | Documentación individual de las entidades. |
| `Relaciones/relaciones.md` | Relaciones entre entidades. |
| `Integridad/integridad.md` | Mecanismos de integridad del esquema. |
| `Indices/indices.md` | Índices y su propósito. |
| `Triggers/triggers.md` | Triggers definidos en el esquema. |
| `Procedimientos/procedimientos.md` | Procedimientos almacenados. |
| `Migraciones/migraciones.md` | Estrategia de cambios del esquema. |
| `Concurrencia/concurrencia.md` | Consideraciones de operaciones concurrentes. |
