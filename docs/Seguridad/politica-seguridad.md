# Política de Seguridad

## 1. Propósito

Esta política establece los principios y controles generales de seguridad aplicables a la plataforma web empresarial ERP/SaaS para negocios de carpintería de vidrio y aluminio.

Su propósito es establecer una referencia común para proteger la información, las cuentas de usuario, los recursos de cada empresa, la infraestructura y los servicios utilizados por la plataforma.

La política complementa los documentos específicos de arquitectura de seguridad, modelo de amenazas, roles y permisos, gestión de secretos, gestión de vulnerabilidades y respuesta ante incidentes.

---

## 2. Alcance

La política aplica a:

- Código fuente.
- Frontend.
- Backend.
- API.
- Base de datos MySQL.
- Redis.
- Autenticación.
- Autorización.
- Sesiones.
- Multi-tenancy.
- Archivos e imágenes.
- Servicios de inteligencia artificial.
- Integraciones externas.
- Facturación.
- Logs y auditoría.
- Dependencias.
- CI/CD.
- Infraestructura.
- Variables de entorno.
- Secretos.
- Entornos de desarrollo, pruebas y producción.
- Personal que participe en el desarrollo, mantenimiento o administración del sistema.

---

## 3. Objetivos de seguridad

Los controles de seguridad deben contribuir a preservar:

### Confidencialidad

Evitar que usuarios, empresas o servicios accedan a información para la que no están autorizados.

### Integridad

Evitar modificaciones, eliminaciones o alteraciones no autorizadas de datos y operaciones empresariales.

### Disponibilidad

Mantener los servicios necesarios para la operación del sistema y disponer de mecanismos de recuperación ante fallos.

### Trazabilidad

Mantener evidencia suficiente de operaciones relevantes para facilitar auditoría, diagnóstico y respuesta ante incidentes.

### Aislamiento

Garantizar que la información perteneciente a una empresa no pueda ser consultada o modificada desde otra empresa.

---

## 4. Principios

La plataforma debe aplicar los siguientes principios:

1. Mínimo privilegio.
2. Defensa en profundidad.
3. Seguridad por diseño.
4. Validación de entradas.
5. Autorización en el servidor.
6. Aislamiento multi-tenant.
7. Protección de secretos.
8. Gestión controlada de sesiones.
9. Trazabilidad de operaciones relevantes.
10. Reducción de superficie de ataque.
11. Dependencias controladas.
12. Verificación automatizada.
13. Recuperación controlada.
14. Mejora continua.

---

## 5. Responsabilidades

Las responsabilidades de seguridad deben distribuirse según las funciones técnicas y operativas.

### Desarrollo

Debe:

- Aplicar los controles de seguridad definidos.
- Validar entradas.
- Respetar los mecanismos de autorización.
- Evitar exponer secretos.
- Crear pruebas de seguridad para cambios relevantes.
- Corregir vulnerabilidades identificadas.

### Revisión técnica

Debe:

- Revisar cambios sensibles.
- Evaluar impactos de seguridad.
- Verificar controles de autenticación y autorización.
- Revisar cambios sobre datos y multi-tenancy.

### Administración

Debe:

- Gestionar credenciales y accesos.
- Mantener configuraciones seguras.
- Controlar entornos.
- Participar en recuperación ante incidentes.

### Usuarios

Deben:

- Proteger sus credenciales.
- No compartir sesiones o contraseñas.
- Reportar accesos o comportamientos sospechosos.
- Utilizar el sistema conforme a los permisos asignados.

---

## 6. Gestión de identidades

Cada usuario debe disponer de una identidad individual.

No se deben compartir cuentas cuando la trazabilidad individual sea necesaria.

Las cuentas deben:

- Tener un identificador único.
- Estar asociadas a una empresa.
- Tener un rol.
- Tener un estado activo o inactivo.
- Estar sujetas a controles de autenticación y autorización.
- Poder ser revocadas cuando corresponda.

---

## 7. Autenticación

La autenticación debe proteger el acceso a los recursos privados de la plataforma.

Los controles deben considerar:

- Contraseñas almacenadas de forma segura.
- Validación de credenciales.
- Gestión de sesiones.
- Expiración.
- Revocación.
- Recuperación de contraseña.
- Protección contra abuso.
- Registro de eventos relevantes.
- Rotación de credenciales cuando corresponda.

Los mecanismos concretos de autenticación se documentan en `docs/Seguridad/security.md`.

---

## 8. Autorización

La autenticación no implica autorización automática para todos los recursos.

Cada operación protegida debe comprobar:

