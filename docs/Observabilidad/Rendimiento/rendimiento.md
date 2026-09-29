# Rendimiento

## Descripción

Esta documentación define los criterios para observar, medir, analizar y mejorar el rendimiento de la plataforma ERP/SaaS. Se consideran el frontend, backend, API, MySQL, Redis, servicios de inteligencia artificial e infraestructura de ejecución.

El objetivo es disponer de indicadores y referencias que permitan detectar degradaciones, identificar cuellos de botella y evaluar el impacto de cambios arquitectónicos, funcionales o de infraestructura.

## Propósito

El control del rendimiento busca mantener tiempos de respuesta adecuados, reducir el consumo innecesario de recursos y detectar problemas antes de que afecten de forma significativa a las operaciones del sistema.

La evaluación debe considerar tanto el rendimiento aislado de cada componente como el comportamiento de los flujos completos.

## Alcance

El análisis de rendimiento comprende:

- Frontend React/Vite.
- API y backend Node.js/Express.
- Consultas y conexiones MySQL.
- Operaciones de Redis.
- Procesos relacionados con inteligencia artificial.
- Procesos críticos del ERP.
- Memoria y procesos administrados mediante PM2.
- Latencia, errores y consumo de recursos.
- Pruebas de carga y rendimiento.
- Comparación contra líneas base conocidas.

## Indicadores de rendimiento

Los principales indicadores considerados son:

| Indicador | Aplicación |
|---|---|
| Tiempo de respuesta | API y operaciones del sistema |
| Latencia | Backend, base de datos, Redis y servicios externos |
| Throughput | Solicitudes procesadas por unidad de tiempo |
| Tasa de errores | API y procesos críticos |
| Uso de memoria | Backend y procesos administrados |
| Uso de CPU | Backend e infraestructura |
| Tiempo de consulta | MySQL |
| Tiempo de operación | Redis |
| Duración de procesos IA | Servicios de inteligencia artificial |
| LCP | Rendimiento de carga del frontend |
| CLS | Estabilidad visual |
| INP | Capacidad de respuesta de la interfaz |

## Rendimiento del frontend

El frontend utiliza React y Vite. Su rendimiento debe evaluarse considerando el tiempo de carga inicial, ejecución de JavaScript, renderizado, interacción del usuario y transferencia de recursos.

La línea base disponible mediante Lighthouse registra:

- Performance: 98.
- Accessibility: 100.
- Best Practices: 100.
- SEO: 100.
- LCP: 2.45 s.
- CLS: 0.
- INP: 56 ms.

Estos valores representan una medición disponible del estado del frontend y deben utilizarse como referencia para detectar regresiones posteriores.

Entre los aspectos relevantes se encuentran:

- Tamaño de los bundles.
- Carga de recursos JavaScript.
- Renderizado de componentes.
- Cantidad de solicitudes realizadas durante la carga.
- Consultas y mutaciones realizadas mediante React Query.
- Carga diferida de componentes cuando corresponda.
- Re-renderizados innecesarios.
- Tiempo de interacción.
- Estabilidad del layout.

## Rendimiento del backend

El backend está construido sobre Node.js y Express y expone la API utilizada por el frontend.

El análisis debe considerar:

- Tiempo de respuesta de cada endpoint.
- Cantidad de solicitudes procesadas.
- Errores HTTP.
- Operaciones de lectura y escritura.
- Consultas a MySQL.
- Acceso a Redis.
- Consumo de memoria.
- Consumo de CPU.
- Operaciones con servicios externos.
- Procesamiento de solicitudes concurrentes.

Las operaciones de mayor impacto deben identificarse mediante mediciones y registros, evitando optimizaciones basadas únicamente en suposiciones.

## Rendimiento de la API

El rendimiento de la API debe analizarse desde el inicio de la solicitud hasta la generación de la respuesta.

Se deben observar como mínimo:

- Latencia total.
- Tiempo de procesamiento interno.
- Tiempo empleado en consultas de base de datos.
- Tiempo empleado en Redis.
- Tiempo empleado en servicios externos.
- Tamaño de las respuestas.
- Código HTTP generado.
- Frecuencia de errores.
- Comportamiento bajo concurrencia.

Las operaciones críticas del ERP, como autenticación, gestión de materiales, proformas, pedidos, facturación e inventario, deben recibir especial atención durante las pruebas de rendimiento.

## Rendimiento de MySQL

MySQL constituye una dependencia principal del backend. Su rendimiento depende de la calidad de las consultas, los índices, el tamaño de las tablas, el uso del pool de conexiones y el comportamiento concurrente.

La configuración conocida utiliza un pool de hasta 10 conexiones.

Los indicadores relevantes son:

- Tiempo de ejecución de consultas.
- Tiempo de espera por conexión.
- Consultas lentas.
- Uso de índices.
- Bloqueos.
- Deadlocks.
- Cantidad de conexiones activas.
- Transacciones abiertas.
- Volumen de datos procesado.

