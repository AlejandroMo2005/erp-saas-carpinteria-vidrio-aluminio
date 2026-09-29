# Gestión de Vulnerabilidades

## 1. Propósito

Este documento establece el proceso para identificar, evaluar, priorizar, tratar, verificar y dar seguimiento a vulnerabilidades de seguridad en la plataforma web empresarial ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La gestión de vulnerabilidades comprende el código fuente, dependencias, configuración, infraestructura, API, frontend, backend, base de datos, Redis, autenticación, sesiones, integración con servicios externos, procesamiento de imágenes y componentes utilizados durante el ciclo de desarrollo y despliegue.

El objetivo es que las vulnerabilidades sean tratadas como parte del ciclo de calidad y seguridad, evitando que los hallazgos se gestionen de manera aislada o únicamente después de un incidente.

---

## 2. Alcance

El proceso aplica a:

- Código frontend.
- Código backend.
- Dependencias npm.
- API REST.
- Autenticación y autorización.
- Gestión de sesiones y tokens.
- Aislamiento multi-tenant.
- Validación de entradas.
- Base de datos MySQL.
- Redis.
- Procesamiento y almacenamiento de archivos.
- Integraciones con servicios externos.
- Servicios de inteligencia artificial.
- Facturación y procesos relacionados con SRI.
- Configuración de seguridad HTTP.
- CI/CD.
- Contenedores e infraestructura cuando sean incorporados.
- Herramientas de análisis estático.
- Pruebas dinámicas de seguridad.
- Configuraciones de despliegue.
- Secretos y variables de entorno.
- Documentación y artefactos técnicos que puedan contener información sensible.

---

## 3. Principios

La gestión de vulnerabilidades se basa en los siguientes principios:

1. Detectar antes de desplegar.
2. Priorizar según riesgo y contexto.
3. Corregir la causa y no únicamente el síntoma.
4. Verificar que la corrección no introduzca regresiones.
5. Mantener evidencia del hallazgo y de su tratamiento.
6. Evitar divulgar secretos o información sensible en los reportes.
7. Diferenciar vulnerabilidades reales de falsos positivos.
8. Considerar el impacto sobre confidencialidad, integridad y disponibilidad.
9. Incorporar seguridad al ciclo normal de desarrollo.
10. Revisar nuevamente los riesgos después de cambios arquitectónicos importantes.

---

## 4. Fuentes de detección

Las vulnerabilidades pueden identificarse mediante diferentes mecanismos:

| Fuente | Objetivo |
|---|---|
| Revisión de código | Detectar errores de seguridad introducidos directamente en el código |
| ESLint | Detectar patrones de código incorrectos o inseguros configurados en las reglas del proyecto |
| Pruebas unitarias | Verificar comportamiento de componentes y validaciones |
| Pruebas de integración | Detectar problemas entre módulos, API, base de datos y servicios |
| Pruebas E2E | Validar flujos completos desde el punto de vista funcional y de seguridad |
| SonarCloud | Detectar problemas de seguridad, confiabilidad y mantenibilidad |
| Análisis de dependencias | Identificar vulnerabilidades conocidas en paquetes externos |
| DAST | Detectar vulnerabilidades observables desde una aplicación ejecutándose |
| Revisión de configuración | Identificar configuraciones inseguras |
| Auditoría de logs | Detectar comportamientos anómalos o indicios de abuso |
| Revisión manual | Analizar controles que no pueden determinarse únicamente mediante herramientas automáticas |

Las herramientas automáticas constituyen mecanismos de detección y apoyo. La clasificación definitiva debe considerar el contexto técnico de cada hallazgo.

---

## 5. Clasificación

Cada vulnerabilidad debe registrarse con una clasificación que permita establecer su tratamiento.

Como referencia se pueden utilizar los siguientes niveles:

| Nivel | Descripción |
|---|---|
| Crítica | Puede comprometer gravemente el sistema, datos o aislamiento entre empresas |
| Alta | Puede producir un impacto significativo sobre seguridad, datos o disponibilidad |
| Media | Presenta un riesgo relevante, pero requiere determinadas condiciones para producir impacto |
| Baja | Tiene impacto limitado o requiere condiciones poco probables |
| Informativa | Hallazgo técnico que requiere seguimiento, pero no representa por sí mismo una vulnerabilidad explotable |

