# Catálogo de Endpoints

## 1. Propósito

Este documento establece la estructura del catálogo de endpoints de la API REST de la plataforma ERP/SaaS.

Su objetivo es mantener una referencia organizada de los recursos HTTP, sus responsabilidades, controles de acceso, validaciones, respuestas y relaciones con los módulos internos.

El catálogo debe mantenerse sincronizado con la implementación real de la API.

---

## 2. Alcance

El catálogo considera los endpoints asociados con:

- Autenticación.
- Sesiones.
- Usuarios.
- Clientes.
- Materiales.
- Colores.
- Inventario.
- Proveedores.
- Trabajos.
- Proformas.
- Pedidos.
- Facturación.
- Configuración.
- Auditoría.
- IA.
- Integraciones externas.

Los endpoints exactos deben verificarse contra las rutas registradas por el backend antes de utilizar este documento como contrato operativo.

---

## 3. Convenciones

La API utiliza HTTP como mecanismo de comunicación entre frontend y backend.

Los métodos principales son:

| Método | Uso |
|---|---|
| `GET` | Consulta de información |
| `POST` | Creación o ejecución de operaciones |
| `PUT` | Actualización completa o definida por el recurso |
| `PATCH` | Actualización parcial cuando corresponda |
| `DELETE` | Eliminación o desactivación |

El método utilizado debe corresponder con la semántica real del endpoint.

---

## 4. Base de la API

El frontend consume la API mediante Axios.

La configuración del frontend utiliza:

```text
VITE_API_URL || /api
```

Durante desarrollo, Vite puede utilizar un proxy para dirigir las solicitudes `/api` hacia el backend.

La URL concreta de producción depende de la infraestructura de despliegue.

---

## 5. Autenticación

Los endpoints protegidos requieren una sesión válida.

El mecanismo de autenticación utiliza:

- Access token.
- Refresh token.
- Cookies HTTP-only para el refresh token.
- Identificador `jti` para los JWT.
- Lista de revocación mediante Redis y persistencia relacionada.
- Sesiones persistidas cuando corresponde.

Los endpoints de autenticación deben diferenciarse de los recursos que requieren usuario autenticado.

---

## 6. Autorización

La autenticación identifica al usuario.

La autorización determina si ese usuario puede ejecutar una operación determinada.

La API debe comprobar:

```text
Usuario autenticado
       |
       v
Rol permitido
       |
       v
Empresa correcta
       |
       v
Recurso permitido
       |
       v
Operación
```

No debe asumirse que ocultar una acción en el frontend constituye autorización.

---

## 7. Multi-tenancy

Los recursos empresariales deben asociarse con una empresa.

El backend utiliza el contexto de empresa mediante `req.empresaId` cuando corresponde.

Las consultas y operaciones que trabajan con datos empresariales deben respetar este contexto.

Un identificador de recurso recibido desde el cliente no debe ser suficiente para acceder al registro sin verificar su pertenencia a la empresa correspondiente.

---

## 8. Respuestas HTTP

Los endpoints deben utilizar códigos HTTP coherentes con el resultado de la operación.

| Código | Significado general |
|---|---|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `204` | Operación exitosa sin contenido |
| `400` | Solicitud inválida |
| `401` | No autenticado |
| `403` | No autorizado |
| `404` | Recurso no encontrado |
| `409` | Conflicto |
| `422` | Datos no procesables |
| `429` | Límite de solicitudes excedido |
| `500` | Error interno |

El código definitivo de cada operación debe corresponder con su implementación.

---

## 9. Validación

Los datos recibidos por la API deben validarse antes de llegar a las operaciones de negocio.

El backend utiliza esquemas de validación, incluyendo Zod en los puntos donde se ha establecido esta estrategia.

La validación debe considerar:

- Tipos.
- Campos obligatorios.
- Longitudes.
- Rangos.
- Formatos.
- Valores permitidos.
- Relaciones entre campos.
- Identificadores.
- Datos sensibles.

---

## 10. Manejo de errores

Los errores de la API deben devolver información suficiente para que el frontend pueda reaccionar sin revelar detalles internos innecesarios.

No deben exponerse:

- Stack traces.
- Credenciales.
- Secretos.
- Consultas SQL.
- Tokens.
- Información interna de infraestructura.

Los errores deben quedar registrados mediante el mecanismo de logging correspondiente cuando su naturaleza lo requiera.