- Identidad.
- Rol.
- Empresa.
- Recurso solicitado.
- Acción solicitada.
- Condiciones adicionales cuando correspondan.

La autorización debe ejecutarse en el backend.

El frontend puede ocultar funcionalidades, pero no constituye un control de seguridad suficiente.

---

## 9. Multi-tenancy

El aislamiento entre empresas constituye un control fundamental de seguridad.

Cada recurso empresarial debe asociarse al tenant correspondiente.

Las consultas y operaciones deben validar el contexto de empresa antes de permitir:

- Lectura.
- Creación.
- Modificación.
- Eliminación.
- Anulación.
- Emisión.
- Consulta de información relacionada.

Los controles de multi-tenancy deben probarse mediante escenarios positivos y negativos.

---

## 10. Gestión de sesiones

Las sesiones deben disponer de mecanismos para:

- Expiración.
- Revocación.
- Logout.
- Control de tokens.
- Identificación de sesiones.
- Invalidación ante compromiso.
- Seguimiento de actividad relevante.

La arquitectura actual utiliza access tokens en memoria del cliente y refresh tokens mediante cookies `httpOnly`, junto con mecanismos de blacklist mediante Redis y persistencia en MySQL.

Estos controles deben mantenerse sujetos a pruebas de regresión y seguridad.

---

## 11. Protección contra CSRF

Las operaciones que modifican información deben protegerse contra solicitudes no autorizadas originadas desde otros sitios.

La protección debe mantenerse alineada con:

- Cookies.
- Tokens CSRF.
- CORS.
- Métodos HTTP.
- Configuración del frontend.
- Configuración del backend.

Cualquier modificación del mecanismo debe acompañarse de pruebas.

---

## 12. Validación de entradas

Toda entrada controlada por el usuario debe considerarse no confiable.

La validación debe aplicarse a:

- Parámetros.
- Query strings.
- Cuerpos de solicitudes.
- Identificadores.
- Cantidades.
- Precios.
- Medidas.
- Archivos.
- Imágenes.
- Datos de clientes.
- Datos de proveedores.
- Información de facturación.
- Prompts de IA.

La validación debe realizarse en el servidor incluso cuando exista validación equivalente en el frontend.

---

## 13. Inyección

La aplicación debe prevenir ataques de inyección mediante:

- Consultas parametrizadas.
- Validación de entradas.
- Escapado cuando corresponda.
- Restricción de comandos.
- Evitar construcción insegura de consultas.
- Pruebas negativas.

Las operaciones sobre MySQL deben utilizar mecanismos seguros de acceso a datos.

---

## 14. Archivos e imágenes

Los archivos enviados por usuarios deben considerarse no confiables.

Se debe controlar, según corresponda:

- Tipo de archivo.
- MIME.
- Tamaño.
- Extensión.
- Contenido.
- Nombre.
- Ubicación de almacenamiento.
- Acceso posterior.
- Procesamiento mediante servicios externos.

Los archivos no deben permitir ejecución arbitraria dentro del servidor.

---

## 15. Servicios de inteligencia artificial

Las integraciones de IA deben cumplir controles de seguridad equivalentes a cualquier servicio externo.

Debe protegerse:

- Credenciales de proveedores.
- Imágenes.
- Prompts.
- Resultados.
- URLs.
- Información empresarial.
- Logs.

Las fallas de proveedores deben gestionarse sin exponer secretos ni información sensible.

---

## 16. Protección de datos empresariales

El sistema debe limitar el acceso a información empresarial según identidad, empresa y permisos.

Los datos relevantes incluyen:

- Clientes.
- Usuarios.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturas.
- Configuración.
- Auditoría.
- Solicitudes de IA.

No debe exponerse información empresarial innecesaria en respuestas de API, logs o mensajes de error.

---

## 17. Base de datos

El acceso a MySQL debe protegerse mediante:

- Credenciales almacenadas fuera del código fuente.
- Consultas seguras.
- Control de acceso.
- Integridad referencial.
- Restricciones.
- Transacciones cuando sean necesarias.
- Backups.
- Revisión de permisos.

Los datos de producción no deben utilizarse indiscriminadamente en entornos de desarrollo o pruebas.

---

## 18. Redis

Redis debe tratarse como un componente de infraestructura protegido.

La configuración debe considerar:

- Control de acceso.
- Protección de red.
- Credenciales cuando correspondan.
- Expiración de datos.
- Información almacenada.
- Recuperación.
- Disponibilidad.

Los datos temporales de Redis no deben reemplazar persistencia necesaria en MySQL.

---

## 19. Secretos