La severidad reportada por una herramienta no debe considerarse automáticamente equivalente al riesgo real del sistema.

---

## 6. Criterios de priorización

La prioridad debe considerar como mínimo:

- Severidad técnica.
- Explotabilidad.
- Exposición del componente.
- Necesidad de autenticación.
- Necesidad de interacción del usuario.
- Impacto sobre datos.
- Impacto sobre otros tenants.
- Impacto sobre autenticación.
- Impacto sobre autorización.
- Impacto sobre integridad de información.
- Impacto sobre disponibilidad.
- Existencia de mitigaciones.
- Facilidad de reproducción.
- Presencia en producción.
- Dependencia de servicios externos.
- Posibilidad de explotación automatizada.

Las vulnerabilidades relacionadas con aislamiento multi-tenant, autenticación, autorización, exposición de secretos, inyección y acceso no autorizado a datos deben recibir especial atención debido a su posible impacto transversal.

---

## 7. Inventario de vulnerabilidades

Cada hallazgo relevante debe mantener información suficiente para permitir su seguimiento.

El registro debería contener:

- Identificador.
- Fecha de detección.
- Fuente de detección.
- Componente afectado.
- Archivo o módulo afectado cuando corresponda.
- Descripción.
- Severidad.
- Impacto.
- Condiciones de explotación.
- Evidencia.
- Estado.
- Responsable técnico.
- Acción correctiva.
- Pruebas utilizadas para verificar la corrección.
- Fecha de resolución.
- Referencia al commit o pull request cuando corresponda.
- Riesgo residual.
- Observaciones.

No se deben almacenar credenciales, tokens, contraseñas ni otros secretos dentro del registro.

---

## 8. Estados

Los hallazgos pueden utilizar los siguientes estados:

| Estado | Significado |
|---|---|
| Detectada | Vulnerabilidad identificada y pendiente de análisis |
| En análisis | Se está determinando su validez, alcance y severidad |
| Confirmada | Se determinó que el hallazgo es válido |
| En tratamiento | Se está aplicando una corrección o mitigación |
| En verificación | La corrección fue aplicada y requiere comprobación |
| Resuelta | La corrección fue verificada |
| Mitigada | No fue posible eliminar inmediatamente la causa, pero existe un control compensatorio |
| Aceptada | Se decidió mantener temporalmente el riesgo documentando su justificación |
| Falso positivo | El análisis determinó que el hallazgo no representa una vulnerabilidad válida |
| Reabierta | La vulnerabilidad volvió a detectarse después de haber sido marcada como resuelta |

---

## 9. Flujo de tratamiento

El proceso recomendado es:

```text
Detección
   ↓
Registro
   ↓
Validación
   ↓
Clasificación
   ↓
Priorización
   ↓
Análisis de causa
   ↓
Corrección o mitigación
   ↓
Pruebas
   ↓
Reanálisis
   ↓
Cierre
```

Una vulnerabilidad no debería cerrarse únicamente porque se modificó el código. Es necesario verificar que el comportamiento inseguro haya desaparecido y que la corrección no haya introducido una regresión.

---

## 10. Análisis de causa raíz

Cuando una vulnerabilidad sea confirmada, se debe identificar su causa.

Las causas pueden encontrarse en:

- Diseño arquitectónico.
- Implementación.
- Validación insuficiente.
- Falta de autorización.
- Configuración.
- Dependencias.
- Manejo incorrecto de sesiones.
- Gestión de secretos.
- Persistencia de datos.
- Integraciones externas.
- Falta de pruebas.
- Ausencia de controles en CI/CD.
- Arquitectura legacy.
- Duplicación de lógica.

Cuando varios hallazgos tengan una misma causa estructural, deben tratarse como un problema común en lugar de corregirse únicamente de forma individual.

---

## 11. Vulnerabilidades de dependencias

Las dependencias externas deben revisarse periódicamente.

El análisis debe considerar:

- Paquete afectado.
- Versión utilizada.
- Versión corregida disponible.
- Compatibilidad de la actualización.
- Impacto sobre el sistema.
- Cambios incompatibles.
- Riesgo de introducir regresiones.
- Dependencias transitivas.
- Estado de mantenimiento del paquete.

