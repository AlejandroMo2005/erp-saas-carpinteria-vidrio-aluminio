# Inteligencia Artificial

## Descripción

Este documento describe la integración de capacidades de inteligencia artificial utilizadas por el ERP/SaaS, incluyendo su propósito, arquitectura, servicios externos, configuración, manejo de errores, seguridad, trazabilidad y consideraciones operativas.

La documentación debe reflejar únicamente las capacidades actualmente presentes en el sistema.

## Objetivo

Establecer criterios para:

- integrar servicios de IA;
- gestionar modelos y proveedores;
- validar entradas;
- controlar errores y timeouts;
- proteger credenciales;
- registrar solicitudes;
- gestionar resultados;
- mantener trazabilidad;
- controlar cambios en las integraciones.

## Alcance

Este documento contempla las funcionalidades de IA relacionadas con:

- generación o transformación de imágenes;
- procesamiento de referencias;
- visión por computadora;
- servicios externos de generación;
- almacenamiento de metadatos de solicitudes;
- manejo de errores;
- observabilidad.

No establece capacidades futuras como funcionalidades existentes.

## Arquitectura

La integración de IA se encuentra separada de la lógica principal de negocio.

El flujo conceptual es:

```text
Frontend
   │
   ▼
Backend
   │
   ▼
Servicio de IA
   │
   ├────────► Proveedor externo de IA
   │
   └────────► Persistencia de metadatos
```

La aplicación mantiene la responsabilidad de validar las solicitudes, controlar el acceso, gestionar errores y registrar la información necesaria para la trazabilidad.

## Servicios utilizados

La integración actual contempla proveedores y modelos externos para diferentes operaciones de IA.

Entre los servicios utilizados se encuentran componentes relacionados con:

- Stability AI;
- Claude Vision;
- Replicate.

Los modelos concretos pueden variar según la operación y la configuración vigente.

Los nombres de modelos y proveedores deben mantenerse en configuración cuando sea posible, evitando acoplar credenciales o configuraciones sensibles directamente al código.

## Configuración

Las credenciales de proveedores externos deben configurarse mediante variables de entorno o el mecanismo de secretos disponible en el entorno de ejecución.

No se deben almacenar:

- API keys;
- tokens;
- credenciales;
- claves privadas;
- secretos de proveedores

dentro del repositorio.

La documentación debe describir el nombre y finalidad de las variables sin exponer sus valores.

## Flujo de una solicitud

El flujo general de una operación de IA es:

```text
Solicitud del usuario
        ↓
Autenticación
        ↓
Autorización
        ↓
Validación de entrada
        ↓
Validación de límites
        ↓
Preparación de solicitud
        ↓
Proveedor de IA
        ↓
Procesamiento de respuesta
        ↓
Persistencia de metadatos
        ↓
Respuesta al cliente
```

Los pasos exactos dependen del servicio utilizado.

## Validación de entradas

Las entradas utilizadas por los servicios de IA deben validarse antes de ser procesadas.

La validación debe considerar, según la operación:

- tipo de contenido;
- tamaño;
- formato;
- longitud;
- parámetros permitidos;
- referencias existentes;
- identificadores válidos.

Los límites deben impedir que entradas excesivamente grandes produzcan consumo innecesario de recursos o errores del proveedor.

## Prompts

Los prompts deben tratarse como entradas controladas por la aplicación.

Cuando una operación utilice prompts base asociados a un trabajo, estos deben gestionarse mediante la configuración correspondiente.

Los prompts no deben contener secretos ni información sensible innecesaria.

Cuando se almacenen prompts como parte de la trazabilidad, debe evaluarse si su contenido contiene información que requiera protección adicional.

## Procesamiento de imágenes

Las operaciones que trabajen con imágenes deben validar:

- formato;
- tamaño;
- dimensiones;
- origen;
- contenido permitido;
- límites de procesamiento.

El procesamiento debe evitar aceptar archivos que superen los límites establecidos por la aplicación o por el proveedor externo.

Cuando una operación requiera redimensionamiento o transformación de una imagen, esta debe realizarse antes de enviarla al servicio externo cuando corresponda.

## Referencias

El sistema contempla referencias asociadas a trabajos para apoyar determinadas operaciones de IA.

Las referencias pueden incluir información como:

- archivo;
- descriptores;
- peso;
- estado de actividad;
- relación con el trabajo.