Los secretos no deben almacenarse directamente en:

- Código fuente.
- Repositorios públicos.
- Frontend.
- Logs.
- Documentación.
- Capturas.
- Artefactos de CI/CD.

Las credenciales deben gestionarse mediante variables de entorno o mecanismos apropiados para cada entorno.

El archivo `.env.example` puede documentar nombres de variables, pero no debe contener credenciales reales.

---

## 20. Seguridad del frontend

El frontend debe:

- Evitar almacenar secretos de backend.
- Validar datos antes de enviarlos.
- Gestionar correctamente sesiones.
- Respetar CSRF.
- Evitar renderizado inseguro.
- Manejar errores sin exponer información interna.
- Aplicar controles HTTP configurados por el backend.

Las variables públicas de Vite no deben utilizarse para almacenar secretos.

---

## 21. Seguridad del backend

El backend debe:

- Validar entradas.
- Autenticar solicitudes protegidas.
- Autorizar operaciones.
- Aplicar aislamiento multi-tenant.
- Controlar errores.
- Evitar exposición de información interna.
- Registrar eventos relevantes.
- Proteger recursos.
- Aplicar límites apropiados.
- Mantener dependencias actualizadas.

---

## 22. Cabeceras HTTP

La aplicación debe utilizar cabeceras de seguridad apropiadas para reducir riesgos asociados con:

- Clickjacking.
- XSS.
- MIME sniffing.
- Transporte inseguro.
- Política de contenido.
- Recursos externos.

La configuración actual utiliza Helmet y controles relacionados con CSP, HSTS y Trusted Types. Los valores concretos deben verificarse periódicamente según el entorno de despliegue.

---

## 23. CORS

La política CORS debe restringir los orígenes autorizados.

No se debe utilizar una configuración permisiva en producción sin una justificación técnica.

Los cambios de CORS deben verificarse junto con:

- Cookies.
- Credenciales.
- CSRF.
- API.
- Frontend.

---

## 24. Rate limiting

Las operaciones susceptibles de abuso deben contar con mecanismos de limitación adecuados.

Se debe prestar especial atención a:

- Login.
- Recuperación de contraseña.
- Endpoints costosos.
- IA.
- Subida de archivos.
- Operaciones administrativas.

Los límites deben equilibrar protección y disponibilidad.

---

## 25. Logging

Los logs deben facilitar:

- Diagnóstico.
- Auditoría.
- Investigación.
- Detección de anomalías.

No deben contener:

- Contraseñas.
- Tokens completos.
- Claves API.
- Secretos.
- Información sensible innecesaria.

Los datos controlados por usuarios deben tratarse adecuadamente para evitar inyección en logs.

---

## 26. Auditoría

Las operaciones relevantes deben poder relacionarse con mecanismos de auditoría.

Entre los eventos que pueden requerir trazabilidad se encuentran:

- Login.
- Logout.
- Intentos fallidos.
- Cambios de contraseña.
- Refresh de tokens.
- Eliminaciones.
- Anulaciones.
- Operaciones administrativas.

La auditoría debe permitir investigar eventos sin convertirse en una fuente adicional de exposición de datos.

---

## 27. Dependencias

Las dependencias deben:

- Mantenerse identificadas.
- Revisarse periódicamente.
- Actualizarse cuando corresponda.
- Evaluarse antes de introducir cambios mayores.
- Analizarse ante vulnerabilidades conocidas.

Las actualizaciones deben verificarse mediante pruebas para evitar regresiones.

---

## 28. CI/CD

La seguridad debe formar parte del ciclo de integración y entrega.

El pipeline debe incorporar progresivamente:

- Lint.
- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Análisis de dependencias.
- Análisis estático.
- DAST.
- Generación de evidencia.

Los controles deben impedir o advertir sobre problemas de seguridad según la severidad y las reglas definidas para cada etapa.

---

## 29. Control de cambios

Los cambios sensibles deben revisarse antes de incorporarse a la rama principal.

Se consideran especialmente sensibles:

- Autenticación.
- Autorización.
- Multi-tenancy.
- Sesiones.
- Facturación.
- Persistencia.
- Secretos.
- Infraestructura.
- IA.
- Seguridad HTTP.
- CI/CD.

Los cambios deben acompañarse de pruebas cuando modifiquen controles de seguridad.

---

## 30. Vulnerabilidades

Las vulnerabilidades deben:

1. Registrarse.
2. Validarse.
3. Clasificarse.
4. Priorizarse.
5. Corregirse o mitigarse.
6. Verificarse.
7. Cerrarse con evidencia.