Una actualización de dependencia debe acompañarse de las pruebas correspondientes.

No se recomienda ejecutar actualizaciones destructivas o forzadas de dependencias sin revisar previamente sus efectos sobre el proyecto.

---

## 12. Código fuente

Las vulnerabilidades encontradas en el código deben analizarse considerando el flujo completo.

Entre los aspectos prioritarios se encuentran:

- SQL Injection.
- XSS.
- CSRF.
- Control de acceso.
- Validación de entradas.
- Manipulación de archivos.
- Inyección de comandos.
- Exposición de información.
- Manejo de errores.
- Generación de tokens.
- Generación de valores aleatorios.
- Gestión de sesiones.
- Registro de información sensible.
- Control de recursos.
- Límites de tamaño y frecuencia.
- Validación de datos provenientes de servicios externos.

Una corrección debe realizarse preferentemente en la capa responsable del control para evitar replicar parches en múltiples componentes.

---

## 13. Autenticación y sesiones

Las vulnerabilidades relacionadas con autenticación deben recibir prioridad debido a su capacidad de afectar múltiples módulos.

La revisión debe considerar:

- Credenciales.
- Hash de contraseñas.
- Recuperación de contraseña.
- Access tokens.
- Refresh tokens.
- Identificadores de token.
- Lista de revocación.
- Sesiones persistentes.
- Expiración.
- Rotación.
- Revocación.
- Logout.
- Protección contra reutilización indebida.
- Cookies.
- CSRF.
- Rate limiting.
- Registro de intentos fallidos.

En la arquitectura actual se utiliza almacenamiento del access token en memoria del cliente y refresh token mediante cookie `httpOnly`, además de mecanismos de blacklist con Redis y persistencia en MySQL. Estos controles deben mantenerse sujetos a pruebas de seguridad y regresión.

---

## 14. Multi-tenancy

Las vulnerabilidades que puedan permitir acceso cruzado entre empresas requieren tratamiento prioritario.

La revisión debe comprobar que:

- Cada recurso esté asociado con su empresa correspondiente.
- El contexto `empresa_id` sea obtenido de una fuente confiable.
- Las consultas filtren correctamente por empresa.
- Los endpoints no permitan modificar el tenant mediante parámetros controlables por el cliente.
- Los repositorios respeten el aislamiento.
- Las relaciones entre recursos mantengan coherencia de tenant.
- Las operaciones administrativas estén correctamente autorizadas.
- Las pruebas incluyan escenarios positivos y negativos entre empresas.

Un endpoint funcional no debe considerarse seguro únicamente porque responde correctamente para el tenant autenticado. También debe verificarse que rechace solicitudes dirigidas a recursos pertenecientes a otra empresa.

---

## 15. API

La superficie API debe revisarse considerando:

- Autenticación.
- Autorización.
- Validación de parámetros.
- Validación del cuerpo.
- Validación de query strings.
- Límites de tamaño.
- Límites de frecuencia.
- Métodos HTTP permitidos.
- Códigos de estado.
- Manejo de errores.
- Exposición de información.
- CORS.
- CSRF.
- Cabeceras de seguridad.
- Acceso a recursos de otros tenants.

Los hallazgos deben verificarse mediante pruebas automatizadas cuando sea posible.

---

## 16. Inteligencia artificial

Las integraciones de IA deben considerarse una superficie adicional de seguridad.

La revisión debe contemplar:

- Validación de imágenes.
- Límites de tamaño.
- Tipos MIME.
- Archivos malformados.
- Prompts provenientes del usuario.
- Información sensible enviada a proveedores externos.
- Respuestas de proveedores.
- Timeouts.
- Límites de consumo.
- Errores de proveedores.
- Registro de solicitudes.
- URLs o resultados externos.
- Credenciales de proveedores.
- Disponibilidad del servicio.

La disponibilidad de un proveedor externo no debe asumirse como garantizada. Por ejemplo, un proveedor puede responder con errores relacionados con cuota o disponibilidad, por lo que los flujos dependientes de IA deben contemplar errores controlados.

---

## 17. Base de datos y Redis

