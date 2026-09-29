# Flujos Críticos del Sistema

## 1. Propósito

Este documento identifica y describe los flujos funcionales y técnicos cuya correcta ejecución resulta relevante para la operación de la plataforma ERP/SaaS.

Los flujos críticos se utilizan como referencia para pruebas unitarias, integración, E2E, seguridad, rendimiento, observabilidad y análisis de regresión.

---

## 2. Alcance

Los flujos considerados incluyen:

- Autenticación.
- Gestión de sesiones.
- Autorización.
- Aislamiento multi-tenant.
- Clientes.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.
- Proveedores.
- Trabajos.
- IA.
- Auditoría.
- Recuperación de credenciales.
- Manejo de errores.

---

## 3. Criterio de criticidad

Un flujo se considera crítico cuando un fallo puede afectar:

- Acceso al sistema.
- Seguridad.
- Aislamiento entre empresas.
- Integridad de datos.
- Inventario.
- Información comercial.
- Facturación.
- Persistencia.
- Continuidad de una operación principal.

La criticidad no implica que todos los flujos tengan actualmente el mismo nivel de automatización o cobertura.

---

## 4. Flujo de autenticación

```text
Usuario
   |
   v
Formulario de login
   |
   v
API
   |
   v
Validación
   |
   v
Credenciales
   |
   +------> Inválidas
   |           |
   |           v
   |      Error controlado
   |
   v
Usuario válido
   |
   v
Sesión / tokens
   |
   v
Frontend autenticado
```

Debe verificarse:

- Credenciales válidas.
- Credenciales inválidas.
- Usuario inactivo.
- Sesión.
- Token.
- Errores.
- Registro de eventos cuando corresponda.

---

## 5. Flujo de sesión

```text
Login
  |
  v
Sesión creada
  |
  v
Access token
  |
  v
Requests autenticadas
  |
  +----> Token válido
  |          |
  |          v
  |       Operación
  |
  +----> Expirado / revocado
             |
             v
          Rechazo
```

El flujo debe comprobar el estado de la sesión y la validez del mecanismo de autenticación utilizado.

---

## 6. Flujo de logout

```text
Usuario
   |
   v
Logout
   |
   v
API
   |
   +--> Invalidación de sesión
   |
   +--> Revocación correspondiente
   |
   +--> Auditoría / logging
   |
   v
Acceso terminado
```

Debe verificarse que una sesión terminada no continúe proporcionando acceso cuando corresponda revocarla.

---

## 7. Flujo de recuperación de contraseña

```text
Usuario
   |
   v
Solicitud de recuperación
   |
   v
Validación
   |
   v
Código / token
   |
   v
Verificación
   |
   v
Nueva contraseña
   |
   v
Credencial actualizada
```

Debe contemplarse:

- Código inválido.
- Token expirado.
- Token utilizado.
- Usuario inexistente.
- Nueva contraseña inválida.
- Uso posterior del token.

La información de recuperación no debe permitir enumerar innecesariamente usuarios.

---

## 8. Flujo de autorización

```text
Request
   |
   v
Autenticación
   |
   v
Usuario
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
Acción
   |
   +----> Permitida
   |          |
   |          v
   |       Operación
   |
   +----> Denegada
              |
              v
          Error HTTP
```

La autorización efectiva debe aplicarse en backend.

---

## 9. Flujo multi-tenant

```text
Usuario A
   |
   v
empresa_id = A
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
Datos empresa A
```

Un intento de acceder a datos de otra empresa debe ser rechazado.

Debe probarse:

- Lectura.
- Creación.
- Modificación.
- Eliminación.
- Búsqueda.
- Acceso por identificador.
- Relaciones entre entidades.

---

## 10. Flujo de creación de cliente

```text
Usuario
   |
   v
Formulario
   |
   v
API Clientes
   |
   v
Validación
   |
   v
empresa_id
   |
   v
Repositorio
   |
   v
MySQL
   |
   v
Cliente creado
```

Debe verificarse la unicidad y las restricciones definidas para el cliente.

---

## 11. Flujo de materiales

```text
Usuario autorizado
   |
   v
Formulario material
   |
   v
API Materiales
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
```

Debe verificarse:

- Nombre.
- Precio.
- Stock.
- Stock mínimo.
- Empresa.
- Estado.
- Eliminación lógica cuando corresponda.

---

## 12. Flujo de inventario

```text
Operación de inventario
        |
        v
Validación
        |
        v
Material
        |
        v
Stock actual
        |
        v
Regla de operación
        |
        v
Actualización
        |
        v
Persistencia
```

