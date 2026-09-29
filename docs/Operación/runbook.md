# Runbook Operativo

## 1. Propósito

Este documento define los procedimientos operativos básicos para diagnosticar, verificar y recuperar la plataforma ERP/SaaS ante situaciones habituales de operación.

El runbook debe servir como referencia práctica para tareas de:

- Inicio y detención.
- Verificación de servicios.
- Diagnóstico.
- Logs.
- Base de datos.
- Redis.
- API.
- Frontend.
- Autenticación.
- Incidentes.
- Recuperación.
- Validación posterior a cambios.

Los procedimientos concretos deben mantenerse alineados con la infraestructura real de cada entorno.

---

## 2. Principios operativos

Las operaciones deben seguir estos principios:

1. Verificar antes de modificar.
2. Registrar cambios relevantes.
3. Evitar operaciones destructivas sin respaldo.
4. No exponer secretos.
5. Aislar incidentes antes de realizar cambios de recuperación.
6. Validar el sistema después de cualquier intervención.
7. Preferir cambios reversibles.
8. Utilizar la misma configuración documentada por entorno.

---

## 3. Arquitectura operativa

La plataforma está compuesta conceptualmente por:

```text
Usuario
   |
   v
Frontend React/Vite
   |
   v
API Node/Express
   |
   +----> MySQL
   |
   +----> Redis
   |
   +----> Servicios externos
```

PM2 puede utilizarse como administrador de procesos del backend.

---

## 4. Información de entorno

Antes de ejecutar procedimientos debe identificarse:

- Entorno.
- Rama o versión desplegada.
- Commit.
- Node.js.
- npm.
- Variables de entorno.
- URL del frontend.
- URL de la API.
- Estado de MySQL.
- Estado de Redis.
- Proveedores externos utilizados.

No deben incluirse valores secretos en registros operativos.

---

## 5. Verificación inicial

Ante un problema debe realizarse primero una comprobación general:

```text
Aplicación
   |
   +--> Frontend disponible
   +--> API disponible
   +--> MySQL disponible
   +--> Redis disponible
   +--> Integraciones disponibles
   +--> Logs disponibles
```

El objetivo es determinar si el problema pertenece a:

- Frontend.
- Backend.
- Persistencia.
- Cache/estado temporal.
- Integración externa.
- Infraestructura.

---

## 6. Estado del backend

Debe comprobarse:

- Proceso activo.
- Puerto configurado.
- Logs.
- Conexión con MySQL.
- Conexión con Redis.
- Variables de entorno requeridas.

Cuando PM2 gestione el proceso, deben revisarse el estado y los logs correspondientes.

---

## 7. Estado del frontend

Debe verificarse:

- Proceso o servidor web.
- URL de acceso.
- Configuración de API.
- Errores del navegador.
- Errores de red.
- Recursos estáticos.
- Variables de entorno públicas.

Las variables expuestas al frontend no deben contener secretos que deban permanecer en el servidor.

---

## 8. Estado de MySQL

La comprobación debe incluir:

- Servicio disponible.
- Conectividad.
- Base de datos correcta.
- Usuario autorizado.
- Tablas esperadas.
- Errores recientes.
- Capacidad disponible.

Una aplicación que no puede conectarse a MySQL no debe considerarse operativa aunque el proceso Node esté activo.

---

## 9. Estado de Redis

Debe comprobarse:

- Disponibilidad.
- Conectividad.
- Latencia cuando sea relevante.
- Memoria.
- Estado del servicio.
- Errores de conexión.

Redis debe diferenciarse de MySQL porque cumple funciones de almacenamiento temporal y soporte.

---

## 10. Health checks

Los health checks deben utilizarse para determinar el estado de los servicios.

El backend dispone de un endpoint de salud que verifica elementos de persistencia.

El resultado debe interpretarse junto con los logs y el estado real de la infraestructura.

Un HTTP `200` aislado no demuestra que todos los flujos funcionales estén operativos.

---

## 11. Logs

Los logs deben revisarse siguiendo este orden:

```text
Error reportado
      |
      v
Hora aproximada
      |
      v
Servicio afectado
      |
      v
Request / operación
      |
      v
Stack técnico
      |
      v
Causa probable
```

El logging utiliza Winston en el backend.

No deben registrarse:

- Contraseñas.
- Tokens.
- Secretos.
- Cookies sensibles.
- Claves privadas.

---

## 12. Errores HTTP

