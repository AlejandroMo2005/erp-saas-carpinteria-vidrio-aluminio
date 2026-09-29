# Gestión de Accesos

## 1. Propósito

Este documento establece los criterios para gestionar el acceso de usuarios a la plataforma ERP/SaaS.

La gestión de accesos comprende el ciclo de vida de las cuentas, autenticación, autorización, roles, sesiones, aislamiento por empresa, privilegios, revocación y revisión de accesos.

---

## 2. Alcance

Aplica a:

- Usuarios.
- Roles.
- Empresas.
- Autenticación.
- Autorización.
- Sesiones.
- Tokens.
- Recuperación de credenciales.
- Acceso a módulos.
- Acceso a recursos.
- Multi-tenancy.
- Auditoría.
- Frontend.
- Backend.
- CI/CD.
- Operación administrativa.

---

## 3. Principios

La gestión de accesos debe seguir:

1. Mínimo privilegio.
2. Denegación por defecto.
3. Necesidad de acceso.
4. Separación de responsabilidades.
5. Aislamiento por empresa.
6. Autenticación antes de autorización.
7. Revocación oportuna.
8. Trazabilidad.
9. Validación en backend.
10. Revisión periódica.

---

## 4. Modelo de identidad

La entidad `usuarios` contiene la identidad de acceso de la aplicación.

Entre sus atributos relacionados con seguridad se encuentran:

- Identificador.
- Empresa.
- Nombre.
- Nombre completo.
- Teléfono.
- Email.
- Cédula/RUC.
- Contraseña.
- Rol.
- Estado activo.
- Fechas de creación y actualización.
- Actividad.
- Identificadores de sesión/token.
- Información de recuperación.
- Eliminación lógica.

La información utilizada para autorización debe obtenerse del contexto autenticado y de las relaciones persistidas correspondientes.

---

## 5. Empresas

Cada usuario se encuentra asociado a una empresa mediante `empresa_id`.

El acceso a información empresarial debe quedar restringido a la empresa correspondiente.

La empresa constituye una frontera lógica de aislamiento para recursos como:

- Clientes.
- Materiales.
- Colores.
- Proveedores.
- Trabajos.
- Proformas.
- Pedidos.
- Facturación.
- Configuración.
- Registros relacionados.

---

## 6. Roles

El modelo de usuarios contempla los roles:

- `ADMIN`.
- `VENDEDOR`.
- `ALMACEN`.
- `CLIENTE`.

Los roles representan categorías generales de acceso.

No deben interpretarse como autorización automática para cualquier operación del módulo.

---

## 7. Matriz conceptual

| Rol | Administración | Ventas | Inventario | Facturación | Consulta |
|---|---|---|---|---|---|
| ADMIN | Sí | Según permisos | Según permisos | Según permisos | Sí |
| VENDEDOR | No | Según permisos | Consulta según operación | Según permisos | Sí |
| ALMACEN | No | Consulta según operación | Según permisos | Consulta según operación | Sí |
| CLIENTE | No | Recursos propios autorizados | No | Recursos propios autorizados | Limitada |

Esta tabla constituye una referencia conceptual y no sustituye la verificación de autorización en cada endpoint.

Los permisos concretos deben mantenerse alineados con la implementación real.

---

## 8. Autenticación

La autenticación debe determinar quién realiza la solicitud.

El flujo general es:

```text
Credenciales
    ↓
Validación
    ↓
Autenticación
    ↓
Creación de sesión/token
    ↓
Solicitud autenticada
```

Una solicitud no autenticada no debe acceder a recursos protegidos.

---

## 9. Autorización

La autorización determina qué puede realizar un usuario autenticado.

Debe evaluarse después de identificar al usuario y antes de ejecutar una operación protegida.

Conceptualmente:

```text
Usuario autenticado
        ↓
Rol
        ↓
Empresa
        ↓
Recurso
        ↓
Acción
        ↓
Permitido / Rechazado
```

---

## 10. Autorización a nivel de recurso

La pertenencia a un rol no es suficiente cuando el acceso depende de un recurso específico.

Debe comprobarse:

- Propietario del recurso.
- Empresa.
- Relación con el usuario.
- Estado del recurso.
- Acción solicitada.

Esto es especialmente relevante para:

- Clientes.
- Proformas.
- Pedidos.
- Facturas.
- Solicitudes.
- Sesiones.
- Configuración.

---

## 11. Multi-tenancy

El contexto de empresa debe mantenerse durante toda la operación.

El backend utiliza `req.empresaId` como parte del contexto de la solicitud.

Los componentes que consulten o modifiquen datos empresariales deben respetar este contexto.

