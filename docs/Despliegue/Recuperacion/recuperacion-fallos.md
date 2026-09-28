# Recuperación ante fallos

## Propósito

Este documento define los criterios y procedimientos generales para recuperar la plataforma ante fallos que afecten frontend, backend, MySQL, Redis, servicios externos o infraestructura.

## Objetivos

La recuperación debe permitir:

- Identificar el componente afectado.
- Contener el impacto.
- Restaurar los servicios críticos.
- Mantener la integridad de los datos.
- Reducir el tiempo de indisponibilidad.
- Evitar acciones destructivas no verificadas.
- Registrar las acciones realizadas.
- Validar el funcionamiento posterior a la recuperación.

## Clasificación de fallos

Los fallos pueden clasificarse según el componente afectado:

- Frontend.
- Backend.
- MySQL.
- Redis.
- Servicios externos.
- IA.
- Red.
- Infraestructura.
- Configuración.
- Seguridad.
- Dependencias.

También deben considerarse fallos parciales y fallos que afecten simultáneamente varios componentes.

## Detección

Los fallos pueden detectarse mediante:

- Health checks.
- Logs.
- Métricas.
- Errores HTTP.
- Fallos de pruebas.
- Alertas.
- Reinicios de procesos.
- Errores de conexión.
- Reportes de usuarios.

El mecanismo de detección debe permitir determinar cuándo comenzó el problema y qué componentes presentan síntomas.

## Evaluación inicial

Antes de ejecutar acciones de recuperación se debe identificar:

- Componente afectado.
- Estado actual del servicio.
- Última versión desplegada.
- Último cambio realizado.
- Estado de MySQL.
- Estado de Redis.
- Estado del backend.
- Estado del frontend.
- Errores recientes.
- Disponibilidad de backups.

No deben realizarse cambios destructivos antes de determinar el estado de los datos cuando exista riesgo de pérdida de información.

## Priorización

Los servicios deben recuperarse considerando primero aquellos necesarios para restablecer los flujos críticos.

La prioridad debe considerar:

- Disponibilidad.
- Integridad de datos.
- Autenticación.
- Persistencia.
- Comunicación entre servicios.
- Funcionalidades principales.
- Servicios externos no críticos.

## Fallo del frontend

Ante un fallo del frontend se debe comprobar:

- Disponibilidad del servidor web.
- Existencia del artefacto generado.
- Recursos estáticos.
- Configuración de `VITE_API_URL`.
- Comunicación con el backend.
- Rutas de la aplicación.
- Errores del navegador.

Si el problema proviene de una versión reciente, puede utilizarse el procedimiento de rollback.

## Fallo del backend

Ante un fallo del backend se debe comprobar:

- Estado del proceso.
- Logs de aplicación.
- Estado de PM2.
- Variables de entorno.
- Conectividad con MySQL.
- Conectividad con Redis.
- Health checks.
- Errores HTTP.

Cuando corresponda, debe reiniciarse el proceso o aplicarse rollback hacia una versión validada.

## Fallo de PM2

Si un proceso administrado mediante PM2 falla, se debe comprobar:

- Estado del proceso.
- Motivo del reinicio.
- Consumo de memoria.
- Consumo de CPU.
- Logs.
- Configuración de `max_memory_restart`.

La configuración actual contempla un límite de reinicio por memoria de 400 MB.

Un reinicio repetitivo debe investigarse antes de considerarlo una recuperación exitosa.

## Fallo de MySQL

Ante una interrupción de MySQL se debe comprobar:

- Disponibilidad del servicio.
- Puerto de conexión.
- Credenciales.
- Variables de entorno.
- Estado de la base de datos.
- Capacidad de conexiones.
- Errores registrados.
- Integridad del esquema.

No debe iniciarse una restauración de backup únicamente por un fallo temporal de conexión.

## Recuperación de MySQL

Cuando la base de datos no pueda recuperarse mediante la restauración normal del servicio, se debe evaluar:

- Backup disponible.
- Fecha del backup.
- Integridad del backup.
- Cambios realizados desde el backup.
- Pérdida potencial de información.
- Compatibilidad del esquema.

La restauración debe ejecutarse de forma controlada y posteriormente deben validarse las tablas, restricciones, índices, triggers y procedimientos necesarios.

## Fallo de Redis

Ante un fallo de Redis se debe comprobar:

- Disponibilidad del servicio.
- Puerto 6379.
- Configuración de conexión.
- Credenciales cuando correspondan.
- Memoria utilizada.
- Estado de las claves temporales.

La recuperación debe considerar especialmente las claves utilizadas para la blacklist de tokens.

## Blacklist de tokens

La plataforma utiliza Redis para almacenar tokens revocados mediante claves con formato:

```text
bl:<jti>