Ante un error HTTP debe registrarse:

- Método.
- Endpoint.
- Código.
- Momento.
- Usuario o contexto no sensible.
- Empresa cuando corresponda.
- Correlation/request ID si existe.
- Error del backend.

Debe evitarse interpretar un `500` como causa raíz; representa únicamente el resultado HTTP.

---

## 13. Error de autenticación

Cuando un usuario no pueda iniciar sesión debe comprobarse:

1. Disponibilidad de API.
2. Credenciales.
3. Estado del usuario.
4. Empresa asociada.
5. Sesión.
6. Redis.
7. JWT.
8. Logs.
9. Rate limiting.

No deben modificarse credenciales manualmente sin registrar la operación correspondiente.

---

## 14. Sesión expirada

Ante una sesión expirada debe verificarse:

- Access token.
- Refresh token.
- Cookie.
- Sesión persistida.
- Lista de revocación.
- Fecha de expiración.
- Estado del usuario.

El frontend debe poder recuperar la sesión mediante el mecanismo de refresh cuando corresponda.

---

## 15. Logout

Cuando el cierre de sesión presente problemas debe verificarse:

- Solicitud al backend.
- Cookie.
- Revocación del token.
- Sesión persistida.
- Estado de Redis.
- Estado del frontend.

La salida de la interfaz no debe confundirse con la revocación efectiva de una sesión en el backend.

---

## 16. Error de CSRF

Ante un error CSRF debe comprobarse:

- Existencia de cookie CSRF.
- Encabezado `X-CSRF-Token`.
- Método HTTP.
- Configuración Axios.
- Credenciales.
- Origen permitido.
- Estado de la sesión.

No debe desactivarse la protección CSRF como solución permanente a un error de configuración.

---

## 17. Error de autorización

Cuando una operación devuelva `403` debe verificarse:

- Usuario autenticado.
- Rol.
- Permiso.
- Empresa.
- Recurso solicitado.
- Regla de autorización.

No debe solucionarse un `403` elevando el rol del usuario sin determinar primero la causa.

---

## 18. Error de multi-tenancy

Si un usuario observa información incorrecta de otra empresa, la situación debe tratarse como incidente de seguridad.

Acciones iniciales:

1. Detener la operación afectada.
2. Identificar el endpoint.
3. Registrar evidencia sin copiar datos sensibles.
4. Determinar el alcance.
5. Revisar `empresa_id`.
6. Revisar autorización.
7. Revisar consultas.
8. Contener el acceso.
9. Corregir.
10. Ejecutar pruebas de regresión.

---

## 19. Error de inventario

Ante una discrepancia de stock debe comprobarse:

- Material.
- Variante.
- Empresa.
- Valor almacenado.
- Operación que modificó el stock.
- Transacción.
- Concurrencia.
- Logs.
- Auditoría.

No debe corregirse directamente el valor de stock sin determinar el origen de la discrepancia.

---

## 20. Error de proforma

Ante un problema de proforma debe comprobarse:

- Cliente.
- Empresa.
- Items.
- Detalles.
- Medidas.
- Cantidades.
- Precio unitario.
- Subtotales.
- Total.
- Persistencia.
- Cálculo utilizado.

Los cambios manuales en base de datos deben evitarse como primera alternativa.

---

## 21. Error de pedido

Debe comprobarse:

- Proforma asociada.
- Detalles.
- Total.
- Estado.
- Usuario.
- Empresa.
- Inventario relacionado.
- Transacción.

Las transiciones de estado deben verificarse contra las reglas del dominio.

---

## 22. Error de facturación

Ante un error de factura debe comprobarse:

- Estado.
- Detalles.
- Totales.
- IVA.
- Secuencia.
- Clave de acceso cuando corresponda.
- Estado SRI.
- Respuesta externa.
- Auditoría.

No debe modificarse manualmente un estado fiscal sin verificar primero las reglas y consecuencias de la operación.

---

## 23. Error de secuencia

Una secuencia de comprobantes requiere especial atención.

Debe verificarse:

- Empresa.
- Tipo de comprobante.
- Establecimiento.
- Punto de emisión.
- Secuencia actual.
- Facturas existentes.
- Operaciones concurrentes.

Los números duplicados o inconsistentes deben tratarse como incidentes de integridad.

---

## 24. Error de IA

Ante un fallo de IA debe determinarse:

- Proveedor.
- Modelo.
- Solicitud.
- Tamaño de entrada.
- Tiempo de procesamiento.
- Estado de la solicitud.
- Código HTTP.
- Cuota.
- Timeout.

Se ha identificado que proveedores de IA pueden devolver HTTP `402` por condiciones relacionadas con créditos o cuota.

Este caso debe diferenciarse de un error interno de la aplicación.

---

## 25. Error de Redis

Si Redis deja de estar disponible:

1. Confirmar conectividad.
2. Revisar logs.
3. Determinar qué funcionalidades dependen de Redis.
4. Evaluar impacto sobre sesiones y blacklist.
5. Recuperar Redis.
6. Validar autenticación.
7. Validar revocación.
8. Revisar errores posteriores.

No debe asumirse que una recuperación de Redis reconstruye automáticamente todo el estado temporal.

---

## 26. Error de MySQL

Si MySQL no está disponible:

1. Confirmar servicio.
2. Confirmar conectividad.
3. Confirmar credenciales.
4. Revisar logs.
5. Revisar capacidad.
6. Revisar integridad.
7. Recuperar el servicio.
8. Ejecutar health check.
9. Ejecutar pruebas funcionales críticas.

No debe restaurarse un backup sin determinar previamente la causa del fallo.

---

## 27. Reinicio del backend

Antes de reiniciar debe comprobarse:

- Existencia de un error reproducible.
- Estado de conexiones.
- Logs.
- Operaciones activas.
- Impacto esperado.

Después del reinicio:

```text
Proceso
   |
   v
Health check
   |
   v
MySQL
   |
   v
Redis
   |
   v
Autenticación
   |
   v
Flujo crítico
```

El reinicio no debe utilizarse para ocultar un problema recurrente.

---

## 28. PM2

Cuando PM2 sea utilizado, debe verificarse:

- Proceso.
- Estado.
- Reinicios.
- Memoria.
- CPU.
- Logs.

La configuración actual considera `max_memory_restart` de aproximadamente `400M`.

Este valor debe tratarse como configuración del entorno y no como límite universal de producción.

---

## 29. Fugas de memoria

Ante reinicios repetitivos por consumo de memoria debe revisarse:

- Logs de PM2.
- Crecimiento del heap.
- Requests prolongadas.
- Buffers.
- Archivos.
- Integraciones.
- Cache.
- Procesamiento de imágenes.
- IA.

No debe aumentarse indefinidamente el límite de memoria sin investigar la causa.

---

## 30. Problemas de rendimiento

Ante degradación de rendimiento:

```text
Síntoma
   |
   v
Medición
   |
   v
Identificación del componente
   |
   v
Consulta / endpoint / frontend
   |
   v
Corrección
   |
   v
Medición nuevamente
```

Debe evitarse optimizar sin mediciones.

---

## 31. Problemas de base de datos

Ante consultas lentas deben revisarse:

- Índices.
- Plan de ejecución.
- Cardinalidad.
- Filtros.
- Joins.
- Paginación.
- Cantidad de datos.
- Consultas repetitivas.

La solución debe considerar primero la causa antes de aumentar recursos de infraestructura.

---

## 32. Problemas de frontend

Ante errores de interfaz debe comprobarse:

- Consola del navegador.
- Network.
- Respuesta de API.
- Estado React Query.
- Variables de entorno.
- Rutas.
- Build.
- Errores de JavaScript.

Debe determinarse si el problema está en la presentación o en el backend.

---

## 33. Problemas de API

Ante una API aparentemente caída:

1. Verificar proceso.
2. Verificar puerto.
3. Verificar health endpoint.
4. Revisar logs.
5. Verificar MySQL.
6. Verificar Redis.
7. Probar una ruta no destructiva.
8. Comparar con el último despliegue.

No debe asumirse que el frontend es la causa porque la interfaz muestre un error.

---

## 34. Despliegue defectuoso

Cuando un problema aparece inmediatamente después de un despliegue:

- Identificar commit.
- Comparar cambios.
- Revisar CI.
- Revisar configuración.
- Revisar migraciones.
- Revisar logs.
- Ejecutar health check.
- Determinar posibilidad de rollback.

Los cambios de base de datos requieren especial atención porque un rollback de código no necesariamente revierte el esquema.

---

## 35. Rollback

Antes de realizar rollback debe determinarse:

- Qué versión estaba operativa.
- Qué cambió.
- Si hubo migraciones.
- Si hubo cambios de datos.
- Si existen incompatibilidades.

