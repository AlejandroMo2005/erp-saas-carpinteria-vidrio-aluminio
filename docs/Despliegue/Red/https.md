# HTTPS y TLS

## Propósito

Este documento define los criterios para proteger mediante HTTPS y TLS las comunicaciones externas de la plataforma durante su despliegue.

## HTTPS en producción

La plataforma debe utilizar HTTPS para las comunicaciones externas en producción.

El acceso HTTP no debe utilizarse como mecanismo normal de operación en producción.

Cuando exista un punto de entrada HTTP, debe redirigir hacia HTTPS.

## TLS

La configuración de producción debe utilizar versiones de TLS soportadas y seguras.

Las versiones obsoletas de TLS no deben habilitarse.

La selección de protocolos y suites criptográficas debe corresponder al componente responsable de terminar la conexión TLS.

## Certificados

El servidor público debe disponer de un certificado válido para los dominios utilizados.

La gestión debe contemplar:

- Emisión.
- Instalación.
- Renovación.
- Validación.
- Revocación cuando corresponda.
- Supervisión de expiración.

Las claves privadas asociadas a los certificados deben mantenerse protegidas y fuera del repositorio.

## HSTS

La aplicación utiliza HSTS mediante Helmet.

La configuración definitiva debe validarse antes de aplicarse de forma estricta sobre los dominios de producción.

Debe comprobarse que HTTPS funciona correctamente antes de establecer políticas que obliguen al navegador a utilizar exclusivamente conexiones seguras.

## Cookies seguras

El refresh token utiliza una cookie `httpOnly`.

En producción, las cookies relacionadas con autenticación deben configurarse considerando:

- `httpOnly`.
- `secure`.
- `sameSite`.
- Dominio.
- Ruta.
- Tiempo de expiración.

Las cookies sensibles no deben transmitirse mediante conexiones HTTP sin protección.

## CSRF

HTTPS no sustituye la protección CSRF.

El frontend utiliza `withCredentials: true` y envía `X-CSRF-Token` en las solicitudes correspondientes.

La protección CSRF debe mantenerse activa aunque todas las comunicaciones utilicen HTTPS.

## CORS

CORS debe permitir únicamente los orígenes autorizados.

La configuración debe considerar los dominios HTTPS utilizados por frontend y backend.

No debe habilitarse una política abierta cuando existan credenciales involucradas.

## API

Las solicitudes hacia la API deben utilizar HTTPS cuando se realizan desde clientes externos.

El frontend utiliza `VITE_API_URL` para definir la URL de la API cuando se requiere una configuración distinta a `/api`.

Las claves privadas no deben incluirse en esta variable.

## Proxy inverso

La terminación TLS puede realizarse mediante un proxy inverso o componente equivalente de infraestructura.

Este componente puede encargarse de:

- Recibir conexiones HTTPS.
- Gestionar certificados.
- Redirigir HTTP hacia HTTPS.
- Aplicar políticas de transporte.
- Reenviar solicitudes al frontend o backend.
- Ocultar servicios internos.

La implementación concreta depende de la infraestructura de producción.

## Frontend

El frontend debe servirse mediante HTTPS en producción.

Los recursos cargados por la aplicación deben utilizar protocolos compatibles con HTTPS.

Debe evitarse contenido mixto, incluyendo:

- Scripts HTTP.
- Hojas de estilo HTTP.
- APIs HTTP.
- Fuentes HTTP.
- Otros recursos externos no cifrados.

## Backend

El backend puede ejecutarse detrás de un proxy o balanceador.

El puerto interno `5000` no debe exponerse directamente a Internet cuando exista una capa HTTPS delante de la aplicación.

## MySQL

MySQL utiliza el puerto `3306`.

Este puerto debe permanecer restringido a los servicios autorizados.

No debe exponerse directamente a Internet.

Cuando los requisitos de infraestructura lo determinen, la comunicación con MySQL debe utilizar mecanismos de cifrado compatibles.

## Redis

Redis utiliza el puerto `6379`.

Debe permanecer dentro de una red privada y no exponerse directamente a Internet.

La protección debe considerar autenticación cuando corresponda y controles de red que limiten los clientes autorizados.

## Red

La infraestructura debe permitir únicamente las comunicaciones necesarias.

Debe distinguirse entre:

- Tráfico público.
- Frontend.
- Backend.
- MySQL.
- Redis.
- Acceso administrativo.

