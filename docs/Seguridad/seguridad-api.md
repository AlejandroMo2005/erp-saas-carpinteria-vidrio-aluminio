# Seguridad de la API

## 1. Propósito

Este documento establece los controles de seguridad aplicables a la API backend de la plataforma ERP/SaaS.

La API constituye uno de los principales límites de confianza del sistema, por lo que debe validar identidad, autorización, aislamiento empresarial, entradas, sesiones y operaciones antes de permitir acceso o modificación de recursos.

---

## 2. Alcance

Este documento aplica a:

- Endpoints REST.
- Middleware de autenticación.
- Middleware de autorización.
- Contexto multi-tenant.
- Validadores.
- Controladores.
- Servicios.
- Repositorios.
- Manejo de errores.
- Cookies y tokens.
- CSRF.
- CORS.
- Rate limiting.
- Subida de archivos.
- Integraciones externas.
- Logs y auditoría.

---

## 3. Principios

La seguridad de la API debe basarse en:

1. Denegar por defecto.
2. Autenticar antes de acceder a recursos protegidos.
3. Autorizar cada operación.
4. Validar toda entrada.
5. Aplicar aislamiento por empresa.
6. No confiar en controles exclusivamente implementados en frontend.
7. Limitar recursos costosos.
8. No exponer información interna.
9. Registrar eventos relevantes.
10. Probar escenarios positivos y negativos.

---

## 4. Límites de confianza

La API recibe información desde clientes y servicios que no deben considerarse confiables por defecto.

```text
Cliente
   ↓
HTTPS
   ↓
API
   ↓
Autenticación
   ↓
Autorización
   ↓
Tenant
   ↓
Validación
   ↓
Controlador
   ↓
Servicio
   ↓
Repositorio
   ↓
MySQL / Redis
```

Cada capa debe mantener las responsabilidades de seguridad correspondientes.

---

## 5. Autenticación

Los endpoints protegidos deben validar la identidad del usuario antes de procesar operaciones privadas.

La autenticación debe comprobar:

- Credenciales o sesión válida.
- Token válido.
- Expiración.
- Revocación.
- Estado de la cuenta.
- Identificador del usuario.
- Empresa asociada.

Los endpoints públicos deben mantenerse explícitamente identificados para evitar exposición accidental.

---

## 6. Autorización

Después de autenticar al usuario, la API debe verificar si puede realizar la operación solicitada.

La autorización debe considerar:

- Usuario.
- Rol.
- Empresa.
- Recurso.
- Acción.

El frontend no debe considerarse una barrera suficiente para autorización.

Una solicitud enviada manualmente a la API debe recibir las mismas restricciones que una solicitud generada desde la interfaz.

---

## 7. Multi-tenancy

Cada solicitud autenticada debe operar dentro del contexto de la empresa correspondiente.

La API debe evitar confiar en un `empresa_id` proporcionado directamente por el cliente cuando este pueda utilizarse para seleccionar otro tenant.

El contexto de empresa debe derivarse de la identidad autenticada y de los mecanismos internos de autorización.

Las consultas a recursos empresariales deben aplicar el filtro correspondiente.

---

## 8. Autorización a nivel de recurso

La autorización no debe limitarse al acceso al endpoint.

Debe verificarse también que el recurso solicitado pertenezca a:

- La empresa correspondiente.
- El usuario o rol autorizado cuando corresponda.
- El contexto de operación permitido.

Ejemplo conceptual:

```text
GET /api/proformas/123

Usuario autenticado
       ↓
¿Puede usar este endpoint?
       ↓
¿La proforma 123 pertenece a su empresa?
       ↓
¿Su rol permite consultar proformas?
       ↓
Permitir / Rechazar
```

---

## 9. Validación de entradas

Todos los datos provenientes de la API deben considerarse no confiables.

Debe validarse:

- Tipo.
- Formato.
- Longitud.
- Rango.
- Enumeraciones.
- Identificadores.
- Cantidades.
- Precios.
- Medidas.
- Fechas.
- Estados.
- Archivos.
- Objetos anidados.

