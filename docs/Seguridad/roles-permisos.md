# Roles y Permisos

## Propósito

Este documento define la estructura de autorización de la plataforma ERP/SaaS y establece los criterios para controlar el acceso a funcionalidades y recursos según el rol del usuario y su empresa.

La autenticación identifica al usuario. La autorización determina qué operaciones puede realizar ese usuario sobre los recursos a los que tiene acceso.

Los permisos deben verificarse en el backend. Las restricciones visuales del frontend no constituyen un mecanismo suficiente de seguridad.

## Roles definidos

La tabla `usuarios` contempla los siguientes roles:

| Rol | Descripción funcional |
|---|---|
| `ADMIN` | Usuario con responsabilidades administrativas sobre la empresa |
| `VENDEDOR` | Usuario orientado a gestión comercial |
| `ALMACEN` | Usuario orientado a inventario y operaciones de almacén |
| `CLIENTE` | Usuario con acceso limitado a funcionalidades destinadas al cliente |

Los permisos efectivos deben mantenerse alineados con las reglas de negocio reales.

## Principios de autorización

La autorización se basa en:

- mínimo privilegio;
- separación de responsabilidades;
- autenticación previa;
- autorización en backend;
- aislamiento por empresa;
- autorización a nivel de recurso;
- validación de operaciones sensibles;
- trazabilidad de acciones relevantes.

Un usuario no debe obtener permisos adicionales simplemente modificando una solicitud HTTP.

## Contexto de autorización

Una solicitud protegida puede representarse como:

```text
Solicitud
   |
   v
Identidad
   |
   v
Sesión válida
   |
   v
Rol
   |
   v
Empresa
   |
   v
Recurso
   |
   v
Operación permitida
```

La autorización completa puede requerir todas estas dimensiones.

Por ejemplo, conocer que un usuario tiene rol `VENDEDOR` no es suficiente para permitirle modificar cualquier proforma. También debe comprobarse que el recurso pertenece a su empresa y que la operación está permitida.

## Autorización basada en rol

El rol proporciona una primera dimensión de autorización.

Ejemplo conceptual:

```text
ADMIN
  ├── administración
  ├── usuarios
  ├── inventario
  ├── ventas
  └── facturación

VENDEDOR
  ├── clientes
  ├── proformas
  └── pedidos

ALMACEN
  ├── materiales
  ├── inventario
  └── operaciones de almacén

CLIENTE
  └── funcionalidades destinadas al cliente
```

Esta representación es conceptual. El conjunto exacto de endpoints permitidos debe derivarse de las rutas y reglas de negocio vigentes.

## Aislamiento por empresa

El rol no reemplaza el aislamiento multi-tenant.

Una autorización válida requiere considerar la empresa asociada al usuario.

Ejemplo:

```text
Usuario
empresa_id = 1
rol = VENDEDOR

        |

        v

Proforma
empresa_id = 1
```

La operación puede continuar si las demás reglas también se cumplen.

Si el recurso pertenece a otra empresa:

```text
Usuario
empresa_id = 1

        |

        X

Proforma
empresa_id = 2
```

la operación debe rechazarse.

## Autorización a nivel de recurso

Las operaciones que reciben identificadores deben verificar la pertenencia del recurso.

Ejemplo:

```text
GET /api/proformas/:id
```

El backend debe comprobar:

1. identidad;
2. sesión;
3. rol;
4. empresa;
5. existencia del recurso;
6. permiso para la operación.

No debe asumirse que conocer `id` implica autorización.

## Matriz conceptual de permisos

| Área | ADMIN | VENDEDOR | ALMACEN | CLIENTE |
|---|---:|---:|---:|---:|
| Usuarios | Sí | No | No | No |
| Configuración | Sí | No | No | No |
| Clientes | Sí | Sí | Según necesidad | Limitado |
| Materiales | Sí | Consulta | Sí | Consulta limitada |
| Inventario | Sí | Consulta | Sí | No |
| Proveedores | Sí | Según necesidad | Sí | No |
| Trabajos | Sí | Consulta/uso | Consulta | No |
| Proformas | Sí | Sí | Consulta | Limitado |
| Pedidos | Sí | Sí | Gestión operativa | Limitado |
| Facturación | Sí | Según permiso | Consulta | Consulta limitada |
| IA | Sí | Según necesidad | Según necesidad | Según funcionalidad |
| Auditoría | Sí | No | No | No |

Esta matriz representa una estructura de referencia. No debe utilizarse como evidencia de que cada permiso ya está configurado en todos los endpoints.

## Administración de usuarios

Las operaciones administrativas sobre usuarios deben estar restringidas.

Entre las operaciones sensibles se encuentran:

- creación de usuarios;
- modificación de roles;
- activación;
- desactivación;
- cambio de credenciales;
- eliminación lógica;
- revisión de sesiones.

