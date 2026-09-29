# Inteligencia Artificial

## Descripción

Esta documentación centraliza la arquitectura, funcionamiento, configuración, observabilidad y consideraciones operativas relacionadas con las capacidades de inteligencia artificial de la plataforma ERP/SaaS.

La plataforma integra servicios externos de inteligencia artificial para operaciones relacionadas con el procesamiento y generación de referencias visuales utilizadas en los trabajos de carpintería de vidrio y aluminio.

## Propósito

El propósito es documentar el uso de inteligencia artificial dentro de la plataforma, diferenciando las responsabilidades de la aplicación de las capacidades proporcionadas por servicios externos.

La documentación también establece criterios para controlar errores, tiempos de respuesta, costos operativos, seguridad y trazabilidad de las solicitudes.

## Alcance

Comprende:

- Solicitudes de inteligencia artificial.
- Procesamiento de imágenes.
- Generación o transformación de referencias visuales.
- Modelos utilizados.
- Proveedores externos.
- Configuración.
- Manejo de errores.
- Timeouts.
- Registro de solicitudes.
- Rendimiento.
- Seguridad.
- Protección de información.
- Observabilidad.
- Limitaciones de los servicios externos.

## Arquitectura de IA

La funcionalidad de inteligencia artificial se encuentra integrada en el backend y utiliza servicios externos para ejecutar determinadas operaciones.

La plataforma contempla integración con servicios asociados a:

- Stability AI.
- Claude Vision.
- Replicate.
- Modelos de generación o procesamiento de imágenes.

La aplicación actúa como intermediario entre el usuario y los servicios externos, aplicando validaciones, configuración, manejo de errores y registro de las operaciones.

## Flujo general

El flujo general de una operación de IA comprende:

1. El usuario solicita una operación desde el frontend.
2. El frontend envía la solicitud al backend.
3. El backend valida los datos recibidos.
4. Se determina el tipo de trabajo y configuración correspondiente.
5. Se prepara la solicitud para el proveedor externo.
6. Se ejecuta la operación.
7. Se procesa la respuesta.
8. Se registra información operativa de la solicitud.
9. Se devuelve el resultado al frontend.
10. El frontend presenta el resultado al usuario.

Los detalles concretos pueden variar según el proveedor y el tipo de operación.

## Tipos de operaciones

Las operaciones de IA están relacionadas principalmente con trabajos visuales y procesamiento de referencias.

La información de cada solicitud puede asociarse con un tipo de trabajo mediante el campo `trabajo_tipo` de `ia_requests`.

No se debe asumir un catálogo cerrado de operaciones mientras este no se encuentre definido explícitamente en la implementación.

## Modelos

La tabla `ia_requests` registra el modelo utilizado mediante el campo `modelo`.

El esquema establece como valor predeterminado:

`runwayml/stable-diffusion-inpainting`

La configuración efectiva del modelo puede depender del flujo y del proveedor utilizado.

Los modelos deben considerarse configurables y sujetos a cambios, por lo que el modelo utilizado debe conservarse como parte de la información de la solicitud cuando corresponda.

## Proveedores externos

Las operaciones de IA dependen de servicios externos.

Entre los proveedores o servicios integrados se encuentran:

- Stability AI.
- Claude Vision.
- Replicate.

La disponibilidad, latencia, límites de uso, costos y respuestas de estos servicios están fuera del control directo de la plataforma.

Por esta razón, los errores externos deben diferenciarse de los errores propios del backend.

## Stability AI

Stability AI forma parte de los servicios utilizados para determinadas operaciones de generación o procesamiento visual.

Las operaciones deben considerar:

- Disponibilidad del proveedor.
- Credenciales.
- Modelo configurado.
- Tiempo de respuesta.
- Código HTTP.
- Errores del servicio.
- Límites del proveedor.
- Resultado obtenido.

Se ha contemplado el manejo de respuestas de error del proveedor, incluyendo situaciones en las que el servicio puede responder con HTTP 402.

Un error de este tipo debe interpretarse según la respuesta real del proveedor y no como un error genérico de infraestructura de la plataforma.

## Claude Vision

Claude Vision forma parte de las capacidades utilizadas para análisis visual.

Las operaciones que dependen de visión deben considerar:

- Imagen de entrada.
- Solicitud enviada.
- Respuesta del modelo.
- Tiempo de procesamiento.
- Errores del proveedor.
- Límites del servicio.
- Información registrada para diagnóstico.

La aplicación debe evitar almacenar información sensible innecesaria asociada con las imágenes procesadas.

## Replicate

Replicate se utiliza como proveedor externo para determinadas operaciones de procesamiento de imágenes.

Su integración debe contemplar:

- Modelo utilizado.
- Solicitud enviada.
- Estado del procesamiento.
- Tiempo de espera.
- Resultado.
- Errores.
- Disponibilidad del proveedor.