El rollback debe ejecutarse únicamente cuando sea seguro para el estado de los datos.

---

## 36. Migraciones

Antes de ejecutar una migración:

- Revisar script.
- Verificar backup cuando corresponda.
- Probar en entorno controlado.
- Verificar dependencias.
- Confirmar compatibilidad.

Después:

- Verificar esquema.
- Ejecutar pruebas.
- Verificar aplicación.
- Registrar resultado.

---

## 37. Incidente de seguridad

Ante un posible incidente:

1. Contener.
2. Preservar evidencia.
3. Identificar alcance.
4. Revocar credenciales comprometidas.
5. Rotar secretos cuando corresponda.
6. Revisar accesos.
7. Recuperar.
8. Validar.
9. Documentar.
10. Registrar lecciones aprendidas.

Debe seguirse el procedimiento completo definido en:

```text
docs/Seguridad/respuesta-incidentes.md
```

---

## 38. Backup y recuperación

Ante pérdida o corrupción de datos debe seguirse:

```text
Incidente
   |
   v
Contención
   |
   v
Determinar alcance
   |
   v
Seleccionar backup
   |
   v
Restaurar en entorno controlado
   |
   v
Verificar
   |
   v
Recuperar operación
```

La existencia del backup no demuestra por sí sola que pueda restaurarse correctamente.

---

## 39. Verificación posterior a incidentes

Después de recuperar el sistema deben comprobarse como mínimo:

- Frontend.
- API.
- Login.
- Sesión.
- Autorización.
- Multi-tenancy.
- Clientes.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.

Los flujos que no estén relacionados con el incidente pueden verificarse posteriormente según prioridad.

---

## 40. Registro de intervención

Toda intervención operativa relevante debe registrar:

| Campo | Descripción |
|---|---|
| Fecha | Momento de intervención |
| Entorno | Entorno afectado |
| Responsable | Persona o proceso |
| Síntoma | Problema observado |
| Acción | Cambio realizado |
| Resultado | Resultado obtenido |
| Evidencia | Log, reporte o referencia |
| Seguimiento | Acción pendiente |

No deben almacenarse secretos dentro del registro.

---

## 41. Escalamiento

Debe escalarse un problema cuando:

- Existe pérdida de datos.
- Existe acceso entre empresas.
- Existe compromiso de credenciales.
- Existe indisponibilidad prolongada.
- Existe corrupción de base de datos.
- Existe fallo fiscal.
- Existe pérdida de integridad.
- La causa no puede determinarse con seguridad.

Los incidentes de seguridad deben seguir además el procedimiento específico de respuesta.

---

## 42. Checklist operativo

Antes de declarar recuperado un servicio:

```text
[ ] Proceso disponible
[ ] Health check correcto
[ ] MySQL disponible
[ ] Redis disponible
[ ] Logs sin errores críticos nuevos
[ ] Autenticación validada
[ ] Autorización validada
[ ] Multi-tenancy validado
[ ] Flujo crítico validado
[ ] Evidencia registrada
[ ] Seguimiento creado si corresponde
```

---

## 43. Estado actual

Este runbook define procedimientos generales de operación y diagnóstico.

Los comandos específicos de producción, infraestructura, proveedor cloud, sistema operativo y orquestación deben incorporarse cuando dicha infraestructura quede definida.

No deben inventarse comandos operativos para servicios que no estén disponibles en el entorno objetivo.

---

## 44. Relación con otros documentos

Este documento se relaciona principalmente con:

```text
docs/Operación/backup-recovery.md
docs/Seguridad/respuesta-incidentes.md
docs/Seguridad/gestion-accesos.md
docs/Seguridad/gestion-secretos.md
docs/Calidad/Estrategia de Rendimiento.md
docs/Despliegue/deployment.md
docs/Observabilidad/observability.md
docs/Solucion de Problemas/troubleshooting.md
```

Cada documento mantiene su responsabilidad específica.

---

## 45. Mantenimiento

Este runbook debe actualizarse cuando:

- Cambie la infraestructura.
- Cambie PM2.
- Cambie MySQL.
- Cambie Redis.
- Cambie el proceso de despliegue.
- Se agregue monitoreo.
- Se modifique autenticación.
- Se modifique recuperación.
- Se incorpore un nuevo proveedor externo.
- Se identifique un nuevo procedimiento operativo.

Los procedimientos deben validarse periódicamente contra el entorno real para evitar documentación obsoleta.