La validación debe ejecutarse en backend aunque el frontend también valide los datos.

---

## 10. Identificadores

Los identificadores recibidos desde el cliente deben validarse antes de utilizarlos.

Debe comprobarse:

- Tipo esperado.
- Formato.
- Existencia.
- Relación con el tenant.
- Autorización sobre el recurso.

Un identificador válido sintácticamente no implica que el usuario tenga permiso para acceder al recurso.

---

## 11. Prevención de inyección

Las operaciones de persistencia deben utilizar mecanismos seguros para evitar inyección.

La API debe prevenir como mínimo:

- SQL Injection.
- NoSQL Injection cuando corresponda.
- Command Injection.
- Template Injection.
- XSS almacenado o reflejado.
- Manipulación insegura de expresiones.

Los datos controlados por usuarios no deben convertirse directamente en comandos ejecutables.

---

## 12. Errores HTTP

La API debe utilizar códigos HTTP coherentes.

Como referencia:

| Situación | Código |
|---|---:|
| Solicitud válida | 200 |
| Recurso creado | 201 |
| Sin contenido | 204 |
| Datos inválidos | 400 |
| No autenticado | 401 |
| No autorizado | 403 |
| Recurso inexistente | 404 |
| Conflicto | 409 |
| Entidad no procesable | 422 |
| Demasiadas solicitudes | 429 |
| Error interno | 500 |
| Servicio externo no disponible | 502/503 según contexto |

La implementación concreta debe mantener consistencia entre endpoints.

---

## 13. Mensajes de error

Los mensajes de error no deben revelar:

- Stack traces.
- Consultas SQL.
- Credenciales.
- Tokens.
- Variables de entorno.
- Rutas internas innecesarias.
- Información de infraestructura.
- Datos pertenecientes a otros usuarios o empresas.

Los detalles necesarios para diagnóstico deben registrarse de forma controlada en logs.

---

## 14. Enumeración de recursos

La API debe evitar revelar información mediante diferencias innecesarias entre respuestas.

Debe evaluarse especialmente:

- Existencia de usuarios.
- Existencia de clientes.
- Existencia de proformas.
- Existencia de facturas.
- Recursos de otros tenants.

Cuando la existencia del recurso sea información sensible, las respuestas deben diseñarse para reducir la posibilidad de enumeración.

---

## 15. CSRF

Los endpoints que utilizan autenticación basada en cookies deben protegerse contra CSRF.

La protección debe mantenerse coordinada entre:

- Cookie.
- Token CSRF.
- Frontend.
- Backend.
- CORS.
- Métodos HTTP.

Las solicitudes mutables deben verificarse mediante pruebas específicas.

---

## 16. CORS

La configuración CORS debe restringir los orígenes permitidos.

Debe revisarse especialmente:

- Orígenes autorizados.
- Credenciales.
- Métodos.
- Headers.
- Preflight.
- Cookies.

Una configuración amplia puede aumentar la superficie de ataque y debe evitarse cuando no sea necesaria.

---

## 17. Rate limiting

Los endpoints susceptibles de abuso deben contar con límites apropiados.

Se debe prestar especial atención a:

- Login.
- Recuperación de contraseña.
- Validación de códigos.
- IA.
- Subida de archivos.
- Consultas costosas.
- Operaciones administrativas.

Los límites deben considerar también la posibilidad de falsos positivos que bloqueen usuarios legítimos.

---

## 18. Límites de tamaño

Las solicitudes deben tener límites razonables.

Debe controlarse:

- Tamaño del body.
- Multipart.
- Archivos.
- Imágenes.
- Parámetros.
- Campos de texto.
- Objetos anidados.

Los endpoints de IA y referencia visual requieren especial atención por el tamaño potencial de las imágenes.

---

## 19. Archivos

Los endpoints que reciben archivos deben validar:

- Tamaño.
- Tipo MIME.
- Extensión.
- Nombre.
- Contenido.
- Ubicación de almacenamiento.
- Acceso posterior.

Los archivos proporcionados por el cliente deben tratarse como contenido no confiable.

---

## 20. Autenticación y tokens

