# Modelo de Amenazas

## Propósito

Este documento estructura el análisis de amenazas de la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

El modelo permite identificar activos, límites de confianza, actores, superficies de ataque, amenazas, controles existentes, evidencia requerida y acciones de tratamiento.

El análisis debe actualizarse cuando cambie la arquitectura, se incorpore una integración externa, se modifique la autenticación, se agreguen nuevos módulos o se detecten nuevos riesgos.

## Alcance

El análisis comprende:

- frontend React;
- API Node.js/Express;
- autenticación;
- autorización;
- sesiones;
- aislamiento multi-tenant;
- MySQL;
- Redis;
- cargas de archivos;
- funciones de IA;
- facturación;
- inventario;
- proformas;
- pedidos;
- proveedores externos;
- CI/CD;
- despliegue;
- logging;
- auditoría.

No sustituye una prueba de penetración ni una auditoría especializada.

## Activos

Los principales activos del sistema son:

| Activo | Descripción | Impacto potencial |
|---|---|---|
| Credenciales | Contraseñas y mecanismos de autenticación | Acceso no autorizado |
| Access tokens | Credenciales temporales de acceso | Suplantación de sesión |
| Refresh tokens | Credenciales para renovar sesiones | Persistencia de acceso |
| Sesiones | Estado de autenticación del usuario | Secuestro o abuso de sesión |
| Datos de empresas | Información de cada tenant | Exposición entre empresas |
| Clientes | Información comercial de clientes | Exposición o modificación no autorizada |
| Inventario | Materiales, precios y existencias | Alteración operativa |
| Proformas | Información comercial y cálculos | Manipulación o exposición |
| Pedidos | Información de operaciones | Manipulación o pérdida |
| Facturas | Información comercial y tributaria | Alteración o exposición |
| Datos de IA | Imágenes, prompts y resultados | Exposición o uso indebido |
| Base de datos | Persistencia principal | Pérdida o compromiso integral |
| Redis | Datos temporales y mecanismos de revocación | Fallos de sesión o controles |
| Logs | Información operacional | Exposición de información sensible |
| Auditoría | Evidencia de operaciones | Pérdida de trazabilidad |
| Secretos | Claves de servicios e infraestructura | Compromiso de servicios |
| Código fuente | Lógica de aplicación | Exposición de vulnerabilidades |

## Actores

### Usuario legítimo

Usuario autenticado que utiliza las funcionalidades asignadas a su rol.

Puede actuar como:

- administrador;
- vendedor;
- almacén;
- cliente.

### Usuario no autenticado

Actor que intenta acceder directamente a recursos protegidos.

### Usuario autenticado malicioso

Usuario con credenciales válidas que intenta acceder a recursos fuera de sus permisos o de su empresa.

Este actor es especialmente relevante para el aislamiento multi-tenant.

### Atacante externo

Actor sin acceso legítimo que intenta explotar:

- endpoints;
- autenticación;
- archivos;
- configuraciones;
- dependencias;
- infraestructura.

### Proveedor externo comprometido o defectuoso

Servicio externo que devuelve respuestas incorrectas, incompletas, maliciosas o inesperadas.

Este escenario es relevante para IA y servicios tributarios u otras integraciones.

### Operador o administrador de infraestructura

Actor con acceso operativo al entorno de ejecución.

Debe utilizar controles de privilegio y trazabilidad adecuados.

## Límites de confianza

Los principales límites son:

```text
                 INTERNET
                    |
                    v
              +-----------+
              | Frontend  |
              +-----------+
                    |
              límite HTTP
                    |
                    v
              +-----------+
              | Backend   |
              +-----------+
               /    |    \
              /     |     \
             v      v      v
          MySQL   Redis   Externos
```

Cada frontera implica validación.

El hecho de que una solicitud provenga del frontend no significa que sus datos sean confiables.

Las respuestas de servicios externos tampoco deben considerarse confiables automáticamente.

## Flujo de confianza

Un flujo protegido puede representarse como:

```text
Cliente
  |
  | Solicitud
  v
Autenticación
  |
  v
Autorización
  |
  v
Contexto empresa
  |
  v
Validación
  |
  v
Lógica de negocio
  |
  +------> Base de datos
  |
  +------> Redis
  |
  +------> Servicio externo
```