Las operaciones asincrónicas o de duración variable deben manejarse considerando los límites de tiempo y estados proporcionados por el servicio.

## Imágenes de entrada

Las imágenes constituyen uno de los principales datos utilizados por las operaciones de IA.

El procesamiento debe considerar:

- Formato.
- Tamaño.
- Dimensiones.
- Validación.
- Límites de contenido.
- Almacenamiento temporal.
- Protección de información.

La tabla `ia_requests` registra `imagen_input_hash`, permitiendo asociar una solicitud con una representación de la imagen de entrada sin requerir almacenar necesariamente la imagen completa dentro del registro.

## Imágenes de salida

Los resultados visuales pueden registrarse mediante `resultado_url` en `ia_requests`.

Las URLs de resultados deben manejarse considerando:

- Disponibilidad del recurso.
- Expiración cuando aplique.
- Seguridad de acceso.
- Persistencia.
- Privacidad.
- Dependencia del proveedor.

No debe asumirse que una URL proporcionada por un servicio externo es permanente.

## Validación de solicitudes

Las solicitudes de IA deben validarse antes de enviarse a los proveedores externos.

Entre los controles relevantes se encuentran:

- Tipo de operación.
- Datos requeridos.
- Dimensiones de imagen.
- Tamaño del contenido.
- Parámetros permitidos.
- Límites de entrada.
- Formato esperado.

Las validaciones deben ejecutarse antes de consumir recursos externos cuando sea posible.

## Límites de contenido

Las rutas relacionadas con IA y referencias deben considerar límites sobre el tamaño del contenido recibido.

Esto permite:

- Evitar solicitudes excesivamente grandes.
- Reducir consumo de memoria.
- Limitar abuso.
- Prevenir procesamiento innecesario.
- Controlar costos asociados a servicios externos.

Los límites deben mantenerse alineados con las necesidades reales de las operaciones.

## Seguridad

Las operaciones de IA deben respetar los controles generales de seguridad de la plataforma.

Se deben considerar:

- Autenticación.
- Autorización.
- Aislamiento por `empresa_id`.
- Validación de entrada.
- Protección de credenciales.
- Protección de imágenes.
- Protección de resultados.
- Límites de solicitudes.
- Registro seguro.

Las credenciales de proveedores externos no deben almacenarse en el código fuente ni exponerse al frontend.

## Aislamiento multiempresa

Las solicitudes de IA deben ejecutarse dentro del contexto de la empresa correspondiente.

La tabla `ia_requests` contiene `empresa_id`, lo que permite asociar cada solicitud con su empresa.

Las operaciones deben impedir que una empresa consulte o utilice información generada para otra empresa sin autorización.

## Registro de solicitudes

La tabla `ia_requests` permite conservar información operativa de las solicitudes.

Entre los campos relevantes se encuentran:

- `empresa_id`.
- `usuario_id`.
- `trabajo_tipo`.
- `prompt`.
- `imagen_input_hash`.
- `resultado_url`.
- `modelo`.
- `duracion_ms`.
- `status`.
- `created_at`.

Esta información permite relacionar una operación con su contexto y analizar posteriormente su comportamiento.

## Estados de las solicitudes

El campo `status` utiliza los siguientes estados:

- `OK`.
- `ERROR`.
- `TIMEOUT`.

Estos estados permiten distinguir entre una operación completada correctamente, una operación que produjo un error y una operación que excedió el tiempo establecido.

## Rendimiento

Las operaciones de IA pueden presentar una latencia superior a las operaciones normales de la API debido a la dependencia de servicios externos.

El campo `duracion_ms` permite registrar la duración de una solicitud.

Las métricas relevantes incluyen:

- Duración.
- Tasa de éxito.
- Tasa de error.
- Timeouts.
- Respuestas del proveedor.
- Frecuencia de uso.

Las mediciones deben utilizarse para establecer líneas base antes de definir umbrales de rendimiento.

## Timeouts

Las operaciones de IA deben disponer de mecanismos para evitar que una solicitud externa bloquee indefinidamente una operación del backend.

Cuando una operación supera el límite establecido debe registrarse como `TIMEOUT` cuando corresponda.

El timeout debe diferenciarse de un error explícito devuelto por el proveedor.

## Manejo de errores

Los errores pueden originarse en:

- Validación local.
- Backend.
- Credenciales.
- Red.
- Proveedor externo.
- Modelo.
- Tiempo de espera.
- Procesamiento de imágenes.
- Recursos externos.

El sistema debe clasificar el error de forma que permita determinar si requiere reintento, corrección de entrada o intervención operativa.

## Reintentos

Los reintentos deben utilizarse únicamente cuando la operación pueda repetirse de forma segura.

No todos los errores deben generar reintentos automáticos.

Antes de reintentar se debe considerar:

- Tipo de error.
- Estado del proveedor.
- Idempotencia.
- Costo.
- Tiempo transcurrido.
- Número de intentos.

Los reintentos excesivos pueden incrementar el consumo de recursos y los costos del proveedor.

