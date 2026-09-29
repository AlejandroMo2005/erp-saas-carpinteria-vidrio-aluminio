# Diagramas de Arquitectura

## 1. Propósito

Este documento reúne los diagramas principales utilizados para representar la arquitectura, los flujos de datos y las interacciones relevantes de la plataforma ERP/SaaS.

Los diagramas complementan el modelo C4 y la documentación específica de arquitectura, seguridad, base de datos, API y calidad.

---

## 2. Alcance

Se documentan diagramas relacionados con:

- Arquitectura general.
- Comunicación frontend-backend.
- Backend y persistencia.
- Autenticación.
- Multi-tenancy.
- Proformas.
- Inventario.
- Pedidos.
- Facturación.
- IA.
- CI/CD.
- Seguridad.

Los diagramas representan la arquitectura lógica conocida y deben mantenerse alineados con la implementación real.

---

## 3. Arquitectura general

```text
                    +----------------+
                    |     Usuario    |
                    +-------+--------+
                            |
                            | HTTPS
                            v
                 +----------------------+
                 | Frontend React/Vite  |
                 +----------+-----------+
                            |
                            | HTTP/JSON
                            v
                 +----------------------+
                 | Backend Node/Express |
                 +----+------------+----+
                      |            |
                      |            |
                      v            v
                +---------+    +--------+
                |  MySQL  |    | Redis  |
                +---------+    +--------+
                      |
                      |
                      v
             +-------------------+
             | Servicios externos|
             | IA / facturación  |
             +-------------------+
```

---

## 4. Comunicación frontend-backend

```text
+-------------------+
|      Browser      |
| React + Vite      |
+---------+---------+
          |
          | HTTP
          | JSON
          | Cookies
          | CSRF
          v
+-------------------+
| Node.js + Express |
|       API         |
+---------+---------+
          |
          v
+-------------------+
| Servicios /       |
| Repositorios      |
+-------------------+
```

El frontend no debe acceder directamente a MySQL o Redis.

Las operaciones de negocio deben pasar por la API.

---

## 5. Flujo de una petición API

```text
Cliente
   |
   v
HTTP Request
   |
   v
Middleware
   |
   +--> Autenticación
   |
   +--> Autorización
   |
   +--> Tenant
   |
   +--> Validación
   |
   v
Controller / Handler
   |
   v
Service
   |
   v
Repository
   |
   v
Persistencia
   |
   v
Response
```

La secuencia exacta puede variar según el módulo.

---

## 6. Arquitectura backend

```text
+------------------------------------------------+
|                  Express API                   |
+-------------------------+----------------------+
                          |
                          v
+------------------------------------------------+
|            Controllers / Handlers              |
+-------------------------+----------------------+
                          |
                          v
+------------------------------------------------+
|                    Services                    |
+-------------------------+----------------------+
                          |
                          v
+------------------------------------------------+
|                  Repositories                  |
+--------------------+---------------------------+
                     |
             +-------+-------+
             |               |
             v               v
          MySQL            Redis
```

Las responsabilidades deben mantenerse separadas para facilitar pruebas, mantenimiento y evolución.

---

## 7. Flujo de autenticación

```text
Usuario
   |
   v
Login
   |
   v
Frontend
   |
   v
API
   |
   v
Validación de credenciales
   |
   +------> Incorrectas
   |             |
   |             v
   |        Error controlado
   |
   v
Credenciales válidas
   |
   v
Sesión / tokens
   |
   +------> accessToken
   |
   +------> refreshToken
   |
   v
Cliente autenticado
```

El mecanismo exacto de persistencia y revocación debe mantenerse alineado con la implementación vigente.

---

## 8. Flujo de autorización

```text
Request autenticada
        |
        v
Identidad
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
Acción solicitada
        |
   +----+----+
   |         |
 Permitido  Denegado
   |         |
   v         v
 Operación  403 / error
```

La autorización debe ejecutarse en backend.

---

## 9. Flujo multi-tenant

```text
Usuario
   |
   v
Token / sesión
   |
   v
empresa_id
   |
   v
Request
   |
   v
Servicio
   |
   v
Repositorio
   |
   v
WHERE empresa_id = contexto
   |
   v
Datos aislados
```

El aislamiento debe verificarse también frente a intentos de acceder a identificadores pertenecientes a otra empresa.

---

## 10. Flujo de clientes

```text
Frontend
   |
   v
API Clientes
   |
   v
Validación
   |
   v
Servicio
   |
   v
Repositorio
   |
   v
MySQL
   |
   v
Cliente persistido
```