Cada etapa debe mantener sus propias responsabilidades.

## Metodología

Las amenazas se organizan utilizando categorías equivalentes a:

- suplantación de identidad;
- manipulación;
- repudio;
- divulgación de información;
- denegación de servicio;
- elevación de privilegios.

Estas categorías se utilizan como estructura de análisis y no como evidencia de que una amenaza sea explotable.

## Amenazas de autenticación

### Robo de credenciales

Un atacante obtiene credenciales válidas y las utiliza para acceder al sistema.

Controles:

- hashing de contraseñas;
- expiración de sesiones;
- control de acceso;
- auditoría de autenticación;
- protección contra abuso;
- recuperación de contraseña controlada.

Evidencia requerida:

- pruebas de autenticación;
- pruebas de sesión;
- revisión de configuración.

### Fuerza bruta

Un atacante realiza numerosos intentos de autenticación.

Controles:

- rate limiting;
- límites en endpoints sensibles;
- monitoreo de intentos fallidos.

Evidencia requerida:

- pruebas de límites;
- configuración de rate limiting.

### Robo de refresh token

Un atacante obtiene un refresh token y trata de mantener una sesión.

Controles:

- cookie `httpOnly`;
- expiración;
- revocación;
- blacklist;
- gestión de sesiones.

Evidencia requerida:

- pruebas de logout;
- pruebas de revocación;
- pruebas de expiración.

## Amenazas de autorización

### Escalada vertical

Un usuario intenta ejecutar una operación correspondiente a un rol superior.

Ejemplo:

```text
CLIENTE
   |
   +--> operación administrativa
```

Controles:

- middleware de autorización;
- validación de roles en backend;
- pruebas negativas.

### Escalada horizontal

Un usuario mantiene un rol válido pero intenta acceder a información de otro usuario o empresa.

Ejemplo:

```text
Empresa A
Usuario A
   |
   +--> registro de Empresa B
```

Controles:

- `empresa_id`;
- validación de pertenencia;
- filtros multi-tenant;
- pruebas de acceso cruzado.

Este escenario requiere especial atención porque un identificador válido no garantiza que el recurso pertenezca al usuario autorizado.

## Amenazas multi-tenant

### Manipulación de `empresa_id`

Un cliente modifica el identificador de empresa enviado en una solicitud.

Ejemplo conceptual:

```json
{
  "empresa_id": 2
}
```

cuando el usuario pertenece a la empresa 1.

El backend no debe confiar en el valor enviado por el cliente para determinar el contexto de autorización.

Controles:

- contexto de empresa en backend;
- middleware tenant;
- filtros por empresa;
- validación de pertenencia;
- pruebas de aislamiento.

### Acceso mediante IDOR

Un atacante cambia un identificador secuencial:

```text
/proformas/100
```

por:

```text
/proformas/101
```

para intentar acceder a un recurso de otra empresa.

Controles:

- autorización a nivel de recurso;
- filtro por `empresa_id`;
- pruebas de acceso cruzado.

## Amenazas de entrada

### Inyección SQL

Un atacante introduce contenido SQL en parámetros.

Controles:

- consultas parametrizadas;
- validación;
- ORM o mecanismos equivalentes cuando correspondan;
- pruebas de integración.

### Manipulación de parámetros

Un atacante modifica cantidades, precios, estados o identificadores.

Ejemplos:

```text
cantidad = -100
precio = 0
empresa_id = otra empresa
estado = AUTORIZADA
```

Controles:

- validación;
- reglas de negocio;
- restricciones de base de datos;
- autorización;
- pruebas negativas.

### Log injection

Un atacante introduce contenido diseñado para alterar o dificultar la interpretación de los logs.

Controles:

- sanitización o estructuración de datos;
- logging controlado;
- revisión de entradas.

## Amenazas de sesión

### Replay

Un token válido es reutilizado por un atacante.

Controles:

- expiración;
- revocación;
- blacklist;
- gestión de sesiones;
- HTTPS.

### Uso de sesión revocada

Un token continúa siendo utilizado después de logout o revocación.

Controles:

- blacklist;
- validación de sesión;
- expiración.

Evidencia:

- pruebas específicas de logout;
- pruebas de sesión expirada;
- pruebas de token revocado.

