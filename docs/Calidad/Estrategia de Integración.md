# Estrategia de Integración

## 1. Propósito

Este documento establece la estrategia para verificar la integración entre los diferentes componentes de la plataforma ERP/SaaS.

El objetivo es comprobar que módulos, API, autenticación, base de datos, Redis, servicios externos y frontend funcionen correctamente cuando interactúan entre sí.

---

## 2. Alcance

La estrategia contempla:

- Frontend React/Vite.
- API Node/Express.
- Middleware.
- Autenticación.
- Autorización.
- Multi-tenancy.
- MySQL.
- Redis.
- Servicios de negocio.
- Repositorios.
- Facturación.
- Inventario.
- Proformas.
- Pedidos.
- Clientes.
- Proveedores.
- IA.
- Sesiones.
- Integraciones externas.

---

## 3. Objetivos

Las pruebas de integración deben verificar que:

1. Las capas intercambien datos correctamente.
2. Las validaciones lleguen hasta la capa correspondiente.
3. La autenticación se mantenga durante el flujo.
4. La autorización se aplique correctamente.
5. El aislamiento por empresa se conserve.
6. Las transacciones mantengan la integridad.
7. Redis y MySQL interactúen correctamente con el backend.
8. Los errores se propaguen de forma controlada.
9. Los cambios de estado respeten las reglas de negocio.
10. Las integraciones externas puedan manejar errores y tiempos de espera.

---

## 4. Principio de integración progresiva

Las pruebas deben avanzar desde integraciones pequeñas hacia flujos completos:

```text
Función
   ↓
Servicio
   ↓
Repositorio
   ↓
Base de datos
   ↓
API
   ↓
Frontend
   ↓
Flujo funcional
```

No todos los casos necesitan atravesar todas las capas. El nivel de prueba debe corresponder al comportamiento que se desea verificar.

---

## 5. Niveles de integración

Se consideran los siguientes niveles:

| Nivel | Objetivo |
|---|---|
| Servicio + repositorio | Verificar interacción con persistencia |
| API + servicios | Verificar procesamiento HTTP y reglas |
| API + MySQL | Verificar persistencia real |
| API + Redis | Verificar sesiones, blacklist y datos temporales |
| API + servicios externos | Verificar contratos y errores |
| Frontend + API | Verificar comunicación cliente-servidor |
| Flujo completo | Verificar integración funcional |

---

## 6. Entorno de pruebas

El entorno de integración debe ser independiente de los datos reales.

Debe utilizar:

- Base de datos de prueba.
- Redis de prueba.
- Variables de entorno específicas.
- Usuarios de prueba.
- Empresas de prueba.
- Datos controlados.

No deben utilizarse credenciales productivas.

---

## 7. Base de datos

Las pruebas que requieran persistencia real deben ejecutarse contra un esquema de prueba.

La base debe contener la estructura necesaria para:

- Tablas.
- Índices.
- Restricciones.
- Relaciones.
- Triggers.
- Procedimientos.

Los datos de prueba deben ser reproducibles.

---

## 8. Transacciones

Las operaciones que utilicen transacciones deben probar:

- Éxito completo.
- Error antes del commit.
- Error durante una operación.
- Rollback.
- Integridad posterior.

Debe verificarse que una operación parcialmente fallida no deje datos inconsistentes.

---

## 9. Redis

Las pruebas de integración con Redis deben cubrir los mecanismos que dependan de este servicio.

Especialmente:

- Blacklist.
- Tokens.
- Sesiones.
- Expiración.
- Lectura.
- Escritura.
- Eliminación.
- Errores de conexión.

Debe comprobarse el comportamiento esperado cuando Redis no esté disponible.

---

## 10. Autenticación

Los casos de integración deben comprobar el flujo completo:

```text
Login
  ↓
Credenciales válidas
  ↓
Token / sesión
  ↓
Solicitud protegida
  ↓
Identidad reconocida
  ↓
Respuesta autorizada
```

También deben probarse:

- Credenciales inválidas.
- Usuario inactivo.
- Token expirado.
- Token revocado.
- Sesión inválida.
- Logout.
- Refresh.

---

## 11. Autorización

La integración debe verificar que el usuario autenticado conserve su contexto de autorización durante toda la solicitud.