La API utiliza mecanismos de autenticación basados en tokens.

Los controles deben incluir:

- Validación de tokens.
- Expiración.
- Identificación mediante `jti` cuando corresponda.
- Revocación.
- Blacklist.
- Gestión de sesiones.
- Protección del refresh token.

Los tokens no deben almacenarse en logs.

---

## 21. Sesiones

Las sesiones deben poder:

- Identificarse.
- Expirar.
- Revocarse.
- Invalidarse.
- Auditarse cuando corresponda.

La API debe rechazar sesiones inválidas, expiradas o revocadas.

---

## 22. Autorización por rol

Los roles existentes en el modelo de usuarios incluyen:

- `ADMIN`
- `VENDEDOR`
- `ALMACEN`
- `CLIENTE`

La matriz completa de permisos se encuentra en `docs/Seguridad/roles-permisos.md`.

La existencia de un rol no debe interpretarse como autorización automática para todos los recursos del sistema.

---

## 23. Facturación

Los endpoints de facturación requieren controles reforzados debido a su impacto sobre información comercial y procesos fiscales.

Debe verificarse:

- Tenant.
- Usuario.
- Rol.
- Estado de la factura.
- Transiciones permitidas.
- Integridad de detalles.
- Totales.
- Acciones de emisión.
- Anulación.
- Integraciones externas.

Las operaciones críticas deben ser idempotentes cuando corresponda.

---

## 24. Inventario

Las operaciones de inventario deben proteger:

- Stock.
- Materiales.
- Variantes.
- Movimientos.
- Relaciones entre productos.
- Acceso por tenant.

Las operaciones concurrentes deben considerar integridad y consistencia de datos.

---

## 25. Proformas y pedidos

Los endpoints relacionados con proformas y pedidos deben verificar:

- Empresa.
- Usuario.
- Recurso.
- Estado.
- Cantidades.
- Precios.
- Relaciones entre entidades.

Las operaciones que modifiquen datos deben utilizar las reglas de autorización correspondientes.

---

## 26. IA

Los endpoints de IA deben proteger:

- Credenciales de proveedores.
- Imágenes.
- Prompts.
- Parámetros.
- Límites de consumo.
- Resultados.
- URLs.
- Información registrada.

Los errores de proveedores externos no deben convertirse en errores internos que expongan información sensible.

---

## 27. Cabeceras HTTP

La API debe utilizar las cabeceras de seguridad apropiadas para el entorno.

La configuración actual incluye mecanismos asociados con Helmet, CSP, HSTS y Trusted Types.

Los valores deben revisarse después de cambios de dominio, frontend, recursos externos o infraestructura.

---

## 28. Logs y auditoría

Los eventos relevantes de API deben permitir investigación posterior sin almacenar secretos.

Se debe registrar, cuando corresponda:

- Usuario.
- Empresa.
- Acción.
- Recurso.
- Resultado.
- Fecha.
- Identificador de solicitud.
- Información de diagnóstico necesaria.

Debe evitarse registrar:

- Contraseñas.
- Tokens completos.
- Secretos.
- Datos sensibles innecesarios.

---

## 29. Seguridad de servicios internos

Los servicios internos no deben asumir automáticamente que todos los datos recibidos desde otra capa son confiables.

Los servicios deben respetar:

- Validación.
- Autorización.
- Tenant.
- Integridad.
- Reglas de negocio.

La duplicación de controles críticos debe reducirse mediante una arquitectura consistente.

---

## 30. Seguridad de repositorios

Los repositorios deben garantizar que las operaciones de datos respeten el tenant y las restricciones de autorización establecidas por las capas superiores.

Debe evitarse que una consulta genérica permita accidentalmente:

```text
SELECT * FROM recurso WHERE id = ?
```

cuando la operación requiere además comprobar:

```text
empresa_id = tenant_actual
```

El aislamiento debe formar parte del diseño de acceso a datos.

---

## 31. Seguridad de integraciones externas

Las llamadas externas deben considerar:

- Timeout.
- Validación de respuestas.
- Manejo de errores.
- Límites.
- Credenciales.
- Información enviada.
- Información recibida.