No debe confiarse en un `empresa_id` proporcionado por el cliente cuando el servidor pueda determinarlo de forma segura a partir de la identidad autenticada.

---

## 12. Acceso administrativo

Las operaciones administrativas deben restringirse a los roles autorizados.

Entre las operaciones sensibles se encuentran:

- Gestión de usuarios.
- Gestión de roles.
- Configuración.
- Facturación.
- Anulación.
- Administración empresarial.
- Acceso a auditoría.
- Gestión de credenciales.

Cada operación debe verificar el permiso correspondiente.

---

## 13. Gestión de usuarios

La creación de usuarios debe contemplar:

- Empresa.
- Rol.
- Estado.
- Identidad.
- Credenciales.
- Datos requeridos.
- Permisos derivados.

La modificación de un usuario debe impedir que un usuario no autorizado eleve sus propios privilegios.

Los cambios relevantes deben quedar registrados cuando corresponda.

---

## 14. Altas

Al crear una cuenta se debe verificar:

- Identidad mínima requerida.
- Unicidad de los identificadores.
- Empresa.
- Rol permitido.
- Estado inicial.
- Credenciales.
- Reglas de validación.

No deben crearse cuentas con privilegios superiores a los necesarios para la función asignada.

---

## 15. Bajas

La desactivación de una cuenta debe impedir nuevos accesos cuando corresponda.

Cuando una cuenta se desactive, debe evaluarse también:

- Sesiones activas.
- Tokens.
- Refresh tokens.
- Accesos pendientes.
- Operaciones en curso.

La eliminación física no debe utilizarse cuando exista un requisito de conservación de trazabilidad.

---

## 16. Eliminación lógica

El modelo `usuarios` contempla `deleted_at`.

La eliminación lógica permite conservar información necesaria para trazabilidad y evitar reutilizaciones indebidas.

Las consultas normales deben excluir usuarios eliminados cuando corresponda.

Las operaciones administrativas deben tratar explícitamente los registros eliminados.

---

## 17. Cambios de rol

El cambio de rol es una operación sensible.

Debe:

- Requerir autorización.
- Validar el nuevo rol.
- Mantener la empresa correcta.
- Evitar autoelevación.
- Registrar la operación cuando corresponda.
- Considerar la invalidación de sesiones si el cambio lo requiere.

Un cambio de rol no debe permitir que un usuario obtenga privilegios adicionales mediante manipulación del frontend.

---

## 18. Sesiones

Las sesiones persistidas se representan mediante `usuarios_sesiones`.

La información relacionada incluye:

- Usuario.
- Hash del token.
- IP.
- User-Agent.
- Expiración.
- Creación.
- Último uso.

El almacenamiento de un hash permite evitar conservar directamente el token de sesión en texto recuperable.

---

## 19. Refresh tokens

Los refresh tokens deben manejarse como credenciales sensibles.

Deben contemplarse:

- Expiración.
- Revocación.
- Rotación cuando corresponda.
- Invalidación.
- Protección contra reutilización.
- No exposición en logs.

El frontend no debe recibir secretos internos utilizados para gestionar la sesión.

---

## 20. Token blacklist

La tabla `token_blacklist` permite registrar identificadores de tokens revocados.

Contiene:

- `jti`.
- `expires_at`.
- `created_at`.

El mecanismo debe utilizar la expiración para evitar conservar indefinidamente registros que ya no sean necesarios.

---

## 21. Logout

El cierre de sesión debe invalidar el acceso correspondiente.

Dependiendo del mecanismo utilizado, esto puede implicar:

- Revocación del token.
- Eliminación de sesión.
- Invalidación del refresh token.
- Limpieza de cookies.
- Actualización del estado correspondiente.

El usuario no debe poder reutilizar una credencial que haya sido explícitamente revocada.

---

## 22. Expiración

Las sesiones y tokens deben tener una vigencia limitada.

La expiración debe verificarse en el backend.

No debe confiarse únicamente en temporizadores o estado almacenado en el navegador.

---

## 23. Recuperación de acceso

El proceso de recuperación debe permitir restablecer credenciales sin revelar información innecesaria sobre la existencia de cuentas.

Debe controlar:

- Código.
- Token.
- Expiración.
- Uso único.
- Intentos.
- Sesiones existentes.
- Revocación.

La entidad `password_resets` almacena información asociada a este flujo.

---

## 24. Contraseñas

Las contraseñas deben:

- Validarse.
- Almacenarse mediante hash seguro.
- Nunca registrarse en logs.
- No enviarse al frontend después de la autenticación.
- Ser reemplazadas mediante procesos controlados.

Los cambios de contraseña deben considerar la invalidación de sesiones cuando la política de seguridad lo requiera.

---

