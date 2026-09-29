# Gestión de Secretos

## Propósito

Este documento establece los criterios para identificar, almacenar, utilizar, proteger, rotar y revocar secretos utilizados por la plataforma ERP/SaaS.

Se consideran secretos todos los valores cuya exposición pueda permitir acceso no autorizado a la aplicación, infraestructura, base de datos, Redis, servicios externos o procesos de CI/CD.

## Alcance

La gestión comprende:

- credenciales de base de datos;
- credenciales de Redis;
- claves JWT;
- secretos de sesión;
- tokens;
- claves de proveedores externos;
- credenciales de servicios de IA;
- credenciales de servicios tributarios;
- secretos de CI/CD;
- certificados y claves privadas;
- cualquier otro valor utilizado para autenticación entre componentes.

## Principios

La gestión de secretos debe seguir estos principios:

- no almacenar secretos en el código fuente;
- mínimo privilegio;
- separación por entorno;
- acceso únicamente cuando sea necesario;
- rotación;
- revocación;
- trazabilidad;
- exposición mínima;
- no registrar secretos en logs;
- no incluir secretos en artefactos públicos.

## Clasificación

Los valores sensibles pueden clasificarse como:

| Tipo | Ejemplo conceptual | Protección |
|---|---|---|
| Crítico | Clave de producción | Máxima |
| Alto | Credencial de base de datos | Alta |
| Alto | Clave de proveedor externo | Alta |
| Alto | Secreto de autenticación | Alta |
| Medio | Credencial de servicio interno | Controlada |
| Público | URL pública de API | No es secreto |

Una URL o configuración puede ser sensible o no dependiendo de la información que contenga.

## Variables de entorno

La configuración sensible debe proporcionarse mediante variables de entorno o mecanismos equivalentes.

Ejemplo conceptual:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD

REDIS_HOST
REDIS_PORT
REDIS_PASSWORD

JWT_SECRET
REFRESH_TOKEN_SECRET

AI_PROVIDER_KEY
SRI_API_KEY
```

Los nombres anteriores son ilustrativos. Deben mantenerse alineados con las variables realmente utilizadas por la aplicación.

## `.env.example`

El archivo `.env.example` puede documentar las variables necesarias sin incluir valores reales.

Ejemplo:

```text
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

JWT_SECRET=
```

Los valores reales nunca deben copiarse al archivo versionado.

## Archivos `.env`

Los archivos de entorno locales que contienen secretos deben mantenerse fuera del control de versiones.

Debe verificarse que `.gitignore` excluya los archivos sensibles correspondientes.

No se debe asumir que un archivo es seguro únicamente porque tenga extensión `.env`.

## Código fuente

Los secretos no deben aparecer directamente en:

- JavaScript;
- JSX;
- JSON;
- YAML;
- SQL;
- scripts;
- archivos de configuración;
- documentación;
- pruebas;
- fixtures;
- archivos estáticos.

Ejemplo incorrecto:

```javascript
const apiKey = "valor-real";
```

Ejemplo correcto:

```javascript
const apiKey = process.env.AI_PROVIDER_KEY;
```

La variable utilizada debe existir realmente en el entorno correspondiente.

## Frontend

Las variables utilizadas por Vite que sean expuestas al cliente no deben contener secretos.

Una variable `VITE_*` forma parte del bundle generado y, por tanto, puede ser inspeccionada por el usuario.

No deben exponerse mediante el frontend:

- contraseñas;
- claves privadas;
- secretos JWT;
- claves de proveedores;
- credenciales de base de datos;
- credenciales de Redis.

La información que necesariamente deba ser pública debe tratarse como configuración pública, no como secreto.

## Backend

El backend puede consumir secretos desde variables de entorno o mecanismos equivalentes.

Los secretos deben cargarse únicamente donde sean necesarios.

No es recomendable propagar credenciales por múltiples capas de la aplicación.

Una integración externa debería recibir únicamente la credencial requerida para ese proveedor.

## Base de datos

Las credenciales de MySQL deben mantenerse fuera del código fuente.

La configuración debe permitir separar:

```text
Desarrollo
Pruebas
Producción
```

Cada entorno debe utilizar sus propias credenciales.

Las credenciales de producción no deben utilizarse como valores predeterminados en desarrollo o pruebas.

## Redis

Las credenciales y parámetros sensibles de Redis deben gestionarse mediante configuración del entorno.

El acceso debe restringirse a los componentes que realmente necesiten utilizar Redis.

No deben incluirse credenciales de Redis en:

- frontend;
- documentación pública;
- repositorio;
- logs;
- capturas de pantalla;
- archivos de ejemplo con valores reales.

## Autenticación

Los secretos utilizados para firmar o verificar tokens deben protegerse especialmente.

No deben:

- aparecer en respuestas HTTP;
- registrarse en logs;
- incluirse en el frontend;
- aparecer en mensajes de error;
- almacenarse en archivos públicos.

Si un secreto de autenticación se compromete, debe existir un procedimiento para reemplazarlo.

## Proveedores externos

Cada proveedor externo debe tener una credencial independiente cuando el servicio lo permita.

Esto facilita:

- rotación;
- revocación;
- identificación del origen de una filtración;
- limitación del impacto;
- separación de entornos.

No se debe reutilizar una única credencial para todos los proveedores cuando pueda evitarse.

## IA

Las claves de proveedores de IA deben permanecer exclusivamente en el backend o infraestructura protegida.

El frontend debe comunicarse con el backend y no directamente con el proveedor utilizando una clave privada.

Flujo esperado:

```text
Frontend
   |
   v