Debe comprobarse:

- Rol.
- Empresa.
- Recurso.
- Acción.

Un endpoint no debe otorgar acceso solamente porque el token sea válido.

---

## 12. Multi-tenancy

Este es un punto crítico de las pruebas de integración.

Debe verificarse que:

```text
Empresa A
   ↓
Usuario A
   ↓
Recursos A
```

no pueda acceder a:

```text
Empresa B
   ↓
Recursos B
```

Las pruebas deben cubrir:

- Lectura.
- Creación.
- Modificación.
- Eliminación.
- Búsquedas.
- Relaciones.
- Listados.
- Recursos relacionados indirectamente.

---

## 13. Clientes

La integración del módulo de clientes debe comprobar:

- Creación.
- Consulta.
- Actualización.
- Estado activo.
- Asociación empresarial.
- Restricciones de unicidad.
- Persistencia.
- Respuestas de API.

Los errores de base de datos deben transformarse en respuestas controladas.

---

## 14. Materiales

Las pruebas deben verificar la integración entre:

```text
API
 ↓
Servicio
 ↓
Repositorio
 ↓
Material
 ↓
MySQL
```

Debe comprobarse:

- Nombre.
- Precio.
- Stock.
- Stock mínimo.
- Estado.
- Eliminación lógica.
- Empresa.
- Variantes.
- Colores.

---

## 15. Inventario

Los flujos de inventario deben probar operaciones que afecten cantidades y disponibilidad.

Deben evaluarse:

- Actualización de stock.
- Validación de cantidades.
- Stock insuficiente.
- Operaciones concurrentes.
- Persistencia.
- Recuperación de datos.

Cuando una operación modifique varios registros relacionados, debe comprobarse la integridad de toda la operación.

---

## 16. Proformas

La integración de proformas debe comprobar:

- Cliente.
- Empresa.
- Usuario.
- Fecha.
- Detalles.
- Materiales.
- Cantidades.
- Precios.
- Totales.
- Medidas.
- Estado cuando corresponda.

El flujo debe verificarse desde la solicitud hasta la persistencia.

---

## 17. Pedidos

Las pruebas deben verificar la relación entre:

```text
Proforma
   ↓
Pedido
   ↓
Detalle
   ↓
Material
```

Debe comprobarse:

- Creación.
- Asociación.
- Total.
- Estado.
- Usuario.
- Empresa.
- Materiales.
- Persistencia.

También debe verificarse el comportamiento ante errores durante la creación.

---

## 18. Facturación

La integración de facturación debe cubrir:

- Cabecera.
- Detalles.
- Totales.
- IVA.
- Secuencia.
- Estado.
- Empresa.
- Usuario.
- Autorización.
- Integraciones externas cuando correspondan.

Las pruebas deben verificar la consistencia entre `facturas` y `factura_detalle`.

---

## 19. Triggers

El esquema utiliza triggers para determinadas actualizaciones de totales.

Las pruebas deben verificar específicamente:

- Inserción de detalle.
- Actualización del total relacionado.
- Integridad posterior.
- Comportamiento ante errores.

Actualmente existen triggers relacionados con:

- Totales de facturas.
- Total de pedidos.

No debe asumirse la existencia de triggers para otras entidades sin verificar el esquema.

---

## 20. Secuencias

La integración de comprobantes debe comprobar la interacción con `secuencias_comprobantes`.

Debe verificarse:

- Empresa.
- Tipo de comprobante.
- Establecimiento.
- Punto de emisión.
- Secuencia.
- Restricciones de unicidad.
- Concurrencia.

Las pruebas deben considerar dos solicitudes simultáneas cuando la operación pueda ejecutarse concurrentemente.

---

## 21. Proveedores

El flujo de proveedores debe comprobar:

- Empresa.
- Creación.
- Actualización.
- Estado.
- Eliminación lógica.
- Relación con materiales.
- Restricciones de unicidad.

La relación `proveedor_materiales` debe mantener la integridad de sus claves foráneas.

---

## 22. Trabajos y recetas

La integración debe verificar las relaciones:

```text
Trabajo
   ↓
Receta
   ↓
Material
```

y:

```text
Trabajo
   ↓
Referencia
```