Las operaciones deben respetar empresa, autorización y restricciones de integridad.

---

## 11. Flujo de materiales e inventario

```text
Usuario
   |
   v
Frontend
   |
   v
API Materiales / Inventario
   |
   v
Validación
   |
   v
Reglas de negocio
   |
   v
Repositorio
   |
   v
MySQL
```

Cuando una operación modifique cantidades de inventario, debe evaluarse su comportamiento bajo concurrencia.

---

## 12. Flujo de proformas

```text
Usuario
   |
   v
Formulario
   |
   v
API Proformas
   |
   +--> Cliente
   |
   +--> Trabajo
   |
   +--> Medidas
   |
   +--> Materiales
   |
   +--> Cantidades
   |
   v
Cálculos
   |
   v
Persistencia
   |
   v
Proforma
```

Los cálculos realizados en frontend deben considerarse una ayuda de presentación y no sustituir las validaciones requeridas por backend.

---

## 13. Flujo de pedidos

```text
Proforma / Usuario
        |
        v
API Pedidos
        |
        v
Validación
        |
        v
Pedido
        |
        +----> Detalles
        |
        +----> Materiales
        |
        +----> Total
        |
        v
MySQL
```

El estado del pedido debe permanecer dentro de los estados permitidos por el modelo de datos.

---

## 14. Flujo de facturación

```text
Usuario autorizado
        |
        v
Frontend
        |
        v
API Facturación
        |
        v
Validación
        |
        v
Factura
        |
        +----> Detalles
        |
        +----> Totales
        |
        +----> Secuencia
        |
        v
MySQL
        |
        v
Servicio externo
cuando corresponda
```

Las operaciones de facturación deben mantener integridad, autorización y trazabilidad.

---

## 15. Flujo de IA

```text
Usuario
   |
   v
Frontend
   |
   v
API IA
   |
   v
Validación de entrada
   |
   v
Servicio IA
   |
   +------> Proveedor primario
   |
   +------> Proveedor alternativo
   |
   v
Resultado / error
   |
   v
Respuesta al cliente
```

Las integraciones deben manejar errores de proveedor, timeout, disponibilidad y cuota.

---

## 16. Flujo de persistencia

```text
Controller / Handler
        |
        v
Service
        |
        v
Repository
        |
        v
MySQL
        |
        +----> Constraints
        |
        +----> Foreign Keys
        |
        +----> Indexes
        |
        +----> Triggers
        |
        v
Resultado
```

Los triggers documentados actualmente se relacionan con actualización de totales de facturas y pedidos.

---

## 17. Flujo de sesión y revocación

```text
Login
  |
  v
Sesión
  |
  v
Token
  |
  v
Request
  |
  v
Validación
  |
  +----> Token válido
  |          |
  |          v
  |       Operación
  |
  +----> Revocado / expirado
             |
             v
        Acceso rechazado
```

El mecanismo de blacklist y sesiones debe mantenerse sincronizado con las reglas de expiración y revocación.

---

## 18. Flujo de logout

```text
Usuario
   |
   v
Logout
   |
   v
API
   |
   +----> Invalidar sesión
   |
   +----> Revocar token cuando corresponda
   |
   +----> Registrar evento
   |
   v
Sesión terminada
```

La implementación efectiva de cada paso debe verificarse mediante pruebas.

---

## 19. Flujo de seguridad de una petición

```text
HTTP Request
     |
     v
Headers / origen
     |
     v
Autenticación
     |
     v
Autorización
     |
     v
Tenant
     |
     v
Validación
     |
     v
Regla de negocio
     |
     v
Persistencia
     |
     v
Auditoría / logging
```

No todos los pasos generan necesariamente un registro independiente.

---

## 20. Flujo de errores

```text
Operación
   |
   v
Error
   |
   v
Manejo controlado
   |
   +----> HTTP status
   |
   +----> Respuesta segura
   |
   +----> Logging
   |
   +----> Auditoría cuando corresponda
   |
   v
Cliente
```

Las respuestas no deben exponer secretos, credenciales ni detalles internos innecesarios.

---

## 21. CI/CD

```text
Developer
    |
    v
Git Commit
    |
    v
GitHub
    |
    v
CI
    |
    +----> Install
    |
    +----> Lint
    |
    +----> Tests
    |
    +----> Coverage
    |
    v
Resultado
```

Las verificaciones adicionales deben incorporarse conforme se establezcan entornos reproducibles para integración, E2E, seguridad y rendimiento.

---

## 22. Dependencias externas