Debe evaluarse el comportamiento ante operaciones concurrentes cuando exista riesgo de pérdida de actualización o stock inconsistente.

---

## 13. Flujo de proforma

```text
Cliente
   |
   v
Trabajo
   |
   v
Medidas
   |
   v
Materiales
   |
   v
Cantidades
   |
   v
Cálculos
   |
   v
Proforma
   |
   v
Persistencia
```

Debe comprobarse que los elementos de la proforma correspondan con la empresa y las reglas de negocio.

---

## 14. Flujo de cálculo de proforma

```text
Entrada
   |
   +--> Ancho
   +--> Alto
   +--> Cantidad
   +--> Material
   +--> Precio
   |
   v
Validación
   |
   v
Cálculo
   |
   v
Subtotal
   |
   v
Total
```

Los valores deben mantenerse dentro de los rangos definidos por las reglas de negocio.

Las validaciones del backend deben impedir valores inválidos aunque el frontend los haya restringido.

---

## 15. Flujo de pedido

```text
Proforma / Usuario
        |
        v
Crear pedido
        |
        v
Validar detalles
        |
        v
Materiales
        |
        v
Cantidades
        |
        v
Total
        |
        v
Persistencia
        |
        v
Pedido
```

Debe comprobarse la relación con la proforma cuando corresponda y la consistencia de sus detalles.

---

## 16. Flujo de estados del pedido

```text
PENDIENTE
    |
    v
PROCESADO
    |
    v
ENTREGADO
```

También existe:

```text
PENDIENTE
    |
    v
CANCELADO
```

Las transiciones permitidas deben estar respaldadas por reglas de negocio y autorización.

---

## 17. Flujo de facturación

```text
Pedido / operación comercial
          |
          v
Factura
          |
          v
Detalles
          |
          v
Cálculo de totales
          |
          v
Secuencia
          |
          v
Persistencia
          |
          v
Proceso SRI / externo
cuando corresponda
```

Debe verificarse la integridad de:

- Detalles.
- Totales.
- IVA.
- Secuencia.
- Empresa.
- Estado.
- Autorización.

---

## 18. Flujo de estados de factura

Los estados contemplados por el modelo son:

```text
BORRADOR
EMITIDA
AUTORIZADA
ANULADA
DEVUELTA
NO_AUTORIZADA
```

Los estados relacionados con el proceso SRI contemplan:

```text
PENDIENTE
RECIBIDA
DEVUELTA
AUTORIZADA
NO_AUTORIZADA
SIN_ENVIAR
```

Las transiciones válidas deben corresponder a las reglas de negocio y a la integración efectiva.

---

## 19. Flujo de secuencias de comprobantes

```text
Solicitud de comprobante
        |
        v
Empresa
        |
        v
Tipo de comprobante
        |
        v
Establecimiento
        |
        v
Punto de emisión
        |
        v
Secuencia actual
        |
        v
Nuevo número
```

La generación de secuencias debe considerar concurrencia para evitar duplicación de números.

---

## 20. Flujo de proveedores

```text
Proveedor
   |
   v
Validación
   |
   v
Empresa
   |
   v
Proveedor
   |
   +----> Materiales relacionados
   |
   v
Persistencia
```

La relación proveedor-material debe respetar las restricciones de integridad definidas en la base de datos.

---

## 21. Flujo de trabajos

```text
Trabajo
   |
   +----> Empresa
   |
   +----> Recetas
   |
   +----> Referencias
   |
   v
Persistencia
```

Los trabajos pueden utilizarse como parte del proceso de elaboración de proformas y funcionalidades relacionadas.

---

## 22. Flujo de IA

```text
Imagen / entrada
      |
      v
Frontend
      |
      v
API IA
      |
      v
Validación
      |
      v
Proveedor IA
      |
      +----> Éxito
      |
      +----> Error
      |
      +----> Timeout
      |
      +----> Cuota
      |
      v
Resultado
```

La integración no debe asumir disponibilidad permanente del proveedor.

Se conoce que un proveedor de IA puede responder `402` cuando existe un problema relacionado con créditos o cuota. Este escenario debe permanecer contemplado en las pruebas de integración.

---

## 23. Flujo de auditoría

```text
Operación relevante
        |
        v
Backend
        |
        v
Evento
        |
        v
Auditoria_acciones
        |
        v
Registro persistente
```

Las acciones auditables incluyen eventos relacionados con autenticación y operaciones sensibles según el modelo de datos.

---

## 24. Flujo de errores de API