Debe comprobarse que las relaciones sean consistentes con la empresa y las reglas de eliminación establecidas.

---

## 23. Frontend y API

Las pruebas frontend-backend deben verificar:

- URL.
- Método HTTP.
- Headers.
- Cookies.
- CSRF.
- Payload.
- Respuesta.
- Errores.
- Estados HTTP.

El frontend no debe asumir que una operación fue exitosa únicamente porque la solicitud fue enviada.

---

## 24. Axios

La integración debe comprobar la configuración común del cliente HTTP.

Actualmente el frontend utiliza:

```text
VITE_API_URL || /api
```

y `withCredentials` para las solicitudes que requieren credenciales.

Las pruebas deben comprobar también el comportamiento ante:

- 401.
- 403.
- 404.
- 409.
- 422.
- 429.
- 500.

---

## 25. CSRF

Las operaciones mutables deben verificarse con el mecanismo CSRF correspondiente.

Debe comprobarse:

```text
Solicitud válida
      ↓
Token correcto
      ↓
Aceptada
```

y:

```text
Token ausente / inválido
      ↓
Rechazada
```

---

## 26. Manejo de errores

Las pruebas de integración deben comprobar que los errores atraviesen correctamente las capas.

Por ejemplo:

```text
Repositorio
   ↓
Error
   ↓
Servicio
   ↓
Controlador
   ↓
Middleware de errores
   ↓
HTTP Response
```

El error final no debe exponer información interna innecesaria.

---

## 27. Validación

Debe verificarse la integración entre validadores y lógica de negocio.

Casos mínimos:

- Payload válido.
- Campo obligatorio ausente.
- Tipo incorrecto.
- Valor fuera de rango.
- Enum inválido.
- Identificador inexistente.
- Cantidad inválida.
- Medida inválida.
- Precio inválido.

---

## 28. Integraciones externas

Las integraciones externas deben probarse utilizando mecanismos controlados cuando sea posible.

Debe verificarse:

- Solicitud correcta.
- Respuesta válida.
- Timeout.
- Error HTTP.
- Error de autenticación.
- Cuota agotada.
- Respuesta incompleta.
- Servicio no disponible.

Las credenciales reales no deben utilizarse en pruebas automatizadas.

---

## 29. Inteligencia artificial

Los servicios de IA requieren pruebas específicas porque dependen de proveedores externos.

Debe verificarse:

- Envío de solicitud.
- Validación de entrada.
- Manejo de imágenes.
- Prompt.
- Respuesta.
- Tiempo de ejecución.
- Error del proveedor.
- Timeout.
- Cuota.
- Persistencia de la solicitud.

La integración debe contemplar que un proveedor pueda responder con errores como HTTP 402 por falta de créditos o cuota.

---

## 30. Auditoría

Las operaciones sensibles deben comprobar que produzcan los registros de auditoría esperados cuando corresponda.

Debe verificarse:

- Usuario.
- Empresa.
- Acción.
- Tabla.
- Registro.
- Fecha.
- Contexto disponible.

La auditoría debe comprobarse como parte del flujo y no únicamente mediante pruebas aisladas de la tabla.

---

## 31. Observabilidad

Las pruebas deben comprobar que los errores relevantes puedan rastrearse mediante:

- Logs.
- Identificadores.
- Auditoría.
- Respuestas HTTP.

Los logs utilizados durante las pruebas no deben contener credenciales o tokens completos.

---

## 32. Datos de prueba

Los datos deben:

- Ser deterministas.
- Ser reproducibles.
- Ser independientes de producción.
- Permitir aislamiento entre empresas.
- Cubrir estados válidos e inválidos.
- Poder limpiarse después de las pruebas.

Se recomienda utilizar datos mínimos que permitan identificar claramente el origen de cada resultado.

---

## 33. Limpieza

Cada prueba debe evitar contaminar otras pruebas.

Cuando corresponda:

```text
Preparar
   ↓
Ejecutar
   ↓
Verificar
   ↓
Limpiar
```

La estrategia concreta puede utilizar transacciones, fixtures, truncado controlado o mecanismos equivalentes según el tipo de prueba.

---

## 34. Determinismo

Una prueba de integración debe producir resultados reproducibles.