Las vulnerabilidades relacionadas con autenticación, autorización, secretos, multi-tenancy y exposición de datos deben recibir atención prioritaria.

El proceso detallado se encuentra en `docs/Seguridad/gestion-vulnerabilidades.md`.

---

## 31. Incidentes

Los incidentes deben gestionarse mediante un proceso formal de:

```text
Detección
↓
Clasificación
↓
Contención
↓
Investigación
↓
Erradicación
↓
Recuperación
↓
Verificación
↓
Cierre
```

El procedimiento detallado se encuentra en `docs/Seguridad/respuesta-incidentes.md`.

---

## 32. Desarrollo y pruebas

Los entornos de desarrollo y pruebas deben evitar el uso innecesario de información real.

Las pruebas de seguridad deben cubrir como mínimo:

- Autenticación.
- Autorización.
- Multi-tenancy.
- Sesiones.
- CSRF.
- Validación.
- Inyección.
- Archivos.
- API.
- Facturación.
- Inventario.
- IA.

Los resultados de pruebas deben formar parte de la evidencia de calidad cuando corresponda.

---

## 33. Backup y recuperación

La información crítica debe contar con mecanismos de respaldo adecuados.

Los backups deben protegerse contra:

- Acceso no autorizado.
- Modificación.
- Pérdida.
- Exposición de credenciales.
- Uso indebido de datos.

La recuperación debe probarse periódicamente cuando la infraestructura lo permita.

Un backup que nunca ha sido restaurado no constituye por sí mismo evidencia suficiente de capacidad de recuperación.

---

## 34. Terceros

Los servicios externos deben evaluarse considerando:

- Información enviada.
- Credenciales.
- Disponibilidad.
- Dependencia operativa.
- Manejo de errores.
- Seguridad.
- Cambios de API.
- Límites de consumo.

La integración con terceros no debe permitir que un fallo externo comprometa innecesariamente la seguridad del sistema.

---

## 35. Cumplimiento

Los controles de seguridad deben considerar las obligaciones legales y contractuales aplicables al sistema y a los datos tratados.

La documentación de cumplimiento se mantiene separada para evitar duplicar requisitos normativos en esta política.

---

## 36. Gestión de excepciones

Una excepción a un control de seguridad debe documentar:

- Control afectado.
- Motivo.
- Riesgo.
- Impacto.
- Mitigaciones.
- Responsable.
- Fecha de revisión.
- Condición de cierre.

Las excepciones deben ser temporales y revisables.

---

## 37. Evidencia

La aplicación de esta política debe poder verificarse mediante:

- Resultados de CI/CD.
- Pruebas automatizadas.
- Análisis de dependencias.
- SonarCloud.
- DAST.
- Logs.
- Auditoría.
- Revisiones de código.
- Historial Git.
- Reportes de incidentes.
- Registros de vulnerabilidades.

La evidencia debe mantenerse sin incluir secretos.

---

## 38. Estado actual

La plataforma dispone de controles de autenticación, sesiones, revocación de tokens, validación, auditoría, logging, seguridad HTTP, pruebas automatizadas y CI para backend.

El nivel completo de cumplimiento de esta política debe verificarse progresivamente conforme se incorporen integración, E2E, DAST, análisis de dependencias, despliegue reproducible y controles adicionales de CI/CD.

Esta política no debe interpretarse como evidencia de que todos los controles descritos se encuentran completamente automatizados o desplegados en producción.

---

## 39. Criterios de aceptación

La política se considera adecuadamente aplicada cuando:

- Los controles de seguridad están documentados.
- Los responsables conocen los controles aplicables.
- Las vulnerabilidades tienen un proceso de tratamiento.
- Los incidentes tienen un procedimiento de respuesta.
- Los secretos están protegidos.
- La autenticación y autorización son verificadas.
- El aislamiento multi-tenant es probado.
- Los cambios sensibles son revisados.
- Los controles de seguridad forman parte del ciclo de calidad.
- Existe evidencia verificable.
- Las excepciones están documentadas.
- La política se revisa periódicamente.

---

## 40. Mantenimiento

Esta política debe revisarse cuando:

- Cambie la arquitectura.
- Cambie el modelo de autenticación.
- Se incorporen nuevos módulos.
- Se incorporen nuevos proveedores externos.
- Cambie la infraestructura.
- Se produzcan incidentes.
- Se identifiquen nuevas amenazas.
- Cambien los controles de CI/CD.
- Cambien las obligaciones legales aplicables.

La seguridad debe mantenerse como una responsabilidad continua durante todo el ciclo de vida de la plataforma.