---

## 11. Autenticación y sesiones

El catálogo debe contemplar como mínimo las operaciones relacionadas con:

- Inicio de sesión.
- Renovación de sesión.
- Cierre de sesión.
- Consulta del estado de sesión.
- Recuperación de contraseña.
- Cambio de contraseña.

Las rutas exactas deben mantenerse alineadas con las definidas en los módulos de autenticación.

---

## 12. Usuarios

Las operaciones de usuarios deben contemplar según corresponda:

- Consulta.
- Creación.
- Actualización.
- Activación o desactivación.
- Gestión de roles.
- Gestión de sesiones.

Las operaciones administrativas deben aplicar las restricciones de autorización correspondientes.

---

## 13. Clientes

El recurso de clientes representa los clientes registrados para una empresa.

Las operaciones deben contemplar, según la implementación:

- Listado.
- Consulta.
- Creación.
- Actualización.
- Desactivación o eliminación lógica.
- Búsqueda o autocompletado.

Las consultas deben respetar `empresa_id`.

---

## 14. Materiales

El recurso de materiales representa los elementos utilizados en las operaciones de carpintería.

Las operaciones pueden incluir:

- Listado.
- Consulta.
- Creación.
- Actualización.
- Desactivación.
- Eliminación lógica.
- Consulta de stock.
- Búsqueda y filtrado.

Las modificaciones de inventario deben respetar las reglas de persistencia y concurrencia definidas para el sistema.

---

## 15. Colores

El recurso de colores permite asociar información de color con materiales.

Las operaciones deben contemplar las restricciones de empresa y las relaciones con:

- Materiales.
- Variantes.
- Trabajos.

No debe permitirse una asociación que viole las relaciones establecidas por la base de datos.

---

## 16. Variantes de materiales

Las variantes relacionan materiales y colores y pueden contener información propia de:

- Stock.
- Precio.
- Actualización.

El acceso debe comprobar que la variante pertenece al contexto empresarial correspondiente.

---

## 17. Proveedores

Las operaciones de proveedores deben contemplar:

- Listado.
- Consulta.
- Creación.
- Actualización.
- Activación o desactivación.
- Eliminación lógica.
- Relación con materiales.

Las relaciones proveedor-material deben respetar las restricciones de integridad de la base de datos.

---

## 18. Trabajos

Los trabajos representan los tipos de trabajos configurados para la actividad empresarial.

Las operaciones pueden incluir:

- Consulta.
- Creación.
- Actualización.
- Activación o desactivación.
- Consulta de referencias.
- Consulta de recetas.

Los trabajos pertenecen al contexto de una empresa.

---

## 19. Referencias y recetas

Las referencias y recetas forman parte de la información utilizada para modelar trabajos.

La API debe proteger:

- Acceso a referencias.
- Asociación con trabajos.
- Relación con materiales.
- Configuración de factores de cálculo.

Cuando existan archivos asociados, también deben aplicarse límites de tamaño y validaciones de contenido.

---

## 20. Proformas

Las operaciones de proformas constituyen uno de los flujos principales de la plataforma.

Deben contemplar según la implementación:

- Creación.
- Consulta.
- Listado.
- Actualización.
- Eliminación lógica.
- Cálculo.
- Gestión de detalles.
- Gestión de items.
- Agendamiento.

Las operaciones deben mantener coherencia entre:

```text
Proforma
   |
   +--> Cliente
   +--> Items
   +--> Detalles
   +--> Materiales
   +--> Medidas
   +--> Cantidades
   +--> Precios
   +--> Total
```

---

## 21. Pedidos

Los pedidos pueden originarse a partir de operaciones de proformas.

Las operaciones deben contemplar:

- Creación.
- Consulta.
- Listado.
- Actualización.
- Cambio de estado.
- Eliminación lógica cuando corresponda.

Los estados definidos en la base de datos incluyen:

```text
PENDIENTE
PROCESADO
ENTREGADO
CANCELADO
```

Las transiciones permitidas deben validarse en la lógica de negocio.

---

## 22. Inventario

Las operaciones relacionadas con inventario deben proteger especialmente:

- Stock.
- Cantidades.
- Precios.
- Materiales.
- Variantes.
- Movimientos derivados de operaciones comerciales.

Los cambios concurrentes deben considerar transacciones y mecanismos de consistencia adecuados.

No debe confiarse exclusivamente en el valor enviado por el frontend para determinar el stock disponible.