Debe evitar depender de:

- Datos externos cambiantes.
- Servicios inestables.
- Hora real cuando no sea necesario.
- Valores aleatorios no controlados.
- Orden accidental de registros.
- Estado residual de otras pruebas.

Cuando se requiera aleatoriedad, debe poder controlarse o aislarse.

---

## 35. Concurrencia

Los casos críticos deben incorporar pruebas concurrentes cuando exista riesgo de:

- Duplicación.
- Pérdida de actualización.
- Sobreventa de stock.
- Secuencias duplicadas.
- Estados inconsistentes.
- Operaciones repetidas.

Las pruebas deben verificar el estado final y no solamente las respuestas individuales.

---

## 36. Integración de autenticación y multi-tenancy

Debe existir una combinación de pruebas que verifique simultáneamente:

```text
Usuario A
  +
Empresa A
  +
Rol permitido
  ↓
Acceso correcto
```

y:

```text
Usuario A
  +
Empresa A
  +
Recurso Empresa B
  ↓
Acceso rechazado
```

Esta combinación es necesaria porque una prueba aislada de autenticación no demuestra aislamiento multi-tenant.

---

## 37. Integración con CI

Las pruebas deben incorporarse progresivamente al pipeline.

El CI actual ya ejecuta verificaciones automatizadas de backend y frontend.

La integración debe ampliarse conforme exista infraestructura reproducible para:

- MySQL.
- Redis.
- Backend.
- Frontend.
- Servicios requeridos.

No debe declararse una prueba como parte obligatoria del CI mientras el entorno necesario no pueda reproducirse de manera confiable.

---

## 38. Criterios de aprobación

Una prueba de integración se considera aprobada cuando:

- La operación produce el resultado esperado.
- Los datos persistidos son correctos.
- Las relaciones permanecen íntegras.
- Los permisos son respetados.
- El tenant es correcto.
- Los errores se manejan correctamente.
- No se generan efectos secundarios no esperados.
- Los recursos temporales son limpiados.

---

## 39. Evidencia

Cada ejecución relevante debe conservar, cuando corresponda:

- Resultado de pruebas.
- Cantidad de casos.
- Duración.
- Errores.
- Logs relevantes.
- Cobertura asociada.
- Artefactos de CI.

La evidencia debe permitir identificar:

```text
Prueba
  ↓
Componente
  ↓
Requisito
  ↓
Resultado
```

---

## 40. Estado actual

El backend cuenta con una base amplia de pruebas automatizadas y el frontend dispone de pruebas unitarias.

La integración con infraestructura real debe continuar ampliándose para cubrir MySQL, Redis, API, autenticación, multi-tenancy y flujos funcionales completos.

La disponibilidad de un entorno reproducible de infraestructura es un requisito importante para ampliar estas pruebas dentro de CI.

---

## 41. Criterios de aceptación

La estrategia de integración se considera cubierta cuando:

- Los servicios críticos tienen pruebas de integración.
- Las rutas críticas se prueban contra sus dependencias.
- MySQL se prueba con un esquema controlado.
- Redis se prueba en los flujos que lo requieren.
- La autenticación se verifica de extremo a extremo dentro de la API.
- La autorización se verifica con diferentes roles.
- El aislamiento multi-tenant está probado.
- Las operaciones críticas verifican transacciones.
- Los errores externos están cubiertos.
- Las integraciones de IA tienen casos de error.
- Los flujos de facturación tienen pruebas de integración.
- Inventario, proformas y pedidos tienen cobertura de integración.
- Los casos críticos de concurrencia están identificados y probados.
- CI puede ejecutar las pruebas con infraestructura reproducible.

---

## 42. Mantenimiento

La estrategia debe actualizarse cuando:

- Se agreguen módulos.
- Se agreguen endpoints.
- Se modifique la base de datos.
- Se cambien relaciones.
- Se incorpore Redis a nuevos flujos.
- Se modifique autenticación.
- Se modifique autorización.
- Se agreguen proveedores externos.
- Se agreguen servicios de IA.
- Se modifiquen transacciones.
- Se cambie la infraestructura de CI/CD.

Cada funcionalidad crítica nueva debe determinar qué integraciones requieren pruebas antes de considerarse terminada.