## 25. Protección contra fuerza bruta

Los procesos de autenticación y recuperación deben contar con controles contra intentos repetitivos.

Deben considerarse:

- Rate limiting.
- Bloqueos temporales cuando corresponda.
- Registro de intentos fallidos.
- Respuestas controladas.
- Monitoreo.

La protección no debe permitir una denegación de servicio fácil contra usuarios legítimos.

---

## 26. Enumeración de usuarios

Las respuestas de autenticación y recuperación deben evitar revelar innecesariamente:

- Si un email existe.
- Si una cédula está registrada.
- Si un usuario pertenece a determinada empresa.
- Si una cuenta está activa.

Cuando la lógica de negocio requiera diferenciar estados, debe evaluarse el impacto de esa información.

---

## 27. Acceso al frontend

El frontend puede ocultar funcionalidades según el rol, pero esta medida es únicamente de presentación.

La autorización efectiva debe realizarse en el backend.

Por tanto:

```text
Frontend
  ↓
Oculta / muestra interfaz

Backend
  ↓
Autoriza / rechaza operación
```

Modificar el JavaScript del navegador no debe permitir saltarse los controles del servidor.

---

## 28. Acceso a API

Cada endpoint protegido debe definir:

- Requisito de autenticación.
- Rol requerido cuando corresponda.
- Empresa aplicable.
- Recurso.
- Acción.
- Validaciones.
- Condiciones de rechazo.

Los endpoints nuevos deben incorporarse a la matriz de permisos antes de considerarse terminados.

---

## 29. Acceso a datos sensibles

El acceso debe limitarse a los datos necesarios para realizar la operación.

Debe evitarse devolver información interna que no sea requerida por el cliente.

Las respuestas deben aplicar el principio de minimización de datos.

---

## 30. Facturación

El acceso a facturación debe considerar:

- Empresa.
- Rol.
- Estado de la factura.
- Operación solicitada.
- Usuario.
- Reglas de negocio.

Operaciones como emisión, autorización, devolución o anulación requieren controles específicos.

---

## 31. Inventario

El acceso a inventario debe considerar las funciones del usuario.

Las operaciones sensibles incluyen:

- Crear material.
- Modificar material.
- Modificar stock.
- Gestionar variantes.
- Gestionar proveedores.
- Consultar disponibilidad.

Los usuarios deben recibir únicamente los permisos necesarios.

---

## 32. Proformas y pedidos

El acceso a proformas y pedidos debe comprobar:

- Empresa.
- Usuario.
- Rol.
- Propiedad o relación del recurso.
- Estado.
- Acción solicitada.

No debe ser suficiente conocer el identificador numérico de un registro para acceder a él.

---

## 33. Auditoría de accesos

La tabla `auditoria_acciones` contempla eventos relacionados con:

- Login.
- Login fallido.
- Logout.
- Refresh token.
- Cambio de contraseña.

Estos eventos permiten investigar actividad relacionada con cuentas y sesiones.

La auditoría no debe convertirse en un mecanismo para almacenar credenciales.

---

## 34. Logs y datos de acceso

Los logs pueden contener información operacional como IP o User-Agent cuando sea necesario para seguridad y auditoría.

Debe evitarse registrar:

- Contraseñas.
- Tokens completos.
- Cookies sensibles.
- API keys.
- Secretos.
- Datos innecesarios.

Los valores controlados por el usuario deben tratarse para reducir riesgos de inyección en logs.

---

## 35. Principio de mínimo privilegio

Cada usuario debe recibir únicamente los permisos necesarios para realizar sus funciones.

La asignación debe considerar:

```text
Función laboral
      ↓
Módulos necesarios
      ↓
Acciones necesarias
      ↓
Recursos necesarios
```

No se deben asignar privilegios administrativos como solución genérica a errores de autorización.

---

## 36. Separación de responsabilidades

Las operaciones críticas deben evitar concentrar todas las capacidades en un único rol cuando la naturaleza del proceso permita una separación razonable.

Debe evaluarse especialmente:

- Administración de usuarios.
- Gestión de inventario.
- Facturación.
- Anulación.
- Configuración.
- Auditoría.

La separación debe corresponder a las necesidades reales del negocio.

---

## 37. Acceso de clientes

El rol `CLIENTE` debe disponer de acceso limitado.

El backend debe impedir que un cliente pueda consultar o modificar:

- Otros clientes.
- Materiales administrativos.
- Configuración empresarial.
- Usuarios.
- Facturas de terceros.
- Recursos pertenecientes a otras empresas.

La autorización debe verificarse en servidor.

---

## 38. Acceso entre empresas

Debe existir aislamiento explícito entre empresas.

Una prueba de seguridad debe intentar:

```text
Usuario Empresa A
        ↓
ID recurso Empresa B
        ↓
Solicitud
        ↓
Rechazo
```

Debe comprobarse tanto la lectura como la modificación y eliminación.

---

## 39. Pruebas de autorización

Las pruebas deben cubrir como mínimo:

- Usuario no autenticado.
- Usuario autenticado.
- Rol autorizado.
- Rol no autorizado.
- Empresa correcta.
- Empresa incorrecta.
- Recurso inexistente.
- Recurso perteneciente a otro usuario.
- Recurso perteneciente a otra empresa.
- Token expirado.
- Token revocado.

---

## 40. Pruebas de escalada de privilegios

Deben probarse escenarios como:

- Cliente intentando acceder a administración.
- Vendedor intentando modificar roles.
- Almacén intentando ejecutar operaciones administrativas.
- Usuario modificando su propio rol.
- Usuario modificando `empresa_id`.
- Usuario accediendo a IDs de otra empresa.
- Manipulación de payload.
- Manipulación directa de solicitudes HTTP.

El resultado esperado debe ser un rechazo controlado.

---

## 41. Revisión de permisos

Los permisos deben revisarse cuando:

- Se agregue un módulo.
- Se agregue un endpoint.
- Se agregue un rol.
- Se modifique una entidad.
- Se cambie una regla de negocio.
- Se migre arquitectura.
- Se detecte una vulnerabilidad.

La matriz documental debe mantenerse sincronizada con la implementación real.

---

## 42. Revocación administrativa

Cuando exista evidencia de compromiso de una cuenta, debe poderse limitar el acceso mediante:

- Desactivación.
- Revocación de sesiones.
- Revocación de tokens.
- Cambio de contraseña.
- Invalidación de credenciales.
- Investigación de auditoría.

La respuesta concreta depende del tipo de compromiso.

---

## 43. Acceso durante incidentes

Durante un incidente de seguridad deben priorizarse:

1. Contención.
2. Revocación de accesos comprometidos.
3. Preservación de evidencia.
4. Recuperación controlada.
5. Verificación.

No deben eliminarse indiscriminadamente registros de auditoría o logs necesarios para investigar.

---

## 44. CI/CD

Los cambios relacionados con autorización deben pasar por:

- Lint.
- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E cuando correspondan.
- Análisis estático.
- Revisión de seguridad.

Los cambios de permisos no deben aprobarse únicamente porque la interfaz funcione correctamente.

---

## 45. Evidencia

La gestión de accesos debe respaldarse mediante:

- Pruebas automatizadas.
- Resultados de CI.
- Casos de autorización.
- Casos multi-tenant.
- Registros de auditoría.
- Resultados de análisis estático.
- Evidencia de revisión.
- Documentación de cambios.

La evidencia debe permitir relacionar el requisito de acceso con su implementación y prueba.

---

## 46. Estado actual

La plataforma contempla:

- Roles `ADMIN`, `VENDEDOR`, `ALMACEN` y `CLIENTE`.
- Asociación usuario-empresa.
- Contexto `req.empresaId`.
- Autenticación mediante tokens.
- Identificación mediante `jti`.
- Blacklist de tokens.
- Sesiones persistidas.
- Auditoría de eventos de autenticación.
- Recuperación de contraseña.
- Middleware de protección.

La cobertura detallada de permisos por endpoint debe mantenerse en verificación conforme continúe la migración y consolidación de la arquitectura backend.

---

## 47. Criterios de aceptación

La gestión de accesos se considera adecuadamente cubierta cuando:

- Cada usuario tiene una identidad única.
- Cada usuario pertenece a una empresa válida.
- Los roles están definidos.
- Los endpoints privados requieren autenticación.
- Las operaciones protegidas verifican autorización.
- Los recursos respetan el tenant.
- Los usuarios no pueden elevar privilegios mediante el cliente.
- Las sesiones pueden revocarse.
- Los tokens revocados son rechazados.
- La recuperación de acceso está controlada.
- Los eventos relevantes pueden auditarse.
- Los permisos cuentan con pruebas.
- Los cambios de autorización pasan por CI.
- La documentación permanece alineada con la implementación.

---

## 48. Mantenimiento

Este documento debe actualizarse cuando cambien:

- Roles.
- Permisos.
- Usuarios.
- Autenticación.
- Sesiones.
- Tokens.
- Multi-tenancy.
- Endpoints.
- Módulos.
- Facturación.
- Inventario.
- Proformas.
- Pedidos.
- Auditoría.
- Recuperación de contraseña.

Cualquier cambio de autorización debe evaluarse también desde la perspectiva de aislamiento entre empresas y escalada de privilegios.