## Costos

Las operaciones de IA pueden generar costos asociados al uso de proveedores externos.

El diseño debe permitir observar:

- Cantidad de solicitudes.
- Tipo de operación.
- Modelo.
- Duración.
- Errores.
- Uso por empresa.

No se debe asumir un costo específico mientras no exista información contractual o tarifaria verificable del proveedor correspondiente.

## Observabilidad

Las operaciones de IA forman parte de la estrategia general de observabilidad.

La información registrada en `ia_requests` puede relacionarse con:

- Logs.
- Métricas.
- Trazabilidad.
- Auditoría cuando corresponda.
- Alertas.
- Diagnóstico.

La duración y el estado de cada solicitud permiten identificar degradaciones o incrementos de errores.

## Auditoría

No toda solicitud de IA constituye automáticamente un evento de auditoría.

La auditoría debe reservarse para eventos que requieran persistencia por motivos de seguridad, control o trazabilidad administrativa.

Los registros operativos de IA deben diferenciarse de los eventos persistentes de auditoría.

## Protección de información

Los prompts, imágenes y resultados pueden contener información proporcionada por los usuarios.

La plataforma debe evitar:

- Exposición innecesaria.
- Registro de información sensible en logs.
- Inclusión de credenciales en prompts.
- Acceso entre empresas.
- Almacenamiento innecesario.

La información enviada a proveedores externos debe limitarse a lo necesario para ejecutar la operación solicitada.

## Disponibilidad de proveedores

La disponibilidad de un servicio de IA externo no está completamente bajo control de la plataforma.

La aplicación debe contemplar:

- Errores temporales.
- Timeouts.
- Respuestas inválidas.
- Límites del proveedor.
- Cambios de modelo.
- Indisponibilidad.
- Errores de autenticación.

Cuando sea posible, estos eventos deben registrarse de forma diferenciada.

## Dependencia externa

La funcionalidad de IA debe considerarse una dependencia externa del sistema.

Una falla del proveedor no debe provocar una degradación innecesaria de funcionalidades que no dependen de IA.

La arquitectura debe mantener separadas las operaciones de IA de los procesos esenciales que pueden funcionar independientemente.

## Configuración

Las configuraciones relacionadas con IA deben mantenerse fuera del código cuando correspondan a:

- Credenciales.
- URLs de servicios.
- Identificadores de modelos.
- Límites.
- Timeouts.
- Parámetros dependientes del entorno.

Los secretos deben gestionarse mediante las configuraciones de entorno correspondientes.

## Estado actual

La plataforma dispone de integración con servicios de inteligencia artificial para operaciones relacionadas con imágenes y referencias.

La tabla `ia_requests` proporciona persistencia de información operativa sobre las solicitudes, incluyendo modelo, duración y estado.

También existe manejo de errores de proveedores externos y consideración de escenarios de timeout.

## Aspectos pendientes

Queda pendiente:

- Definir formalmente los contratos de cada proveedor.
- Establecer líneas base de rendimiento de IA.
- Definir métricas operativas específicas.
- Establecer umbrales de alertas.
- Documentar límites por proveedor.
- Definir políticas formales de retención de resultados.
- Documentar estrategias de fallback por operación.
- Revisar periódicamente modelos y proveedores.
- Evaluar costos reales de operación.
- Incorporar pruebas de rendimiento específicas para IA.

## Documentación relacionada

| Documento | Relación |
|---|---|
| [Arquitectura](../Arquitectura/architecture.md) | Contexto arquitectónico de la plataforma. |
| [API](../API/api-contracts.md) | Contratos de las operaciones expuestas por el backend. |
| [Observabilidad](../Observabilidad/observability.md) | Estrategia general de observabilidad. |
| [Métricas](../Observabilidad/Metricas/metricas.md) | Indicadores relacionados con las operaciones de IA. |
| [Logging](../Observabilidad/Logging/logging.md) | Registro de eventos y errores. |
| [Trazabilidad](../Observabilidad/Trazabilidad/trazabilidad.md) | Correlación de solicitudes y operaciones. |
| [Rendimiento](../Observabilidad/Rendimiento/rendimiento.md) | Análisis de latencia y rendimiento. |
| [Seguridad](../Observabilidad/Seguridad/seguridad.md) | Controles y observabilidad de seguridad. |
| [Diagnóstico](../Observabilidad/Diagnostico/diagnostico.md) | Investigación de errores y fallos. |
| [Variables de entorno](../Despliegue/Configuracion/variables-entorno.md) | Configuración dependiente del entorno. |
| [Secretos](../Despliegue/Configuracion/secretos.md) | Protección de credenciales. |
| [Seguridad del despliegue](../Despliegue/Seguridad/seguridad-despliegue.md) | Controles de seguridad del entorno. |
| [Base de Datos](../Base%20de%20Datos/database.md) | Persistencia de las solicitudes de IA. |