Una respuesta externa no debe considerarse automáticamente confiable.

---

## 32. Idempotencia

Las operaciones críticas que puedan repetirse debido a reintentos deben analizar la necesidad de idempotencia.

Esto es especialmente relevante para:

- Facturación.
- Integraciones externas.
- Creación de recursos.
- Operaciones de inventario.
- Procesos asíncronos.

La idempotencia debe diseñarse según las reglas de negocio de cada operación.

---

## 33. Concurrencia

Los endpoints que modifican información deben considerar solicitudes simultáneas.

Se debe prestar especial atención a:

- Stock.
- Secuencias de comprobantes.
- Totales.
- Estados.
- Operaciones de facturación.
- Actualizaciones concurrentes.

La protección debe apoyarse en transacciones, restricciones y mecanismos apropiados de base de datos.

---

## 34. Pruebas de seguridad de API

Las pruebas deben incluir escenarios positivos y negativos.

Como mínimo:

```text
Usuario no autenticado
        ↓
401

Usuario autenticado sin permiso
        ↓
403

Usuario autorizado sobre recurso propio
        ↓
200/201/204

Usuario intentando acceder a otro tenant
        ↓
Rechazo

Entrada inválida
        ↓
400/422

Solicitud excesiva
        ↓
429
```

También deben evaluarse:

- SQL Injection.
- CSRF.
- XSS.
- Enumeración.
- Tokens expirados.
- Tokens revocados.
- Sesiones inválidas.
- Archivos maliciosos.
- Límites de tamaño.
- Rate limiting.

---

## 35. CI/CD

La seguridad de la API debe verificarse progresivamente mediante:

- Lint.
- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Análisis estático.
- Análisis de dependencias.
- DAST.

Los controles deben generar evidencia que permita identificar cuándo se verificó cada componente.

---

## 36. Hallazgos actuales y verificación

El análisis de seguridad debe considerar los hallazgos existentes en SonarCloud y otros mecanismos de análisis.

La línea base conocida incluye problemas relacionados con:

- Generación de valores aleatorios mediante `Math.random()`.
- Límites de contenido.
- Log Injection.
- Código legacy y duplicado.

Estos hallazgos deben validarse individualmente dentro de su contexto. La presencia de un hallazgo de una herramienta no implica automáticamente que exista una vulnerabilidad explotable.

---

## 37. Estado actual

La API cuenta con mecanismos de autenticación, sesiones, revocación de tokens, validación, CSRF, CORS, cabeceras de seguridad, tenant y logging dentro de la arquitectura actual.

La cobertura completa de seguridad de API continúa en verificación mediante pruebas de integración, E2E, análisis estático y DAST.

No debe considerarse que todos los controles descritos están completamente automatizados hasta contar con evidencia correspondiente.

---

## 38. Criterios de aceptación

La seguridad de la API se considera adecuadamente cubierta cuando:

- Los endpoints protegidos requieren autenticación.
- Las operaciones requieren autorización.
- El tenant se valida en las operaciones empresariales.
- Las entradas son validadas.
- Las consultas utilizan mecanismos seguros.
- Los tokens y sesiones pueden revocarse.
- CSRF está protegido donde corresponda.
- CORS está restringido.
- Existen límites contra abuso.
- Los errores no exponen información interna.
- Los logs no contienen secretos.
- Los endpoints críticos cuentan con pruebas negativas.
- Existen pruebas de aislamiento entre tenants.
- Los controles relevantes forman parte del CI/CD.

---

## 39. Mantenimiento

Este documento debe revisarse cuando:

- Se agreguen endpoints.
- Cambien los mecanismos de autenticación.
- Cambien los roles.
- Cambie el modelo multi-tenant.
- Se incorporen nuevos servicios externos.
- Se incorporen nuevas operaciones de IA.
- Cambie la política CORS.
- Cambie la protección CSRF.
- Cambie la infraestructura.
- Se detecten nuevas vulnerabilidades.

Toda modificación relevante de la API debe considerar su impacto sobre los controles de seguridad documentados.