Los servicios internos deben aceptar conexiones únicamente desde componentes autorizados.

## Redirección HTTP

Cuando la infraestructura publique HTTP, debe redirigir hacia HTTPS.

La redirección debe:

- Mantener el dominio correcto.
- Preservar la ruta.
- Preservar los parámetros necesarios.
- Evitar ciclos de redirección.

## Validación

Después del despliegue debe comprobarse:

- Certificado válido.
- Dominio correcto.
- Cadena de certificados correcta.
- Fecha de expiración.
- Compatibilidad del navegador.
- Ausencia de errores TLS.
- Redirección HTTP hacia HTTPS.
- Disponibilidad de la aplicación.

## Renovación

La renovación de certificados debe realizarse antes de su expiración.

Cuando exista automatización, debe:

1. Renovar el certificado.
2. Instalar la nueva versión.
3. Validar la configuración.
4. Recargar el componente TLS.
5. Verificar HTTPS.
6. Registrar el resultado.

## Monitoreo

La infraestructura debe monitorear:

- Disponibilidad HTTPS.
- Expiración de certificados.
- Errores TLS.
- Errores de conexión.
- Redirecciones.
- Tiempo de respuesta.
- Disponibilidad del dominio.

## CI/CD

El pipeline debe validar la configuración HTTPS cuando exista un entorno disponible para realizar estas comprobaciones.

Las validaciones posteriores al despliegue pueden comprobar:

- Disponibilidad del dominio.
- Respuesta HTTPS.
- Código HTTP esperado.
- Redirección HTTP.
- Certificado.
- Health checks.
- Comunicación con la API.

Las claves TLS no deben estar disponibles para pasos que no las necesiten.

## Desarrollo

El desarrollo puede utilizar HTTP local para frontend y backend.

Esta condición corresponde únicamente al entorno local y no debe trasladarse a producción.

## Testing

El entorno de testing debe reproducir las características relevantes de producción cuando sea necesario validar seguridad de transporte.

Las pruebas pueden comprobar:

- HTTPS.
- Cookies.
- CORS.
- CSRF.
- Redirecciones.
- Cabeceras.
- Comunicación con la API.

Los certificados de testing no deben reutilizarse en producción.

## Staging

Staging debe permitir validar:

- HTTPS.
- Certificados.
- CORS.
- Cookies.
- CSRF.
- Redirecciones.
- Cabeceras.
- Integración frontend-backend.

Los secretos de staging deben mantenerse separados de producción.

## Producción

Antes de exponer producción se debe comprobar:

- Dominio configurado.
- HTTPS disponible.
- Certificado válido.
- Redirección HTTP configurada.
- HSTS validado.
- Cookies seguras.
- CORS restringido.
- CSRF operativo.
- API accesible mediante HTTPS.
- MySQL no expuesto públicamente.
- Redis no expuesto públicamente.

## Respuesta ante incidentes

Ante un compromiso de certificados o claves privadas se debe:

1. Identificar el certificado afectado.
2. Revocar o sustituir las credenciales comprometidas.
3. Emitir nuevos certificados cuando corresponda.
4. Instalar las nuevas credenciales.
5. Validar la configuración TLS.
6. Revisar los logs relacionados.
7. Determinar el alcance del incidente.
8. Documentar las acciones realizadas.

## Estado actual

La aplicación cuenta con HSTS mediante Helmet y mecanismos de seguridad HTTP integrados en el backend.

El entorno local utiliza HTTP durante el desarrollo.

La infraestructura definitiva de producción todavía debe completar:

- Dominio de producción.
- Terminación TLS.
- Certificados.
- Renovación automática.
- Configuración definitiva de HSTS.
- Proxy inverso.
- Reglas de firewall.
- Validaciones HTTPS automatizadas.
- Monitoreo de certificados.

## Criterios de aceptación

La configuración HTTPS debe considerarse preparada cuando:

- El dominio de producción responde mediante HTTPS.
- El certificado es válido.
- Las claves privadas están protegidas.
- HTTP se redirige correctamente.
- HSTS está validado.
- Las cookies sensibles utilizan configuración segura.
- CORS está restringido.
- CSRF continúa activo.
- La API funciona mediante HTTPS.
- No existe contenido mixto.
- MySQL y Redis no están expuestos públicamente.
- Los certificados disponen de un mecanismo de renovación.
- Existen comprobaciones posteriores al despliegue.
- Los errores TLS son monitoreados.