La revisión debe incluir:

### MySQL

- Consultas parametrizadas.
- Restricciones.
- Claves foráneas.
- Índices.
- Integridad referencial.
- Control de acceso.
- Credenciales.
- Exposición de datos.
- Transacciones.
- Concurrencia.
- Backups.

### Redis

- Protección de acceso.
- Credenciales cuando correspondan.
- Expiración de claves.
- Datos almacenados.
- Información relacionada con sesiones o tokens.
- Disponibilidad.
- Recuperación.

Los datos temporales almacenados en Redis no deben considerarse sustitutos de la persistencia requerida en MySQL.

---

## 18. Logging y auditoría

Los logs deben facilitar la investigación sin convertirse en una fuente de exposición de información sensible.

No se deben registrar directamente:

- Contraseñas.
- Access tokens.
- Refresh tokens.
- Claves API.
- Secretos.
- Datos sensibles innecesarios.

Los eventos de seguridad relevantes deben poder relacionarse con mecanismos de auditoría cuando corresponda.

La revisión también debe considerar riesgos de log injection y la correcta normalización de valores provenientes del usuario.

---

## 19. Análisis estático

SonarCloud forma parte del proceso de evaluación de calidad y seguridad.

Los hallazgos de SonarCloud deben:

1. Revisarse.
2. Validarse.
3. Agruparse cuando compartan una causa.
4. Priorizarse.
5. Corregirse o justificarse.
6. Verificarse mediante un nuevo análisis.

El inventario actual de SonarCloud constituye una fuente de deuda técnica y no debe interpretarse automáticamente como una lista de vulnerabilidades explotables.

La migración de arquitectura legacy puede eliminar simultáneamente múltiples duplicaciones y hallazgos relacionados.

---

## 20. DAST

Las pruebas dinámicas deben utilizarse sobre una instancia controlada del sistema.

El proceso debe contemplar:

- Autenticación cuando sea necesario.
- Exploración de endpoints.
- Validación de cabeceras.
- Pruebas de entradas.
- Detección de configuraciones inseguras.
- Análisis de respuestas.
- Revisión de cookies.
- Verificación de exposición de información.
- Revisión posterior de falsos positivos.

Los resultados de DAST deben correlacionarse con el código y la configuración antes de realizar cambios.

---

## 21. CI/CD

La gestión de vulnerabilidades debe integrarse progresivamente al pipeline.

Los controles pueden incluir:

```text
Commit
  ↓
Lint
  ↓
Pruebas unitarias
  ↓
Pruebas de integración
  ↓
Análisis de dependencias
  ↓
Análisis estático
  ↓
Pruebas E2E
  ↓
DAST
  ↓
Generación de evidencia
  ↓
Validación para release
```

No todos los controles tienen que ejecutarse necesariamente en cada commit. Algunos pueden ejecutarse en pull requests, ramas principales, releases o ejecuciones programadas.

El pipeline debe evitar publicar artefactos que contengan secretos o información sensible.

---

## 22. Excepciones y aceptación de riesgo

Cuando una vulnerabilidad no pueda corregirse inmediatamente, debe documentarse:

- Motivo.
- Componente afectado.
- Riesgo.
- Impacto.
- Mitigaciones existentes.
- Riesgo residual.
- Responsable.
- Fecha de revisión.
- Condición que permitirá cerrar la excepción.

La aceptación de riesgo debe ser temporal y revisable.

No debe utilizarse como mecanismo para ocultar deuda técnica.

---

## 23. Verificación de correcciones

Una vulnerabilidad debe considerarse resuelta cuando exista evidencia suficiente de que:

- La causa fue corregida.
- La explotación original ya no es posible bajo las condiciones analizadas.
- Las pruebas relacionadas pasan.
- No se introdujo una regresión.
- El análisis automatizado correspondiente ya no reporta el hallazgo o existe una explicación técnica válida.
- La documentación fue actualizada cuando el cambio modifica un control de seguridad.

La evidencia puede incluir:

- Resultado de pruebas.
- Reporte de SonarCloud.
- Reporte de DAST.
- Resultado de análisis de dependencias.
- Pull request.
- Commit.
- Capturas técnicas.
- Logs controlados.
- Resultado de CI/CD.