```text
                 +----------------+
                 |    Backend     |
                 +-------+--------+
                         |
              +----------+----------+
              |                     |
              v                     v
       +-------------+       +-------------+
       | Proveedores |       | Facturación |
       |     IA      |       |   externa   |
       +-------------+       +-------------+
```

Cada integración externa debe tratarse como un límite de confianza.

Debe contemplarse:

- Credenciales.
- Timeout.
- Errores.
- Cuotas.
- Disponibilidad.
- Respuestas inesperadas.

---

## 23. Arquitectura de datos

```text
Empresas
   |
   +---- Usuarios
   |
   +---- Clientes
   |
   +---- Materiales
   |       |
   |       +---- Variantes
   |       |
   |       +---- Colores
   |
   +---- Proveedores
   |
   +---- Trabajos
   |       |
   |       +---- Recetas
   |       +---- Referencias
   |
   +---- Proformas
   |       |
   |       +---- Items
   |       +---- Detalle
   |
   +---- Pedidos
   |       |
   |       +---- Detalle
   |
   +---- Facturas
   |       |
   |       +---- Detalle
   |
   +---- Auditoría
```

El diagrama es conceptual. La estructura completa se encuentra en la documentación de entidades y relaciones de la base de datos.

---

## 24. Relación entre módulos

```text
Clientes
   |
   v
Proformas
   |
   v
Pedidos
   |
   v
Facturación

Materiales
   |
   +------> Proformas
   |
   +------> Pedidos
   |
   +------> Inventario

Trabajos
   |
   +------> Proformas
   |
   +------> Recetas

Usuarios
   |
   +------> Operaciones
   |
   +------> Auditoría
```

Las relaciones concretas deben respetar las claves foráneas y reglas de negocio definidas por la base de datos.

---

## 25. Observabilidad

```text
                   Aplicación
                       |
          +------------+------------+
          |                         |
          v                         v
       Logging                  Auditoría
          |                         |
          +------------+------------+
                       |
                       v
                   Evidencia
```

La observabilidad debe facilitar:

- Diagnóstico.
- Seguimiento de errores.
- Auditoría.
- Verificación de operaciones.
- Investigación de incidentes.

---

## 26. Arquitectura de despliegue

La arquitectura de despliegue definitiva no se representa como una infraestructura concreta mientras no exista una configuración reproducible y verificada.

No debe asumirse la existencia de:

- Dockerfile.
- Docker Compose.
- Kubernetes.
- Servicios cloud específicos.

Cuando se establezca la infraestructura definitiva, este documento debe incorporar el diagrama correspondiente.

---

## 27. Convenciones de los diagramas

Los diagramas utilizan:

```text
[Entidad / componente]
        |
        v
Flujo de comunicación
```

Las flechas representan dirección conceptual de comunicación.

Los diagramas no pretenden representar:

- Direcciones IP.
- Puertos físicos.
- Topología de red completa.
- Configuración exacta de producción.
- Escalamiento horizontal no implementado.

---

## 28. Reglas de mantenimiento

Un diagrama debe actualizarse cuando:

- Se agregue un módulo relevante.
- Se elimine un módulo.
- Cambie una dependencia.
- Cambie una frontera de confianza.
- Cambie el mecanismo de autenticación.
- Cambie la persistencia.
- Se agregue una integración externa.
- Cambie la infraestructura de despliegue.

Los diagramas deben evitar representar componentes inexistentes únicamente para anticipar una arquitectura futura.

---

## 29. Relación con C4

Este documento complementa `docs/Arquitectura/C4.md`.

La relación es:

```text
C4
 |
 +--> Contexto
 |
 +--> Contenedores
 |
 +--> Componentes
 |
Diagramas específicos
 |
 +--> Flujos
 +--> Seguridad
 +--> Datos
 +--> Integraciones
 +--> CI/CD
```

El modelo C4 establece la estructura arquitectónica y este documento concentra representaciones de flujos e interacciones.

---

## 30. Estado actual

Los diagramas representan la arquitectura lógica conocida del proyecto y deben considerarse documentación viva.

Las partes que dependan de infraestructura todavía no establecida deben permanecer expresadas como conceptos y no como componentes desplegados.

La implementación real prevalece sobre cualquier representación desactualizada.

---

## 31. Mantenimiento arquitectónico

Todo cambio arquitectónico significativo debe revisar:

1. Código.
2. Pruebas.
3. Documentación.
4. Diagramas.
5. Decisiones técnicas.
6. Riesgos.
7. Seguridad.
8. Deuda técnica.

La actualización de diagramas debe formar parte de la trazabilidad del cambio cuando este modifique la arquitectura.
