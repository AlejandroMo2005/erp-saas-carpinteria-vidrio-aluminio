# Observabilidad

## Descripción

Este documento define los criterios de observabilidad del ERP/SaaS para facilitar la detección, diagnóstico y seguimiento de problemas durante la operación del sistema.

La observabilidad se basa principalmente en logs, métricas operativas, health checks y evidencia generada durante pruebas, CI/CD y despliegues.

## Objetivo

Establecer una estrategia para:

- detectar fallos;
- diagnosticar problemas;
- supervisar componentes críticos;
- relacionar errores con versiones;
- analizar comportamiento operativo;
- proteger información sensible en los registros;
- conservar evidencia útil para mantenimiento e incidentes.

## Alcance

Aplica a:

- frontend;
- backend;
- MySQL;
- Redis;
- PM2;
- API;
- autenticación;
- operaciones de negocio;
- integraciones externas;
- servicios de IA;
- CI/CD;
- despliegues.

## Principios

La observabilidad debe proporcionar información suficiente para comprender el comportamiento del sistema sin registrar información innecesaria o sensible.

Los mecanismos de observabilidad deben priorizar:

- utilidad diagnóstica;
- trazabilidad;
- consistencia;
- seguridad;
- bajo impacto sobre el rendimiento;
- correlación entre eventos.

La existencia de logs no garantiza por sí misma una capacidad completa de diagnóstico.

## Componentes

La estrategia actual contempla principalmente:

```text
Aplicación
   │
   ├── Logs
   │
   ├── Health checks
   │
   ├── Errores HTTP
   │
   ├── Auditoría
   │
   ├── Métricas operativas
   │
   └── Evidencia de CI/CD
```

Cada mecanismo tiene una finalidad diferente y no debe utilizarse como sustituto automático de los demás.

## Logging

El backend utiliza Winston como mecanismo principal de logging.

Los logs deben proporcionar contexto suficiente para diagnosticar eventos relevantes sin incluir secretos o datos sensibles innecesarios.

Los eventos pueden incluir información relacionada con:

- autenticación;
- errores;
- operaciones relevantes;
- integraciones;
- procesos;
- excepciones;
- acciones administrativas;
- comportamiento de servicios.

## Niveles de log

Los niveles deben utilizarse de acuerdo con la importancia del evento.

De forma general:

```text
error
warn
info
debug
```

`error` debe utilizarse para fallos que requieren atención.

`warn` debe utilizarse para condiciones anómalas que no necesariamente interrumpen la operación.

`info` debe utilizarse para eventos operativos relevantes.

`debug` debe reservarse para información útil durante diagnóstico y debe controlarse especialmente en producción.

## Información sensible

Los logs no deben registrar innecesariamente:

- contraseñas;
- tokens;
- API keys;
- secretos;
- cookies completas;
- credenciales;
- datos personales innecesarios;
- contenido sensible enviado a servicios externos.

Cuando sea necesario registrar un identificador, debe utilizarse una representación que no exponga información sensible.

## Autenticación

Los eventos relacionados con autenticación deben permitir investigar problemas como:

- inicio de sesión fallido;
- inicio de sesión exitoso;
- cierre de sesión;
- renovación de sesión;
- invalidación de tokens;
- cambio de contraseña.

El sistema mantiene información de auditoría relacionada con determinados eventos de autenticación mediante `auditoria_acciones`.

Los registros de autenticación deben evitar almacenar credenciales o tokens completos.

## Auditoría

La auditoría y el logging tienen objetivos diferentes.

Los logs permiten diagnosticar el comportamiento técnico del sistema.

La auditoría permite conservar determinados eventos de negocio o seguridad que requieren trazabilidad.

La tabla:

```text
auditoria_acciones
```

almacena información relacionada con acciones como:

- `DELETE`;
- `ANULACION`;
- `LOGIN`;
- `LOGOUT`;
- `LOGIN_FALLIDO`;
- `REFRESH_TOKEN`;
- `CAMBIO_PASSWORD`.

La auditoría debe respetar el contexto de empresa y usuario correspondiente.

## Multi-tenancy

La observabilidad debe conservar el contexto necesario para identificar la empresa asociada a un evento cuando corresponda.

Los registros no deben permitir inferir que datos de diferentes empresas forman parte de una misma operación cuando pertenecen a tenants distintos.