```text
Request
   |
   v
Validación
   |
   +----> Error de entrada
   |
   v
Servicio
   |
   +----> Error de negocio
   |
   v
Repositorio
   |
   +----> Error de persistencia
   |
   v
Respuesta controlada
```

El cliente debe recibir una respuesta coherente sin exposición innecesaria de información interna.

---

## 25. Flujo transaccional

Cuando una operación requiera múltiples modificaciones:

```text
BEGIN
  |
  v
Operación 1
  |
  v
Operación 2
  |
  v
Validación
  |
  +----> Error
  |        |
  |        v
  |      ROLLBACK
  |
  v
COMMIT
```

Las operaciones que no requieran transacción no deben introducir artificialmente complejidad transaccional.

---

## 26. Flujo de concurrencia

```text
Usuario A --------+
                  |
                  v
               Recurso
                  ^
                  |
Usuario B --------+
```

Debe analizarse especialmente cuando dos operaciones puedan modificar simultáneamente:

- Stock.
- Secuencias.
- Estados.
- Totales.
- Registros comerciales.

---

## 27. Flujo de pruebas

```text
Cambio
  |
  v
Unitarias
  |
  v
Integración
  |
  v
E2E
  |
  v
Seguridad
  |
  v
Rendimiento
  |
  v
Evidencia
```

No todos los cambios requieren ejecutar todos los niveles. La selección debe depender del impacto.

---

## 28. Flujo de regresión

```text
Cambio
  |
  v
Identificar áreas afectadas
  |
  v
Pruebas relacionadas
  |
  v
Pruebas críticas
  |
  v
Resultado
```

Los flujos críticos deben priorizarse cuando una modificación afecte directamente sus dependencias.

---

## 29. Flujo CI/CD

```text
Commit
  |
  v
CI
  |
  +--> Instalación
  |
  +--> Lint
  |
  +--> Unitarias
  |
  +--> Coverage
  |
  v
Resultado
```

Las etapas adicionales deben agregarse de forma progresiva conforme exista infraestructura reproducible para ellas.

---

## 30. Flujo de gestión de incidentes

```text
Evento
  |
  v
Detección
  |
  v
Clasificación
  |
  v
Contención
  |
  v
Investigación
  |
  v
Erradicación
  |
  v
Recuperación
  |
  v
Cierre
  |
  v
Lecciones aprendidas
```

Este flujo se relaciona con `docs/Seguridad/respuesta-incidentes.md`.

---

## 31. Flujo de recuperación de credenciales comprometidas

```text
Detección
   |
   v
Revocar sesión / tokens
   |
   v
Cambiar credencial
   |
   v
Verificar acceso
   |
   v
Revisar auditoría
   |
   v
Cerrar incidente
```

Las acciones exactas deben depender del tipo de compromiso identificado.

---

## 32. Prioridad de los flujos

Los flujos deben priorizarse para pruebas y regresión según su impacto.

| Flujo | Impacto principal |
|---|---|
| Autenticación | Acceso |
| Autorización | Seguridad |
| Multi-tenancy | Aislamiento |
| Inventario | Integridad de stock |
| Proformas | Operación comercial |
| Pedidos | Operación comercial |
| Facturación | Integridad financiera |
| Sesiones | Seguridad |
| IA | Funcionalidad externa |
| Auditoría | Trazabilidad |

Esta tabla no representa un ranking de calidad; identifica áreas de impacto para planificación de pruebas.

---

## 33. Evidencia esperada

Según el flujo, la evidencia puede incluir:

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Logs.
- Registros de auditoría.
- Resultados de CI.
- Capturas.
- Reportes de cobertura.
- Mediciones de rendimiento.
- Resultados de seguridad.

La evidencia debe demostrar el comportamiento evaluado.

---

## 34. Estado actual

Los flujos críticos están documentados como referencia para organizar pruebas y verificación.

El nivel de automatización no es necesariamente uniforme en todos los flujos.

La documentación debe distinguir entre:

- Flujo diseñado.
- Flujo implementado.
- Flujo probado.
- Flujo validado mediante evidencia.

---

## 35. Mantenimiento

Este documento debe actualizarse cuando:

- Se agregue un flujo crítico.
- Cambie una regla de negocio.
- Cambie un estado.
- Cambie una integración.
- Se modifique autenticación.
- Se modifique autorización.
- Se modifique multi-tenancy.
- Se agregue una operación financiera.
- Se introduzca una nueva dependencia externa.

Cada cambio relevante debe revisar los casos de prueba asociados al flujo afectado.