La selección de referencias debe respetar el contexto de la operación y las restricciones de acceso correspondientes.

## Persistencia

Las solicitudes de IA se registran en la tabla:

```text
ia_requests
```

La tabla mantiene información relacionada con la ejecución de una solicitud, incluyendo:

- empresa;
- usuario;
- tipo de trabajo;
- prompt;
- hash de imagen de entrada;
- URL del resultado;
- modelo;
- duración;
- estado;
- fecha de creación.

Esta información permite conservar trazabilidad sobre las operaciones realizadas.

## Multi-tenancy

Las operaciones de IA deben respetar el aislamiento por empresa.

Las solicitudes y referencias relacionadas con una empresa no deben quedar disponibles para otra empresa mediante consultas que omitan el contexto de tenant.

El contexto de `empresa_id` debe conservarse durante el flujo correspondiente.

## Autenticación y autorización

Las operaciones de IA deben ejecutarse dentro del modelo de autenticación y autorización de la aplicación.

La existencia de una ruta de IA no implica que cualquier usuario autenticado pueda ejecutar todas las operaciones.

Las autorizaciones deben determinarse según la funcionalidad y el rol correspondiente.

## Errores

Los proveedores externos pueden producir errores por diferentes causas, entre ellas:

- credenciales inválidas;
- límites de uso;
- solicitudes rechazadas;
- contenido inválido;
- indisponibilidad;
- timeout;
- respuestas inesperadas;
- errores internos del proveedor.

El backend debe transformar estos errores en respuestas controladas para el cliente sin exponer información sensible de infraestructura.

## Errores de facturación o cuota

Algunos proveedores pueden rechazar solicitudes cuando la cuenta no dispone de crédito o cuando se alcanza un límite de uso.

Por ejemplo, una respuesta HTTP `402` puede indicar un problema relacionado con pago o crédito del proveedor.

Este escenario debe diferenciarse de:

- una entrada inválida;
- un error interno;
- un timeout;
- una indisponibilidad temporal.

La aplicación debe registrar el error de forma suficiente para diagnosticarlo sin exponer credenciales.

## Timeouts

Las solicitudes externas deben disponer de límites de tiempo adecuados.

Un proveedor que no responda dentro del tiempo esperado no debe bloquear indefinidamente el proceso del backend.

Los timeouts deben producir un resultado controlado y permitir registrar la duración y estado de la operación cuando corresponda.

## Reintentos

Los reintentos deben utilizarse únicamente cuando el tipo de error pueda beneficiarse de ellos.

No se deben repetir automáticamente operaciones cuando:

- la solicitud no es idempotente;
- el proveedor rechazó permanentemente el contenido;
- las credenciales son inválidas;
- se agotó una cuota;
- repetir la operación puede generar costos o efectos duplicados.

Cuando se utilicen reintentos, deben existir límites claros.

## Idempotencia

Las operaciones que puedan generar costos, recursos o efectos externos deben analizarse desde el punto de vista de idempotencia.

Antes de introducir reintentos automáticos se debe determinar si una misma solicitud puede producir más de un resultado o generar cargos adicionales.

Cuando una operación requiera garantías de idempotencia, estas deben implementarse explícitamente y documentarse.

## Trazabilidad

La aplicación debe conservar información suficiente para relacionar una operación de IA con:

- usuario;
- empresa;
- tipo de trabajo;
- modelo;
- resultado;
- duración;
- estado.

La trazabilidad no debe implicar registrar secretos ni información innecesaria.

## Hash de entrada

Cuando una solicitud utilice una imagen de entrada, el sistema puede almacenar un hash para facilitar la identificación de entradas sin necesidad de conservar directamente todo el contenido original como parte del registro de la solicitud.

El hash no debe considerarse una sustitución de los mecanismos de control de acceso.

## Resultados

Los resultados generados por proveedores externos deben procesarse y almacenarse de acuerdo con el flujo de la aplicación.

Las URL de resultados deben tratarse como datos de aplicación y no como credenciales.

Cuando un proveedor utilice URLs temporales, debe considerarse su duración y disponibilidad antes de depender de ellas para procesos posteriores.

## Seguridad

Las integraciones de IA deben considerar:

- protección de credenciales;
- validación de entradas;
- límites de contenido;
- aislamiento multi-tenant;
- autorización;
- control de archivos;
- protección de logs;
- manejo de errores;
- timeouts;
- dependencias externas.