La información de tenant debe utilizarse únicamente con la finalidad operativa necesaria.

## Health checks

El backend dispone de mecanismos de health check para comprobar el estado de la aplicación y sus dependencias críticas.

Los health checks deben utilizarse para:

- verificar disponibilidad;
- detectar problemas de conectividad;
- validar despliegues;
- realizar comprobaciones posteriores a una actualización.

El resultado de un health check no debe considerarse equivalente a una prueba funcional completa.

## Dependencias

Las dependencias críticas pueden incluir:

- MySQL;
- Redis;
- servicios externos;
- proveedores de IA.

Cuando una dependencia falle, la aplicación debe generar información suficiente para identificar el componente afectado sin exponer sus credenciales.

## Base de datos

Los problemas relacionados con MySQL deben poder distinguirse de errores propios de la lógica de aplicación.

Cuando corresponda, los logs deben permitir identificar:

- conexión rechazada;
- timeout;
- error de consulta;
- transacción fallida;
- restricción de integridad;
- problema de migración.

No se deben registrar consultas con información sensible de usuarios cuando no sea necesario.

## Redis

Los problemas de Redis deben poder identificarse separadamente de los problemas de MySQL.

Cuando una funcionalidad dependa de Redis, los errores deben registrar suficiente contexto para determinar:

- operación afectada;
- tipo de error;
- componente que originó la operación.

Las credenciales de Redis nunca deben aparecer en los logs.

## API

La observabilidad de la API debe permitir analizar:

- endpoint;
- método HTTP;
- código de respuesta;
- duración;
- tipo de error;
- contexto de la operación.

No se deben registrar automáticamente cuerpos completos de solicitudes o respuestas si contienen datos personales, credenciales o información sensible.

## Errores HTTP

Los errores deben clasificarse según su naturaleza.

Como referencia:

```text
4xx → problemas relacionados con la solicitud o autorización
5xx → errores del servidor o dependencias
```

Los mensajes destinados al cliente deben ser controlados y no deben exponer detalles internos innecesarios.

Los logs internos pueden conservar información técnica adicional cuando sea necesario para el diagnóstico y resulte seguro hacerlo.

## Correlación de eventos

Cuando la arquitectura lo permita, los eventos relacionados con una misma operación deberían poder asociarse mediante identificadores de correlación o contexto equivalente.

Esto facilita relacionar:

```text
Solicitud HTTP
      ↓
Controlador
      ↓
Servicio
      ↓
Base de datos / Redis / servicio externo
      ↓
Respuesta
```

No se debe introducir información sensible dentro de identificadores de correlación.

## Rendimiento

La observabilidad debe evitar generar una carga significativa sobre la aplicación.

Se debe prestar atención a:

- cantidad de logs;
- tamaño de mensajes;
- serialización de objetos;
- frecuencia de eventos;
- almacenamiento;
- retención.

Los logs excesivamente detallados pueden afectar tanto al rendimiento como al almacenamiento.

## PM2

PM2 puede utilizarse para supervisar procesos Node.js y gestionar reinicios.

Los eventos de:

- inicio;
- reinicio;
- terminación;
- errores;
- consumo excesivo de memoria

deben revisarse cuando exista comportamiento inesperado del backend.

El reinicio automático no debe ocultar la causa raíz de un fallo recurrente.

## Memoria

El proceso backend utiliza configuración de PM2 para controlar el reinicio ante consumo elevado de memoria.

La configuración actual contempla:

```text
max_memory_restart = 400M
```

Este límite es un mecanismo operativo y no sustituye el análisis de fugas de memoria o consumo anómalo.

## Frontend

La observabilidad del frontend se orienta principalmente a:

- errores de ejecución;
- fallos de comunicación con la API;
- comportamiento de navegación;
- rendimiento;
- errores de integración.

No se deben registrar en mecanismos de diagnóstico del frontend:

- tokens;
- contraseñas;
- secretos;
- información sensible innecesaria.

## Rendimiento frontend

Las mediciones de rendimiento deben realizarse mediante herramientas específicas.

Cuando corresponda, se deben observar indicadores como:

- Largest Contentful Paint;
- Cumulative Layout Shift;
- Interaction to Next Paint;
- tamaño de recursos;
- tiempo de carga.