---

## 23. Facturación

La API de facturación debe contemplar las operaciones necesarias para:

- Crear facturas.
- Consultar facturas.
- Obtener detalles.
- Cambiar estados.
- Procesar información relacionada con SRI.
- Consultar estadísticas cuando corresponda.

Los estados de factura definidos por la base de datos incluyen:

```text
BORRADOR
EMITIDA
AUTORIZADA
ANULADA
DEVUELTA
NO_AUTORIZADA
```

Los estados de procesamiento SRI incluyen:

```text
PENDIENTE
RECIBIDA
DEVUELTA
AUTORIZADA
NO_AUTORIZADA
SIN_ENVIAR
```

Las transiciones deben validarse de acuerdo con las reglas de negocio y la integración correspondiente.

---

## 24. Secuencias de comprobantes

Las operaciones relacionadas con secuencias deben proteger la generación de numeraciones.

La secuencia debe considerar:

- Empresa.
- Tipo de comprobante.
- Establecimiento.
- Punto de emisión.
- Secuencia actual.
- Estado.

Las operaciones concurrentes deben evitar la generación de números duplicados.

---

## 25. Auditoría

Las operaciones sensibles deben poder generar registros de auditoría.

La tabla `auditoria_acciones` contempla acciones como:

- `DELETE`
- `ANULACION`
- `LOGIN`
- `LOGOUT`
- `LOGIN_FALLIDO`
- `REFRESH_TOKEN`
- `CAMBIO_PASSWORD`

La auditoría no debe utilizarse como sustituto de los logs técnicos.

---

## 26. Inteligencia artificial

Las operaciones de IA deben aplicar controles adicionales relacionados con:

- Autenticación.
- Autorización.
- Tamaño de archivos.
- Tipo de contenido.
- Validación de entradas.
- Límites de uso.
- Proveedores externos.
- Errores de cuota.
- Tiempo de procesamiento.
- Registro de solicitudes.

La tabla `ia_requests` permite conservar información de las solicitudes procesadas.

---

## 27. Archivos

Los endpoints que reciben archivos deben aplicar:

- Límite de tamaño.
- Validación del tipo.
- Validación de contenido.
- Autorización.
- Control de almacenamiento.
- Manejo seguro de nombres.
- Registro de errores.

No debe confiarse únicamente en la extensión proporcionada por el cliente.

---

## 28. CSRF

Las operaciones que modifican información deben aplicar el mecanismo CSRF establecido por la arquitectura.

El frontend utiliza un flujo basado en cookie CSRF y encabezado `X-CSRF-Token` para las solicitudes mutables cuando corresponde.

Las solicitudes de lectura no deben recibir el mismo tratamiento que las operaciones que modifican estado.

---

## 29. CORS

La configuración CORS debe restringir los orígenes autorizados según el entorno.

No debe utilizarse una política excesivamente permisiva en producción.

Los cambios de origen permitido deben tratarse como cambios de seguridad y configuración.

---

## 30. Rate limiting

Los endpoints sensibles deben considerar límites de solicitudes.

La prioridad debe incluir:

- Login.
- Recuperación de contraseña.
- Refresh.
- Operaciones costosas.
- IA.
- Endpoints públicos, si existen.

Los límites concretos deben mantenerse en la configuración real y no duplicarse como valores estáticos en esta documentación.

---

## 31. Idempotencia

Las operaciones que puedan repetirse debido a:

- Reintentos.
- Timeouts.
- Errores de red.
- Reenvíos del cliente.

deben diseñarse para evitar efectos duplicados cuando el dominio lo requiera.

Este criterio es especialmente importante en:

- Facturación.
- Generación de comprobantes.
- Cambios de inventario.
- Operaciones externas.
- Procesamiento de IA.

---

## 32. Concurrencia

Los endpoints que modifican datos compartidos deben considerar condiciones de carrera.

Los recursos sensibles incluyen:

- Stock.
- Secuencias.
- Totales.
- Estados de facturas.
- Estados de pedidos.
- Sesiones.

La protección definitiva debe residir en la combinación apropiada de aplicación, transacciones y restricciones de base de datos.

---

## 33. Paginación

Los endpoints que devuelvan colecciones grandes deben utilizar paginación cuando corresponda.

La API debe evitar devolver cantidades de datos innecesarias.

La implementación debe definir de forma consistente:

- Página.
- Tamaño.
- Total.
- Elementos.
- Ordenamiento.

Los parámetros exactos deben documentarse según cada endpoint real.

---

## 34. Filtrado y búsqueda

Los endpoints de consulta pueden admitir filtros específicos del dominio.

Los filtros deben:

- Validarse.
- Respetar empresa.
- Utilizar índices apropiados cuando corresponda.
- Evitar consultas sin límites.
- Mantener comportamiento determinista.

---

## 35. Rendimiento

Los endpoints críticos deben medirse mediante métricas como:

- Latencia.
- p50.
- p95.
- p99.
- Throughput.
- Tasa de errores.

Los resultados de pruebas de rendimiento deben conservarse como evidencia independiente de este catálogo.

---

## 36. Observabilidad

Los endpoints deben integrarse con:

- Logging.
- Auditoría cuando corresponda.
- Métricas.
- Seguimiento de errores.
- Identificación de solicitudes cuando esté disponible.

No deben registrarse tokens, contraseñas ni otros secretos.

---

## 37. Integraciones externas

Los endpoints que dependen de proveedores externos deben contemplar:

- Timeout.
- Errores.
- Reintentos cuando sean seguros.
- Límites.
- Respuestas inválidas.
- Disponibilidad.
- Registro técnico.

En IA se ha identificado la posibilidad de respuestas de proveedor relacionadas con cuota, incluyendo HTTP `402`.

Estos errores deben tratarse como condiciones externas y no necesariamente como fallos de persistencia local.

---

## 38. Contrato de API

El contrato detallado de las operaciones debe mantenerse en:

```text
docs/API/api-contracts.md
```

Este catálogo funciona como índice conceptual.

La documentación específica de request, response, errores y validaciones debe mantenerse en el contrato correspondiente cuando exista.

---

## 39. Pruebas

Cada grupo de endpoints debe contar con pruebas apropiadas.

La cobertura debe considerar:

- Caso exitoso.
- Validación.
- Autenticación.
- Autorización.
- Multi-tenancy.
- Recurso inexistente.
- Conflictos.
- Errores internos.
- Concurrencia cuando sea relevante.
- Integraciones externas.

Los endpoints críticos deben incorporarse además a pruebas de integración y E2E.

---

## 40. Seguridad de endpoints

Antes de considerar un endpoint terminado debe verificarse:

```text
Autenticación
      +
Autorización
      +
Tenant
      +
Validación
      +
Integridad
      +
Errores
      +
Logging/Auditoría
```

Los controles aplicables dependen de la naturaleza del recurso.

---

## 41. Estado del catálogo

Este documento define la estructura y criterios para catalogar la API.

No debe interpretarse como una lista exhaustiva de rutas concretas mientras no se haya generado a partir del registro real de rutas del backend.

La incorporación de una ruta nueva debe acompañarse de:

- Módulo responsable.
- Método HTTP.
- Path.
- Autenticación requerida.
- Rol o permiso.
- Contexto empresarial.
- Validación.
- Respuestas.
- Pruebas.
- Documentación.

---

## 42. Actualización automática

Cuando sea posible, el catálogo operativo debe generarse o validarse a partir de la definición real de rutas para reducir divergencias entre documentación e implementación.

Una futura automatización puede comprobar:

```text
Rutas implementadas
        |
        v
Contrato documentado
        |
        v
Pruebas
        |
        v
CI/CD
```

La automatización no debe sobrescribir documentación arquitectónica o decisiones técnicas escritas manualmente.

---

## 43. Criterios de aceptación

El catálogo se considera mantenible cuando:

- Los módulos tienen una ubicación identificable.
- Las rutas reales pueden localizarse.
- Los controles de seguridad están definidos.
- Las operaciones críticas tienen pruebas.
- Las rutas nuevas se documentan.
- Los contratos permanecen sincronizados.
- Las diferencias entre implementación y documentación pueden detectarse.

---

## 44. Mantenimiento

Este documento debe actualizarse cuando:

- Se agregue un endpoint.
- Se elimine una ruta.
- Cambie un método HTTP.
- Cambie la autorización.
- Cambie el contexto multi-tenant.
- Cambie el contrato de request o response.
- Se modifique una integración externa.
- Se cambien mecanismos de seguridad.
- Se modifique un flujo crítico.

Las modificaciones de API deben acompañarse de sus pruebas y documentación correspondientes.
