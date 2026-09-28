# Dominios

## Propósito

Este documento define los criterios para la gestión de dominios utilizados por la plataforma durante su despliegue.

## Estructura de dominios

La arquitectura debe separar los dominios utilizados por cada entorno cuando la infraestructura lo requiera.

Se deben considerar como mínimo:

- Desarrollo.
- Testing.
- Staging.
- Producción.

Cada entorno debe utilizar una configuración independiente para evitar que pruebas o cambios internos afecten directamente al entorno productivo.

## Dominio de producción

El dominio de producción debe apuntar hacia el punto de entrada público de la infraestructura.

La configuración debe permitir:

- Acceso mediante HTTPS.
- Resolución DNS correcta.
- Acceso al frontend.
- Comunicación con la API.
- Aplicación de las políticas de seguridad correspondientes.

El dominio definitivo de producción permanece pendiente de definición.

## DNS

La configuración DNS debe mantener únicamente los registros necesarios.

Los cambios deben realizarse de forma controlada y documentada.

Antes de modificar registros DNS se debe verificar:

- Nombre del registro.
- Tipo.
- Destino.
- TTL.
- Entorno afectado.
- Dependencias existentes.

## Frontend

El dominio destinado al frontend debe dirigir hacia la infraestructura responsable de servir la aplicación React/Vite.

La configuración debe permitir que el navegador cargue correctamente:

- HTML.
- JavaScript.
- CSS.
- Imágenes.
- Fuentes.
- Recursos necesarios de la aplicación.

## Backend

La API debe disponer de un dominio o ruta accesible desde el frontend según la arquitectura seleccionada.

La configuración debe ser compatible con:

- CORS.
- CSRF.
- Cookies.
- HTTPS.
- Autenticación.
- Variables de entorno del frontend.

## CORS y dominios

Los dominios autorizados deben reflejarse en la configuración CORS del backend.

No deben permitirse orígenes arbitrarios cuando la aplicación utiliza credenciales.

Los cambios de dominio deben acompañarse de una revisión de:

- CORS.
- Cookies.
- CSRF.
- HTTPS.
- Configuración del frontend.
- Configuración del backend.

## Cookies y dominio

Las cookies relacionadas con autenticación deben configurarse considerando el dominio correspondiente.

Debe evitarse establecer un alcance de dominio mayor al necesario.

La configuración debe mantener compatibilidad con:

- `httpOnly`.
- `secure`.
- `sameSite`.
- Ruta.
- Expiración.

## HTTPS

Los dominios públicos deben utilizar HTTPS.

La configuración DNS debe permitir que el certificado corresponda correctamente al dominio utilizado.

Después de cualquier cambio de dominio debe verificarse:

- Certificado.
- Redirección HTTP.
- HSTS.
- CORS.
- Cookies.
- Comunicación con la API.

## Subdominios

Cuando la arquitectura requiera separación mediante subdominios, cada uno debe tener una finalidad definida.

Por ejemplo:

- Frontend.
- API.
- Servicios administrativos.

Los subdominios internos no deben exponerse públicamente si no existe una necesidad operativa.

## Entornos

Los dominios de desarrollo y testing deben mantenerse separados de producción.

Staging debe utilizar una configuración independiente que permita validar cambios antes de promoverlos.

Las credenciales y secretos asociados a cada dominio deben mantenerse separados.

## Cambios de dominio

Todo cambio de dominio debe considerar sus efectos sobre:

1. DNS.
2. Certificados.
3. HTTPS.
4. CORS.
5. CSRF.
6. Cookies.
7. Frontend.
8. Backend.
9. Integraciones externas.
10. CI/CD.
11. Monitoreo.

Los cambios deben validarse primero en un entorno controlado cuando sea posible.

## Expiración y renovación

Los dominios deben mantenerse vigentes durante todo el periodo de operación.

Debe existir control sobre:

- Fecha de expiración.
- Renovación.
- Propietario o responsable.
- Proveedor de registro.
- Configuración DNS.

La pérdida de un dominio puede impedir el acceso a la plataforma y afectar servicios relacionados.

## Seguridad de la cuenta del registrador

La cuenta utilizada para administrar el dominio debe protegerse mediante:

- Contraseña robusta.
- Autenticación multifactor cuando esté disponible.
- Acceso restringido.
- Recuperación controlada.
- Revisión periódica de accesos.

Las credenciales del registrador no deben almacenarse en el repositorio.

## Protección DNS

La administración DNS debe limitarse a usuarios autorizados.

Los cambios deben quedar registrados cuando el proveedor utilizado disponga de auditoría.

Debe evitarse modificar registros sin verificar previamente el entorno afectado.

## Integraciones externas

Los dominios pueden ser utilizados por servicios externos que requieran:

- URLs de retorno.
- Orígenes autorizados.
- Webhooks.
- APIs.
- Configuraciones de autenticación.

Los cambios de dominio deben revisar estas integraciones antes de promoverse a producción.

## CI/CD

Los dominios utilizados por CI/CD deben mantenerse separados por entorno.

Los workflows no deben contener credenciales directamente.

Las variables necesarias para desplegar o validar dominios deben gestionarse mediante la configuración segura correspondiente.

## Monitoreo

Debe supervisarse:

- Resolución DNS.
- Disponibilidad del dominio.
- Certificados.
- Expiración.
- Errores HTTP.
- Disponibilidad de la API.
- Disponibilidad del frontend.

Los cambios inesperados de resolución deben investigarse.

## Recuperación

Ante una modificación incorrecta de DNS se debe:

1. Identificar el registro afectado.
2. Confirmar la configuración anterior.
3. Restaurar el registro correcto.
4. Esperar la propagación correspondiente.
5. Validar resolución.
6. Comprobar HTTPS.
7. Comprobar frontend y backend.
8. Registrar el incidente.

## Estado actual

La plataforma todavía no cuenta con un dominio de producción definido dentro de la infraestructura documentada.

La configuración actual se desarrolla principalmente mediante entornos locales y configuración interna de frontend y backend.

La definición del dominio de producción deberá completarse junto con:

- DNS.
- HTTPS.
- Certificados.
- CORS.
- Cookies.
- CI/CD.
- Monitoreo.
- Infraestructura de producción.

## Criterios de aceptación

La configuración de dominios debe considerarse preparada cuando:

- El dominio de producción está definido.
- DNS resuelve correctamente.
- HTTPS funciona.
- El certificado corresponde al dominio.
- Frontend y backend utilizan los dominios establecidos.
- CORS está configurado correctamente.
- Cookies y CSRF funcionan con el dominio seleccionado.
- Los entornos permanecen separados.
- La cuenta del registrador está protegida.
- Existe control de renovación.
- Los cambios DNS pueden recuperarse.
- El dominio está incluido en las verificaciones de despliegue y monitoreo.