No se debe confiar en que el proveedor externo valide todos los requisitos de seguridad propios de la aplicación.

## Datos personales

Antes de enviar información a un proveedor externo se debe determinar si contiene datos personales o información sensible.

Solo deben enviarse los datos necesarios para la finalidad de la operación.

El uso de proveedores externos debe mantenerse alineado con las consideraciones documentadas en:

`docs/Documentación Legal/compliance.md`

## Disponibilidad de proveedores

Los proveedores externos representan dependencias fuera del control directo de la aplicación.

La aplicación debe contemplar la posibilidad de:

- indisponibilidad;
- latencia elevada;
- cambios de API;
- cambios de modelos;
- límites de uso;
- errores;
- cambios de precios o condiciones.

Una dependencia externa no debe considerarse equivalente a un componente interno del sistema.

## Costos

Las operaciones de IA pueden generar consumo de recursos o costos asociados al proveedor.

Los cambios que incrementen significativamente:

- frecuencia de solicitudes;
- tamaño de imágenes;
- cantidad de referencias;
- resolución;
- número de reintentos;
- modelos utilizados

deben revisarse antes de incorporarse.

## Observabilidad

Las operaciones de IA deben integrarse con los mecanismos generales de observabilidad del sistema.

Cuando sea relevante, deben poder analizarse:

- cantidad de solicitudes;
- estados;
- duración;
- errores;
- timeouts;
- proveedor;
- modelo;
- consumo de recursos.

La información de observabilidad no debe exponer secretos.

## Pruebas

Los servicios de IA deben probarse utilizando mocks o mecanismos equivalentes cuando una prueba no requiera consumir realmente un proveedor externo.

Las pruebas deben contemplar, según corresponda:

- respuesta exitosa;
- entrada inválida;
- error del proveedor;
- timeout;
- respuesta inesperada;
- proveedor sin crédito;
- fallo de procesamiento;
- persistencia de la solicitud;
- aislamiento por empresa.

Las pruebas contra proveedores reales deben utilizarse únicamente cuando sean necesarias y bajo una configuración controlada.

## Cambios de proveedor o modelo

Un cambio de proveedor o modelo debe analizar:

- formato de entrada;
- formato de salida;
- calidad esperada;
- límites;
- latencia;
- costos;
- errores;
- configuración;
- credenciales;
- pruebas;
- impacto sobre los consumidores.

El cambio debe documentarse cuando afecte el comportamiento observable del sistema.

## Gestión de versiones

Los modelos externos pueden cambiar su comportamiento aunque la aplicación no cambie su código.

Cuando la estabilidad del resultado sea importante, se debe identificar el modelo utilizado y registrar su configuración cuando sea posible.

Las actualizaciones de modelos deben validarse antes de incorporarse al entorno de producción.

## CI/CD

Las pruebas relacionadas con IA deben formar parte del pipeline cuando no requieran acceso real a proveedores externos.

Las credenciales reales no deben incluirse en los archivos del repositorio ni en configuraciones de prueba.

Cuando una integración externa requiera credenciales durante una ejecución controlada de CI/CD, estas deben proporcionarse mediante secretos del entorno correspondiente.

## Incidentes

Cuando una integración de IA provoque un incidente, se debe registrar:

- proveedor;
- modelo;
- operación;
- versión desplegada;
- tipo de error;
- duración;
- impacto;
- respuesta aplicada;
- resultado.

Los incidentes relevantes deben utilizarse para mejorar pruebas, observabilidad y documentación.

## Mantenimiento

Este documento debe actualizarse cuando cambien:

- proveedores;
- modelos;
- flujos de IA;
- límites de entrada;
- almacenamiento;
- variables de entorno;
- mecanismos de autenticación;
- pruebas;
- estrategia de observabilidad.

La documentación debe reflejar las integraciones realmente disponibles.

## Documentación relacionada

- `docs/Arquitectura/architecture.md`
- `docs/API/api-contracts.md`
- `docs/Base de Datos/database.md`
- `docs/Base de Datos/Entidades/ia-requests.md`
- `docs/CI-CD/ci-cd.md`
- `docs/Documentación Legal/compliance.md`
- `docs/Observabilidad/observability.md`
- `docs/Solucion de Problemas/troubleshooting.md`
- `docs/Decisiones Técnicas/decisions.md`