Backend
   |
   | clave protegida
   v
Proveedor IA
```

No debe exponerse la clave mediante respuestas del backend.

## Servicios tributarios

Las credenciales asociadas a servicios tributarios o SRI deben gestionarse como secretos.

Deben mantenerse separadas de:

- credenciales de desarrollo;
- credenciales de pruebas;
- credenciales de usuarios;
- configuraciones públicas.

El cambio de credenciales debe documentarse y verificarse.

## CI/CD

Los secretos utilizados durante CI/CD deben almacenarse en el mecanismo seguro proporcionado por la plataforma.

No deben escribirse directamente dentro del workflow.

Ejemplo conceptual:

```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

El valor real no debe aparecer en el archivo YAML.

Los permisos del workflow deben limitarse a lo necesario.

## Pull Requests

Antes de integrar un cambio se debe revisar si contiene:

- claves API;
- passwords;
- tokens;
- certificados privados;
- cadenas de conexión;
- secretos de proveedores;
- archivos `.env`;
- credenciales codificadas.

La revisión debe cubrir también:

- nuevos archivos;
- archivos eliminados;
- cambios en workflows;
- fixtures;
- scripts;
- documentación.

## Historial Git

Eliminar un secreto del archivo actual no significa que haya dejado de estar expuesto.

Si un secreto fue comprometido en un commit, se debe considerar comprometido aunque posteriormente se elimine del código.

El procedimiento debe ser:

```text
Detectar
   |
   v
Revocar
   |
   v
Rotar
   |
   v
Eliminar exposición
   |
   v
Revisar historial
   |
   v
Verificar
```

La limpieza del historial puede requerir procedimientos específicos y no debe sustituir la revocación del secreto.

## Rotación

Los secretos deben rotarse:

- periódicamente cuando la política lo establezca;
- después de una exposición;
- después de una sospecha de compromiso;
- cuando cambie personal con acceso;
- cuando cambie un proveedor;
- cuando se modifique la infraestructura.

La frecuencia exacta debe definirse según el tipo de secreto y el nivel de riesgo.

## Revocación

La revocación debe realizarse cuando un secreto ya no sea confiable.

Ejemplos:

- API key expuesta;
- contraseña filtrada;
- token comprometido;
- credencial de desarrollador reutilizada en producción;
- secreto incluido accidentalmente en Git.

La revocación debe preceder o acompañar la eliminación del secreto expuesto.

## Secretos de desarrollo

Los entornos locales pueden utilizar credenciales específicas para desarrollo.

Estas credenciales deben:

- tener privilegios mínimos;
- utilizar datos de prueba;
- evitar acceso innecesario a producción;
- mantenerse fuera del repositorio;
- poder reemplazarse fácilmente.

## Secretos de pruebas

Las pruebas automatizadas deben utilizar credenciales específicas del entorno de pruebas.

No deben utilizar credenciales reales de producción.

Los datos utilizados durante pruebas deben ser controlados.

## Logs

Los logs no deben contener secretos.

Debe evitarse registrar directamente:

```text
Authorization
Cookie
Password
API-Key
Token
Secret
```

cuando sus valores sean sensibles.

Si una solicitud requiere trazabilidad, debe registrarse información contextual no sensible.

## Manejo de errores

Los mensajes de error no deben devolver valores de configuración sensibles.

Una excepción interna no debe exponer:

- contraseñas;
- claves;
- connection strings;
- variables de entorno;
- tokens;
- rutas privadas con información sensible.

Los detalles técnicos deben permanecer en los mecanismos de observabilidad apropiados y, aun allí, deben filtrarse los secretos.

## Backups

Los backups pueden contener secretos indirectamente si incluyen:

- tablas de configuración;
- archivos de aplicación;
- archivos de entorno;
- bases de datos;
- configuraciones de infraestructura.

Por ello, los respaldos deben protegerse con controles equivalentes a los datos originales.

## Artefactos CI/CD

Los artefactos generados por CI/CD deben revisarse para evitar que contengan:

- `.env`;
- claves;
- logs sensibles;
- dumps de base de datos;
- archivos de configuración de producción.