La modificación de un rol debe requerir autorización administrativa.

Un usuario no debe poder asignarse a sí mismo un rol superior mediante una solicitud manipulada.

## Clientes

Las operaciones sobre clientes deben respetar el contexto de empresa.

Operaciones típicas:

- consultar;
- crear;
- actualizar;
- desactivar;
- utilizar en proformas;
- utilizar en pedidos;
- utilizar en facturación.

La autorización debe comprobarse tanto en el endpoint directo como en las operaciones que utilicen el cliente indirectamente.

## Materiales

Las operaciones sobre materiales deben distinguir entre consulta y modificación.

Operaciones sensibles:

- crear material;
- modificar precio;
- modificar stock;
- eliminar lógicamente;
- gestionar variantes;
- asociar colores.

Las modificaciones deben verificar rol y empresa.

## Inventario

Las operaciones de inventario requieren controles adicionales porque afectan cantidades persistentes.

Antes de modificar stock deben validarse:

- identidad;
- rol;
- empresa;
- material;
- cantidad;
- reglas de negocio;
- estado de la operación.

Cuando exista concurrencia, la autorización debe complementarse con controles de consistencia y transacciones.

## Proveedores

Los proveedores pertenecen a una empresa.

Las operaciones deben comprobar:

```text
usuario.empresa_id
        =
proveedor.empresa_id
```

No debe permitirse consultar o modificar proveedores de otra empresa.

## Trabajos

Los trabajos se encuentran asociados a una empresa.

Las operaciones sobre trabajos y sus referencias deben mantener el mismo aislamiento.

Las funcionalidades de IA relacionadas con trabajos también deben comprobar el contexto de empresa.

## Proformas

Las proformas representan información comercial.

Las operaciones deben comprobar:

- empresa;
- usuario;
- rol;
- recurso;
- estado cuando corresponda.

Las operaciones sensibles incluyen:

- crear;
- modificar;
- eliminar lógicamente;
- consultar;
- generar documentos;
- convertir o asociar operaciones posteriores.

## Pedidos

Los pedidos deben mantener el aislamiento de empresa y respetar las reglas de transición de estado.

Una autorización válida no implica que cualquier usuario pueda realizar cualquier transición.

Ejemplo conceptual:

```text
PENDIENTE
   |
   v
PROCESADO
   |
   v
ENTREGADO
```

Las transiciones deben validarse según las reglas del dominio.

Las operaciones de cancelación también requieren controles específicos.

## Facturación

Las operaciones de facturación requieren autorización reforzada debido a su impacto comercial y tributario.

Debe controlarse:

- creación;
- emisión;
- autorización;
- anulación;
- devolución;
- consulta;
- modificación permitida;
- numeración.

El cliente no debe poder establecer directamente un estado privilegiado mediante un parámetro enviado al backend.

## Auditoría

Las operaciones sensibles deben generar trazabilidad cuando corresponda.

La autorización y la auditoría cumplen funciones diferentes:

```text
Autorización
    |
    +--> ¿Puede realizar la operación?

Auditoría
    |
    +--> ¿Qué operación ocurrió?
```

Los eventos relevantes pueden asociarse al usuario y empresa correspondientes.

## IA

El acceso a funciones de IA debe depender de:

- autenticación;
- autorización;
- empresa;
- funcionalidad disponible;
- límites de consumo.

Las imágenes y prompts deben procesarse dentro del contexto autorizado.

Una solicitud de IA no debe permitir que un usuario consulte referencias, resultados o recursos pertenecientes a otra empresa.

## Sesiones

Las sesiones representan una dimensión adicional de autorización.

Antes de permitir una operación protegida debe comprobarse que:

- el token sea válido;
- no esté expirado;
- no esté revocado;
- la sesión corresponda al usuario;
- el usuario permanezca activo cuando corresponda.

## Denegación de acceso

Cuando una solicitud no está autorizada, el backend debe devolver una respuesta controlada.

Los errores no deben revelar:

- información de otro usuario;
- existencia innecesaria de recursos;
- datos internos;
- credenciales;
- detalles de infraestructura.

Las respuestas deben ser coherentes con la semántica HTTP utilizada por la API.

## Frontend

El frontend puede utilizar el rol para:

- mostrar u ocultar opciones;
- controlar navegación;
- mejorar experiencia de usuario;
- evitar solicitudes innecesarias.

Sin embargo:

```text
Frontend
   |
   X  no es frontera de seguridad
   |
Backend
   |
   v
Autorización real
```

Un usuario puede modificar manualmente solicitudes, por lo que toda autorización relevante debe repetirse en el backend.

## Backend

El backend debe aplicar la autorización antes de ejecutar operaciones protegidas.

Una estructura conceptual es:

```text
router
   |
   v
authentication
   |
   v
authorization
   |
   v
tenant context
   |
   v
validation
   |
   v
controller / handler
   |
   v
service
   |
   v
repository
```

La distribución concreta puede variar según el módulo, pero las responsabilidades deben mantenerse separadas.

## Repositorios

Los repositorios deben evitar consultas que permitan omitir accidentalmente el contexto de empresa.

En recursos multi-tenant, una consulta conceptual como:

```sql
SELECT *
FROM proformas
WHERE id = ?
```

puede ser insuficiente para una operación autorizada.

Debe incorporarse el contexto de empresa cuando corresponda:

```sql
SELECT *
FROM proformas
WHERE id = ?
  AND empresa_id = ?
```

El objetivo es que el aislamiento forme parte de la operación de acceso al recurso y no dependa exclusivamente de una comprobación previa.

## Servicios

Los servicios deben mantener las reglas de negocio relacionadas con permisos y contexto cuando estas no puedan expresarse únicamente mediante middleware.

Por ejemplo, una transición de estado puede requerir:

```text
rol permitido
+
empresa correcta
+
estado actual válido
+
transición válida
```

## Pruebas de autorización

Las pruebas deben cubrir tanto casos positivos como negativos.

### Casos positivos

- usuario autenticado con rol permitido;
- recurso perteneciente a la empresa correcta;
- operación válida;
- estado compatible.

### Casos negativos

- usuario no autenticado;
- token expirado;
- token revocado;
- rol insuficiente;
- recurso de otra empresa;
- identificador inexistente;
- transición de estado inválida;
- empresa manipulada;
- operación administrativa desde un rol no autorizado.

## Pruebas de multi-tenancy

Se recomienda utilizar al menos dos empresas de prueba:

```text
Empresa A
  Usuario A
  Recursos A

Empresa B
  Usuario B
  Recursos B
```

Las pruebas deben verificar que:

```text
Usuario A -> Recursos A = permitido según rol
Usuario A -> Recursos B = rechazado
Usuario B -> Recursos B = permitido según rol
Usuario B -> Recursos A = rechazado
```

Esto debe probarse con diferentes entidades y no únicamente con una ruta.

## Casos de manipulación

Las pruebas deben modificar directamente solicitudes para comprobar que la autorización no depende del frontend.

Ejemplos:

```json
{
  "empresa_id": 999
}
```

```json
{
  "rol": "ADMIN"
}
```

```json
{
  "estado": "AUTORIZADA"
}
```

Estos valores no deben ser aceptados únicamente porque el esquema de entrada tenga el formato correcto.

La validación sintáctica y la autorización son controles diferentes.

## Principio de mínimo privilegio

Cada rol debe disponer únicamente de los permisos necesarios para realizar sus funciones.

La ampliación de permisos debe justificarse por una necesidad funcional.

Los permisos administrativos deben limitarse a usuarios que realmente requieran dichas capacidades.

## Separación de responsabilidades

Cuando una operación pueda afectar significativamente al negocio, deben revisarse las responsabilidades asignadas a cada rol.

Por ejemplo:

```text
Venta
  |
  v
Proforma
  |
  v
Pedido
  |
  v
Inventario
  |
  v
Facturación
```

No debe asumirse que un único rol necesita acceso irrestricto a todos los pasos.

La separación concreta depende de las reglas funcionales del sistema.

## Revisión de permisos

La matriz debe revisarse cuando:

- se agregue un nuevo módulo;
- aparezca un nuevo endpoint;
- se agregue un rol;
- cambien las reglas de negocio;
- se modifique multi-tenancy;
- se agregue una operación administrativa;
- se incorpore una integración externa.

## Evidencia

La autorización debe respaldarse mediante:

- pruebas unitarias;
- pruebas de integración;
- pruebas E2E;
- revisión de middleware;
- revisión de repositorios;
- análisis de SonarCloud;
- pruebas multi-tenant;
- resultados de CI/CD.

La documentación de un permiso no demuestra por sí misma que el permiso esté aplicado correctamente.

## Criterios de aceptación

Una operación protegida se considera correctamente autorizada cuando:

1. el usuario está autenticado;
2. la sesión es válida;
3. el rol permite la operación;
4. el recurso pertenece a la empresa correcta;
5. la operación cumple las reglas de negocio;
6. la entrada ha sido validada;
7. la operación se ejecuta en el contexto autorizado;
8. las pruebas correspondientes verifican el comportamiento.

## Mantenimiento

Los cambios de permisos deben actualizar:

- esta matriz;
- las pruebas;
- la documentación de API cuando corresponda;
- los flujos afectados;
- la matriz de trazabilidad;
- los riesgos relacionados.

No deben agregarse permisos únicamente para solucionar errores de interfaz o pruebas sin analizar primero la regla de negocio y el modelo de seguridad.