Las mediciones deben asociarse a la versión y condiciones bajo las cuales fueron obtenidas.

## Servicios de IA

Las operaciones de IA deben conservar información suficiente para diagnosticar errores.

La tabla `ia_requests` permite registrar información como:

- empresa;
- usuario;
- tipo de trabajo;
- modelo;
- duración;
- estado;
- fecha de creación.

Los errores de proveedores deben diferenciarse, cuando sea posible, de errores internos de la aplicación.

## Integraciones externas

Las integraciones externas deben permitir identificar:

- servicio;
- operación;
- duración;
- estado;
- error;
- timeout.

Los logs no deben contener las credenciales utilizadas para realizar la integración.

## Seguridad

La observabilidad debe contribuir a detectar:

- intentos de autenticación fallidos;
- accesos no autorizados;
- errores repetitivos;
- comportamiento anómalo;
- problemas de sesión;
- fallos de validación.

Los mecanismos de logging no deben convertirse en una fuente adicional de exposición de información sensible.

## Retención

La retención de logs y registros de auditoría debe definirse según:

- necesidad operativa;
- capacidad de almacenamiento;
- requisitos de seguridad;
- requisitos legales aplicables;
- utilidad para investigación de incidentes.

No se debe conservar información indefinidamente sin una finalidad definida.

## Monitoreo

El monitoreo debe priorizar componentes críticos.

Como mínimo deben considerarse:

```text
Aplicación
Backend
Base de datos
Redis
API
Autenticación
Procesos PM2
Servicios externos críticos
```

Los indicadores y umbrales concretos deben definirse según el entorno operativo disponible.

## Alertas

Cuando exista infraestructura de alertas, estas deben priorizar eventos que requieran intervención.

Ejemplos:

- backend no disponible;
- health check fallido;
- errores 5xx recurrentes;
- reinicios repetidos;
- consumo de memoria anómalo;
- base de datos inaccesible;
- Redis inaccesible;
- proveedor externo no disponible.

Las alertas no deben generarse indiscriminadamente hasta producir ruido operativo.

## CI/CD

El pipeline proporciona evidencia sobre:

- ejecución de lint;
- pruebas;
- cobertura;
- análisis de calidad;
- generación de artefactos.

Los resultados del pipeline deben relacionarse con la versión o commit correspondiente.

## Despliegues

Después de cada despliegue se deben revisar:

- health checks;
- disponibilidad;
- errores recientes;
- logs;
- operaciones críticas;
- estado de dependencias.

Esta revisión permite detectar problemas que no hayan sido identificados durante CI/CD.

## Incidentes

Cuando ocurra un incidente, la observabilidad debe permitir recopilar:

- versión;
- fecha y hora;
- componente;
- error;
- duración;
- impacto;
- eventos relacionados;
- acción aplicada.

Los datos deben conservarse únicamente durante el período necesario según las políticas aplicables.

## Evidencia

Cuando sea necesario documentar el estado de una versión, se pueden conservar:

- resultados de pruebas;
- cobertura;
- logs relevantes;
- resultados de health checks;
- métricas de rendimiento;
- resultados de análisis de seguridad;
- evidencia de despliegue.

La evidencia debe conservar el contexto suficiente para determinar a qué versión corresponde.

## Pruebas de observabilidad

Los mecanismos de observabilidad deben probarse cuando formen parte de comportamientos críticos.

Las pruebas pueden verificar:

- generación de eventos;
- niveles de log;
- manejo de errores;
- auditoría;
- health checks;
- protección de información sensible.

No se debe depender exclusivamente de una inspección manual para comprobar estos mecanismos.

## Mantenimiento

Este documento debe actualizarse cuando cambien:

- el sistema de logging;
- la arquitectura;
- los health checks;
- PM2;
- Redis;
- MySQL;
- las integraciones externas;
- los mecanismos de auditoría;
- las herramientas de monitoreo;
- las políticas de retención.

La documentación debe reflejar las capacidades realmente disponibles.

## Documentación relacionada

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/Base de Datos/Entidades/auditoria-acciones.md`
- `docs/Base de Datos/Entidades/ia-requests.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Despliegue/deployment.md`
- `docs/IA/ai.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Solucion de Problemas/troubleshooting.md`
- `docs/Decisiones Técnicas/decisions.md`