---

## 24. Gestión de falsos positivos

Un hallazgo puede clasificarse como falso positivo únicamente después de revisar su contexto.

La justificación debe explicar:

- Qué regla generó el hallazgo.
- Qué código fue analizado.
- Por qué la condición no es explotable.
- Qué controles existentes reducen el riesgo.
- Qué evidencia respalda la decisión.

No se debe ignorar un hallazgo únicamente para obtener un pipeline limpio.

---

## 25. Métricas

La gestión puede utilizar métricas como:

- Vulnerabilidades abiertas.
- Vulnerabilidades críticas abiertas.
- Vulnerabilidades altas abiertas.
- Tiempo medio de tratamiento.
- Vulnerabilidades reabiertas.
- Vulnerabilidades por componente.
- Vulnerabilidades por fuente.
- Falsos positivos.
- Riesgos aceptados.
- Vulnerabilidades detectadas después del despliegue.
- Dependencias vulnerables.
- Hallazgos repetidos.
- Porcentaje de hallazgos verificados.

Las métricas deben utilizarse para identificar tendencias y áreas de mejora, no únicamente para producir indicadores de cumplimiento.

---

## 26. Integración con la deuda técnica

Una vulnerabilidad que provenga de una deficiencia arquitectónica debe relacionarse con la deuda técnica correspondiente.

Por ejemplo:

- Arquitectura legacy.
- Duplicación de lógica.
- Falta de separación de responsabilidades.
- Validación distribuida incorrectamente.
- Ausencia de pruebas.
- Dependencias obsoletas.
- Configuración manual.
- Falta de automatización de seguridad.

Cuando una corrección estructural pueda resolver múltiples hallazgos, debe priorizarse el tratamiento de la causa común.

---

## 27. Evidencia mínima

Para cada vulnerabilidad confirmada se recomienda conservar:

```text
Identificador
Componente
Descripción
Severidad
Evidencia
Causa
Tratamiento
Prueba de corrección
Resultado del reanálisis
Commit o cambio asociado
Estado final
Riesgo residual
```

La evidencia debe ser suficiente para reconstruir qué se detectó, qué se modificó y cómo se verificó.

---

## 28. Estado actual

El proyecto cuenta con mecanismos de validación de código, pruebas automatizadas, CI para backend y análisis de calidad mediante SonarCloud.

La revisión de seguridad continúa siendo una actividad progresiva. Los resultados actuales deben considerarse una línea base y no una declaración de ausencia de vulnerabilidades.

La deuda técnica identificada en SonarCloud debe abordarse junto con la migración de arquitectura, pruebas, seguridad, rendimiento y CI/CD para evitar correcciones aisladas que posteriormente vuelvan a aparecer debido a la coexistencia de componentes legacy y actuales.

---

## 29. Criterios de aceptación

La gestión de vulnerabilidades se considera adecuadamente integrada al proyecto cuando:

- Existe un inventario de hallazgos.
- Los hallazgos tienen severidad y estado.
- Existe un proceso definido de tratamiento.
- Las vulnerabilidades críticas y altas reciben seguimiento prioritario.
- Las correcciones son verificadas.
- Las dependencias son revisadas.
- El análisis estático forma parte del proceso de calidad.
- Las pruebas de seguridad se integran progresivamente al CI/CD.
- Los secretos no se exponen en reportes ni artefactos.
- Los riesgos aceptados quedan documentados.
- Los hallazgos relacionados con arquitectura se vinculan con la deuda técnica.
- Existe evidencia suficiente para justificar las correcciones.

---

## 30. Mantenimiento

Este documento debe revisarse cuando:

- Se introduzcan nuevos módulos.
- Cambie el modelo de autenticación.
- Cambie la arquitectura multi-tenant.
- Se incorporen nuevos proveedores externos.
- Se agreguen nuevos servicios de IA.
- Cambie la infraestructura.
- Se incorporen nuevos controles de CI/CD.
- Cambien las herramientas de análisis.
- Se produzcan incidentes de seguridad.
- Se detecten vulnerabilidades que revelen nuevos riesgos sistémicos.

La gestión de vulnerabilidades debe mantenerse como un proceso continuo del ciclo de vida del sistema.