Las optimizaciones deben considerar los índices existentes y la estrategia de concurrencia documentada en la base de datos.

## Rendimiento de Redis

Redis se utiliza como componente de soporte para operaciones relacionadas con autenticación, sesiones y listas de bloqueo de tokens.

Su rendimiento debe observar:

- Latencia de operaciones.
- Cantidad de solicitudes.
- Errores de conexión.
- Disponibilidad.
- Uso de memoria.
- Tiempo de expiración de claves.
- Comportamiento bajo concurrencia.

Los problemas de disponibilidad de Redis deben diferenciarse de los problemas propios de MySQL y del backend.

## Rendimiento de inteligencia artificial

Las operaciones de inteligencia artificial pueden presentar mayor latencia debido a la dependencia de servicios externos.

La tabla `ia_requests` registra información que permite analizar estas operaciones, incluyendo:

- Tipo de trabajo.
- Modelo utilizado.
- Duración en milisegundos.
- Estado de la solicitud.
- Fecha de creación.
- Hash de la imagen de entrada.

Los estados registrados son:

- `OK`
- `ERROR`
- `TIMEOUT`

El campo `duracion_ms` constituye una referencia directa para analizar la duración de las solicitudes de IA.

Los errores de proveedores externos deben diferenciarse de los problemas internos de la plataforma. Por ejemplo, un error HTTP 402 de un proveedor de IA no debe interpretarse automáticamente como una degradación del rendimiento interno del backend.

## Rendimiento de procesos críticos

Los procesos críticos deben evaluarse de extremo a extremo cuando su funcionamiento depende de múltiples componentes.

Entre ellos se consideran:

- Autenticación.
- Renovación de sesión.
- Gestión de clientes.
- Gestión de materiales.
- Generación de proformas.
- Gestión de pedidos.
- Facturación.
- Consultas de inventario.
- Procesamiento de referencias mediante IA.

El análisis debe considerar tanto el tiempo total como el comportamiento de cada dependencia involucrada.

## Consumo de recursos

El consumo de recursos debe analizarse principalmente en:

- CPU.
- Memoria RAM.
- Conexiones MySQL.
- Memoria utilizada por Redis.
- Procesos Node.js.
- Procesos administrados mediante PM2.
- Recursos consumidos durante operaciones de IA.

PM2 está configurado con un límite de reinicio por consumo de memoria mediante `max_memory_restart`, establecido actualmente en 400 MB.

Este mecanismo permite limitar el impacto de un proceso Node.js que presente un crecimiento excesivo de memoria, aunque no sustituye la identificación de la causa del consumo.

## Pruebas de rendimiento

Las pruebas de rendimiento deben complementar las pruebas unitarias, de integración y E2E.

Se consideran:

- Pruebas de carga.
- Pruebas de concurrencia.
- Pruebas de estrés.
- Pruebas de resistencia.
- Pruebas de tiempos de respuesta.
- Pruebas de operaciones críticas.

Los resultados deben registrar como mínimo:

- Número de usuarios virtuales o solicitudes concurrentes.
- Duración de la prueba.
- Número total de solicitudes.
- Solicitudes exitosas.
- Solicitudes fallidas.
- Latencia promedio.
- Latencia de percentiles relevantes.
- Throughput.
- Recursos utilizados.

Las pruebas de carga y rendimiento forman parte de las actividades pendientes del flujo DevSecOps y no se deben considerar ejecutadas hasta disponer de resultados verificables.

## Líneas base

Las líneas base permiten comparar el comportamiento de la plataforma antes y después de modificaciones.

La línea base actualmente disponible corresponde al rendimiento del frontend obtenido mediante Lighthouse:

- Performance: 98.
- LCP: 2.45 s.
- CLS: 0.
- INP: 56 ms.

No se establece una línea base definitiva para carga del backend, MySQL, Redis o concurrencia mientras no existan mediciones reproducibles para dichos componentes.

Cada nueva medición debe conservar las condiciones relevantes de ejecución para permitir comparaciones válidas.

## Monitoreo

El rendimiento debe integrarse con el sistema general de observabilidad.

Los datos de rendimiento pueden relacionarse con:

- Logs.
- Métricas.
- Health checks.
- Alertas.
- Trazabilidad.
- Auditoría.
- Estado de infraestructura.

La correlación entre estas señales permite diferenciar una degradación de rendimiento de un problema de disponibilidad, seguridad, dependencia externa o infraestructura.

## Optimización

Las optimizaciones deben realizarse a partir de evidencia obtenida mediante mediciones.

Las principales áreas de intervención son:

- Optimización de consultas SQL.
- Uso adecuado de índices.
- Reducción de consultas innecesarias.
- Control del tamaño de respuestas HTTP.
- Reducción del trabajo ejecutado en el frontend.
- Optimización del renderizado.
- Gestión eficiente de memoria.
- Uso adecuado del pool de conexiones.
- Uso eficiente de Redis.
- Control de operaciones externas de IA.
- Ajuste de procesos administrados por PM2.

Una optimización debe validarse posteriormente mediante pruebas para comprobar que produjo una mejora y no introdujo regresiones.

## Rendimiento y concurrencia

El rendimiento debe analizarse conjuntamente con la concurrencia porque varias solicitudes simultáneas pueden modificar el comportamiento de MySQL, Redis y del backend.

Las operaciones críticas que modifican inventario, pedidos, proformas o facturación deben evaluarse considerando:

- Solicitudes simultáneas.
- Transacciones.
- Bloqueos.
- Condiciones de carrera.
- Consistencia de datos.
- Capacidad del pool de conexiones.

La estrategia específica de concurrencia de la base de datos se documenta de forma independiente.

## Rendimiento y seguridad

Las medidas de seguridad también pueden introducir operaciones adicionales que afectan el rendimiento.

Deben considerarse especialmente:

- Validación de solicitudes.
- Autenticación.
- Verificación de tokens.
- Consultas de blacklist.
- Protección contra abuso.
- Registro de eventos.
- Procesamiento de cabeceras de seguridad.

La optimización no debe eliminar controles de seguridad necesarios para obtener mejores tiempos de respuesta.

## Diagnóstico de degradaciones

Ante una degradación de rendimiento se debe seguir una secuencia basada en evidencia:

1. Confirmar que existe una degradación mediante una medición.
2. Identificar el componente afectado.
3. Correlacionar métricas, logs y trazas disponibles.
4. Revisar dependencias externas.
5. Analizar consultas y conexiones de base de datos.
6. Revisar consumo de CPU y memoria.
7. Reproducir el comportamiento cuando sea posible.
8. Aplicar una modificación controlada.
9. Ejecutar nuevamente las pruebas.
10. Comparar los resultados con la línea base.

Este proceso evita realizar cambios de arquitectura sin evidencia suficiente.

## Estado actual

Actualmente existe una línea base de rendimiento del frontend obtenida mediante Lighthouse.

El backend dispone de logging, PM2, health check, MySQL y Redis como componentes observables. Las operaciones de IA también cuentan con información de duración y estado mediante `ia_requests`.

El flujo de pruebas de rendimiento y carga todavía forma parte de las actividades pendientes del proceso DevSecOps, por lo que no se deben atribuir métricas de concurrencia o capacidad que todavía no hayan sido medidas.

## Aspectos pendientes

Queda pendiente:

- Definir y ejecutar pruebas reproducibles de carga.
- Establecer líneas base del backend.
- Medir percentiles de latencia de la API.
- Medir comportamiento bajo concurrencia.
- Medir rendimiento de consultas críticas.
- Identificar consultas lentas mediante evidencia.
- Establecer métricas operativas para Redis.
- Medir consumo de CPU y memoria bajo carga.
- Definir umbrales operativos basados en mediciones reales.
- Integrar las métricas de rendimiento con mecanismos de alerta.
- Comparar periódicamente el rendimiento con las líneas base.
- Documentar resultados de las pruebas de rendimiento.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Observabilidad](../observability.md) | Índice general de observabilidad. |
| [Logging](../Logging/logging.md) | Registro de eventos utilizados durante el diagnóstico. |
| [Métricas](../Metricas/metricas.md) | Definición de métricas observables. |
| [Health Checks](../Health%20Checks/health-checks.md) | Disponibilidad y estado de dependencias. |
| [Monitoreo](../Monitoreo/monitoreo.md) | Estrategia general de monitoreo. |
| [Alertas](../Alertas/alertas.md) | Detección y notificación de degradaciones. |
| [Trazabilidad](../Trazabilidad/trazabilidad.md) | Seguimiento de operaciones entre componentes. |
| [Auditoría](../Auditoria/auditoria.md) | Registro de eventos auditables. |
| [Seguridad](../Seguridad/seguridad.md) | Observabilidad relacionada con seguridad. |
| [Diagnóstico](../Diagnostico/diagnostico.md) | Procedimientos para identificar problemas. |
| [Escalabilidad](../../Despliegue/Escalabilidad/escalabilidad.md) | Estrategias de crecimiento de capacidad. |
| [Monitoreo de despliegue](../../Despliegue/Operacion/monitoreo.md) | Monitoreo durante la operación desplegada. |
| [Concurrencia](../../Base%20de%20Datos/Concurrencia/concurrencia.md) | Comportamiento concurrente de la persistencia. |
| [Índices](../../Base%20de%20Datos/Indices/indices.md) | Optimización de acceso a datos. |
| [Arquitectura](../../Arquitectura/architecture.md) | Componentes y organización de la plataforma. |