No debe publicarse un artefacto únicamente porque haya sido generado automáticamente.

## Documentación

La documentación puede describir:

```text
DB_HOST=
DB_PORT=
DB_NAME=
```

pero no debe contener valores reales de producción.

Cuando sea necesario documentar un secreto, debe describirse:

- propósito;
- ubicación;
- responsable;
- mecanismo de rotación;
- entorno;
- procedimiento de revocación.

Nunca debe documentarse el valor real.

## Código de ejemplo

Los ejemplos deben utilizar valores claramente ficticios:

```text
example-api-key
example-password
example-token
```

No deben utilizarse credenciales reales disfrazadas como ejemplos.

## Detección

La revisión de secretos puede apoyarse en:

- revisión manual;
- análisis del repositorio;
- herramientas de secret scanning;
- revisión de commits;
- controles de CI/CD.

Los resultados deben verificarse para distinguir secretos reales de valores de ejemplo.

## Respuesta ante exposición

Cuando se detecte un secreto expuesto:

1. detener su uso;
2. revocar la credencial;
3. generar una nueva;
4. reemplazar la configuración;
5. verificar los servicios dependientes;
6. revisar los logs;
7. revisar el historial cuando corresponda;
8. determinar el alcance;
9. documentar el incidente;
10. agregar controles para evitar recurrencia.

La eliminación del secreto del archivo actual no debe considerarse suficiente.

## Principio de mínimo privilegio

Cada secreto debe proporcionar únicamente los permisos necesarios.

Por ejemplo:

```text
Aplicación
   |
   +--> permiso necesario
   |
   X--> permisos administrativos innecesarios
```

Una credencial comprometida tendrá entonces un impacto limitado al conjunto de permisos asignados.

## Separación por entorno

Los secretos deben diferenciarse como mínimo conceptualmente entre:

```text
Desarrollo
Pruebas
Producción
```

No debe asumirse que una credencial válida en un entorno es apropiada para otro.

## Inventario

Debe mantenerse un inventario de secretos por función, no necesariamente por valor.

| Secreto | Propósito | Entorno | Ubicación | Rotación | Estado |
|---|---|---|---|---|---|
| Credencial DB | Acceso MySQL | Desarrollo | Variables de entorno | Definida por política | Activo |
| Credencial DB | Acceso MySQL | Pruebas | Variables de entorno | Definida por política | Activo |
| Credencial DB | Acceso MySQL | Producción | Gestor de secretos/configuración | Definida por política | Pendiente de verificación |
| Secreto JWT | Autenticación | Backend | Variables de entorno | Según política | Activo |
| Clave IA | Servicio externo | Backend | Variables de entorno | Según proveedor | Activo |
| Credencial SRI | Servicio tributario | Backend | Variables de entorno | Según proveedor | Según entorno |

Esta tabla no debe contener valores reales.

## Checklist

Antes de un release:

- [ ] No existen secretos en el código.
- [ ] No existen secretos en documentación.
- [ ] No existen secretos en archivos públicos.
- [ ] Los `.env` sensibles están excluidos del repositorio.
- [ ] Las variables del frontend no contienen secretos.
- [ ] Los secretos de CI/CD están configurados mediante el mecanismo seguro.
- [ ] Los logs no exponen secretos.
- [ ] Los artefactos no contienen secretos.
- [ ] Las credenciales de producción están separadas.
- [ ] Las credenciales de proveedores externos están verificadas.
- [ ] Los secretos obsoletos fueron revocados.
- [ ] La rotación requerida fue realizada.

## Evidencia

La gestión de secretos puede verificarse mediante:

- revisión de `.gitignore`;
- revisión de workflows;
- secret scanning;
- revisión de variables de entorno;
- revisión de logs;
- revisión de artefactos;
- pruebas de configuración;
- auditoría de proveedores.

Los valores secretos no deben incluirse como evidencia.

## Criterios de aceptación

La gestión de secretos se considera correctamente configurada cuando:

1. los secretos no forman parte del código fuente;
2. cada entorno utiliza su configuración correspondiente;
3. el frontend no expone secretos privados;
4. CI/CD utiliza mecanismos seguros;
5. los logs no muestran credenciales;
6. los artefactos no contienen secretos;
7. existe un mecanismo de rotación;
8. existe un procedimiento de revocación;
9. los accesos utilizan mínimo privilegio;
10. los controles pueden verificarse sin revelar los valores protegidos.

## Mantenimiento

Este documento debe actualizarse cuando:

- se incorpore un nuevo proveedor;
- aparezca una nueva credencial;
- cambie el mecanismo de autenticación;
- cambie la infraestructura;
- se agregue un nuevo entorno;
- ocurra una exposición;
- cambie el proceso CI/CD;
- se adopte un gestor de secretos.

La documentación debe describir cómo gestionar cada secreto, pero nunca almacenar el secreto propiamente dicho.