## Amenazas CSRF

Un sitio malicioso intenta inducir al navegador de una víctima a ejecutar una operación autenticada.

Controles:

- token CSRF;
- configuración de cookies;
- validación de solicitudes mutables.

Los endpoints que modifican datos deben revisarse especialmente.

## Amenazas XSS

Un atacante introduce contenido ejecutable en información mostrada por el frontend.

Vectores posibles:

- datos de clientes;
- descripciones;
- observaciones;
- resultados de servicios externos;
- contenido generado dinámicamente.

Controles:

- escaping;
- sanitización cuando sea necesaria;
- evitar HTML dinámico innecesario;
- Content Security Policy;
- validación.

## Amenazas de archivos

### Archivo malicioso

Un atacante intenta subir un archivo que contiene contenido peligroso.

Controles:

- límite de tamaño;
- validación de tipo;
- validación de contenido;
- restricciones de almacenamiento;
- nombres de archivo controlados.

### Archivo excesivamente grande

Un archivo puede utilizar recursos excesivos.

Controles:

- Content-Length;
- límites de multipart;
- límites de memoria;
- timeout;
- validación de dimensiones.

## Amenazas contra IA

### Prompt malicioso

El usuario proporciona instrucciones destinadas a modificar el comportamiento esperado del procesamiento.

Controles:

- validación;
- límites;
- prompts controlados;
- separación entre instrucciones del sistema y entradas del usuario cuando corresponda.

### Exposición de información

Una imagen o prompt puede contener información que no debería enviarse a un proveedor externo.

Controles:

- minimización de datos;
- validación;
- documentación de proveedores;
- revisión de contenido.

### Respuesta externa manipulada

El proveedor externo devuelve contenido inesperado.

Controles:

- validación de respuestas;
- límites;
- manejo de errores;
- no ejecutar directamente contenido externo.

### Agotamiento de recursos

Solicitudes repetidas a funciones de IA pueden generar consumo excesivo.

Controles:

- rate limiting;
- límites de tamaño;
- timeout;
- control de concurrencia;
- seguimiento de duración.

## Amenazas contra facturación

### Manipulación de estado

Un usuario intenta cambiar directamente una factura a un estado que no le corresponde.

Controles:

- máquina de estados;
- autorización;
- validación de transición;
- auditoría.

### Manipulación de numeración

Operaciones concurrentes pueden producir conflictos en secuencias.

Controles:

- restricciones de base de datos;
- transacciones;
- mecanismos de concurrencia;
- pruebas concurrentes.

## Amenazas contra inventario

### Manipulación de stock

Un usuario intenta aumentar o disminuir existencias mediante solicitudes modificadas.

Controles:

- autorización;
- validación;
- reglas de negocio;
- transacciones;
- controles de concurrencia.

### Condiciones de carrera

Dos operaciones modifican simultáneamente el mismo stock.

Controles:

- transacciones;
- operaciones atómicas;
- bloqueos cuando sean necesarios;
- pruebas concurrentes.

## Amenazas contra proformas y pedidos

### Alteración de precios

El cliente modifica el precio enviado desde el frontend.

El backend debe determinar o validar el precio según las reglas de negocio correspondientes.

Controles:

- validación;
- consulta de información persistida;
- autorización;
- pruebas de manipulación.

### Acceso a proformas de otra empresa

Controles:

- `empresa_id`;
- autorización;
- filtros de repositorio;
- pruebas E2E.

## Amenazas contra la base de datos

### Exposición de credenciales

Las credenciales pueden filtrarse mediante:

- repositorio;
- logs;
- variables expuestas;
- archivos de configuración;
- artefactos CI.

Controles:

- variables de entorno;
- secretos del CI;
- `.env` fuera del repositorio;
- revisión de logs.

### Acceso excesivo

Una cuenta de base de datos con privilegios innecesarios aumenta el impacto de una intrusión.

Controles:

- mínimo privilegio;
- cuentas separadas;
- revisión de permisos.

## Amenazas contra Redis

### Acceso no autorizado

Un atacante obtiene acceso a Redis.

Posibles consecuencias:

- manipulación de blacklist;
- lectura de información temporal;
- alteración del comportamiento de sesión;
- consumo de recursos.

Controles:

- red interna;
- autenticación cuando corresponda;
- restricciones de acceso;
- configuración segura.

## Amenazas de disponibilidad

### Saturación de API

Un atacante envía numerosas solicitudes.

Controles:

- rate limiting;
- límites de payload;
- timeout;
- monitoreo;
- control de concurrencia.

### Saturación de IA

Las operaciones de IA pueden ser más costosas que operaciones CRUD convencionales.

Controles:

- rate limiting;
- límites de archivo;
- timeout;
- control de concurrencia;
- monitoreo de duración.

### Agotamiento de memoria

Una entrada excesiva o un proceso defectuoso puede consumir memoria.

Controles:

- límites de payload;
- límites de archivos;
- configuración de procesos;
- monitoreo;
- reinicio controlado cuando corresponda.

## Amenazas contra dependencias

Una dependencia vulnerable puede introducir una vulnerabilidad indirecta.

Controles:

- lockfile;
- `npm ci`;
- análisis de dependencias;
- SonarCloud;
- revisión de actualizaciones.

La presencia de una vulnerabilidad reportada no implica automáticamente que el vector sea explotable en este sistema. Debe verificarse el uso real de la dependencia.

## Amenazas contra CI/CD

### Exposición de secretos

Los secretos pueden aparecer en logs o configuraciones.

Controles:

- secrets del proveedor CI;
- revisión de workflows;
- evitar interpolación innecesaria;
- revisión de artefactos.

### Ejecución de código no confiable

Un pipeline puede ejecutar código proveniente de una rama o pull request.

Controles:

- permisos mínimos;
- revisión de workflows;
- separación de secretos;
- protección de ramas.

## Amenazas de despliegue

### Configuración insegura

Ejemplos:

- CORS demasiado permisivo;
- HTTP sin protección;
- credenciales por defecto;
- endpoints administrativos expuestos;
- secretos incluidos en archivos.

Controles:

- variables por entorno;
- checklist de despliegue;
- revisión de configuración;
- DAST.

## Amenazas de divulgación

La aplicación puede revelar información mediante:

- mensajes de error;
- logs;
- respuestas JSON;
- cabeceras;
- stack traces;
- URLs;
- archivos;
- reportes de CI.

Controles:

- manejo centralizado de errores;
- logging seguro;
- revisión de respuestas;
- DAST.

## Amenazas de repudio

Un usuario podría negar haber realizado una operación.

Controles:

- auditoría;
- usuario asociado;
- fecha y hora;
- empresa;
- acción;
- registro de autenticación;
- información contextual cuando corresponda.

La auditoría debe protegerse contra modificaciones no autorizadas.

## Matriz de amenazas

| ID | Amenaza | Activo | Categoría | Impacto | Controles principales | Estado |
|---|---|---|---|---|---|---|
| TH-01 | Robo de credenciales | Cuentas | Suplantación | Alto | Hashing, sesiones, rate limiting | En verificación |
| TH-02 | Robo de refresh token | Sesiones | Suplantación | Alto | httpOnly, expiración, revocación | En verificación |
| TH-03 | Escalada vertical | Funciones | Elevación | Alto | RBAC, autorización backend | En verificación |
| TH-04 | Acceso cross-tenant | Datos | Elevación | Crítico | `empresa_id`, autorización por recurso | En verificación |
| TH-05 | IDOR | Recursos | Divulgación | Alto | Validación de pertenencia | En verificación |
| TH-06 | SQL Injection | Base de datos | Manipulación | Crítico | Queries parametrizadas | En verificación |
| TH-07 | CSRF | Operaciones mutables | Manipulación | Alto | Token CSRF, cookies | En verificación |
| TH-08 | XSS | Frontend | Manipulación | Alto | Escaping, CSP | En verificación |
| TH-09 | Archivo malicioso | Archivos | Manipulación | Alto | Validación de archivos | En verificación |
| TH-10 | Abuso de IA | Servicio IA | Disponibilidad | Medio/Alto | Rate limiting, límites | En verificación |
| TH-11 | Manipulación de facturas | Facturación | Manipulación | Crítico | Autorización, estados, auditoría | En verificación |
| TH-12 | Manipulación de stock | Inventario | Manipulación | Alto | Reglas, transacciones | En verificación |
| TH-13 | Condición de carrera | Inventario | Manipulación | Alto | Concurrencia, transacciones | Pendiente de verificación |
| TH-14 | Exposición de secretos | Infraestructura | Divulgación | Crítico | Secrets, variables de entorno | En verificación |
| TH-15 | Redis comprometido | Sesiones | Manipulación | Alto | Restricción de red | En verificación |
| TH-16 | Saturación API | API | Disponibilidad | Alto | Rate limiting, límites | En verificación |
| TH-17 | Dependencia vulnerable | Aplicación | Elevación | Variable | Actualizaciones, análisis | En verificación |
| TH-18 | Exposición CI/CD | Pipeline | Divulgación | Alto | Secrets, permisos mínimos | En verificación |
| TH-19 | Configuración insegura | Despliegue | Elevación | Alto | Checklist, DAST | En verificación |
| TH-20 | Divulgación por errores | Información | Divulgación | Medio/Alto | Error handling | En verificación |

## Priorización

La prioridad debe considerar:

```text
Riesgo = Probabilidad × Impacto
```

Sin embargo, la fórmula no debe utilizarse como sustituto de la evaluación técnica.

Un riesgo con impacto crítico puede requerir tratamiento aunque su probabilidad estimada sea baja.

Los riesgos que comprometen aislamiento multi-tenant, autenticación, autorización, secretos o integridad de información deben recibir especial atención.

## Controles preventivos

Los controles preventivos buscan impedir que una amenaza se materialice.

Incluyen:

- autenticación;
- autorización;
- validación;
- aislamiento tenant;
- parametrización SQL;
- CSP;
- CSRF;
- rate limiting;
- restricciones de archivos;
- mínimo privilegio.

## Controles detectivos

Los controles detectivos permiten identificar comportamientos anómalos o incidentes.

Incluyen:

- logs;
- auditoría;
- monitoreo;
- análisis estático;
- DAST;
- revisión de dependencias;
- pruebas automatizadas.

## Controles correctivos

Los controles correctivos buscan limitar el impacto después de un incidente.

Incluyen:

- revocación de sesiones;
- blacklist de tokens;
- rollback;
- restauración de backups;
- corrección de vulnerabilidades;
- invalidación de credenciales;
- recuperación del servicio.

## Evidencia requerida

Cada amenaza relevante debería tener evidencia relacionada con:

- prueba automatizada;
- resultado de análisis;
- configuración;
- revisión de código;
- resultado DAST;
- evidencia de CI/CD;
- prueba manual;
- documentación de incidente.

No debe marcarse una amenaza como mitigada únicamente porque el control esté documentado.

## Proceso de revisión

El modelo debe seguir el flujo:

```text
Cambio arquitectónico
        |
        v
Identificar nuevos activos
        |
        v
Identificar nuevos límites
        |
        v
Identificar amenazas
        |
        v
Revisar controles
        |
        v
Agregar pruebas
        |
        v
Actualizar evidencia
        |
        v
Actualizar este documento
```

## Criterios de aceptación

Una amenaza se considera tratada cuando:

1. se conoce el activo afectado;
2. se conoce el escenario de ataque;
3. existe un control definido;
4. el control está implementado cuando corresponde;
5. existe evidencia de verificación;
6. las pruebas relevantes pasan;
7. la documentación refleja el estado real.

## Relación con deuda técnica

Las amenazas deben relacionarse con la deuda técnica cuando esta pueda afectar la seguridad.

Por ejemplo, la coexistencia de arquitectura legacy puede producir:

- validaciones duplicadas;
- controles inconsistentes;
- middleware duplicado;
- rutas con comportamientos diferentes;
- superficies de ataque innecesarias.

La migración debe realizarse identificando consumidores, trasladando responsabilidades, ejecutando pruebas y eliminando código obsoleto de manera controlada.

## Estado del modelo

Este documento representa el modelo de amenazas de referencia y no constituye una certificación de seguridad.

Los estados deben actualizarse conforme se obtenga evidencia técnica.

Los estados utilizados son:

- `Pendiente`;
- `En verificación`;
- `Verificado`;
- `Mitigado`;
- `No aplica`.

La actualización del estado debe estar respaldada por evidencia cuando se marque una amenaza como verificada o mitigada.
