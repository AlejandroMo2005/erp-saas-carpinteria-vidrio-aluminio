# Respuesta ante Incidentes de Seguridad

## 1. Propósito

Este documento establece el proceso para detectar, analizar, contener, erradicar, recuperar y documentar incidentes de seguridad relacionados con la plataforma web empresarial ERP/SaaS para negocios de carpintería de vidrio y aluminio.

El objetivo es proporcionar un procedimiento estructurado para responder ante eventos que puedan comprometer la confidencialidad, integridad o disponibilidad del sistema, sus datos, cuentas de usuario, infraestructura o servicios externos.

---

## 2. Alcance

El procedimiento aplica a:

- Frontend.
- Backend.
- API.
- Base de datos MySQL.
- Redis.
- Autenticación y sesiones.
- Tokens y mecanismos de revocación.
- Multi-tenancy.
- Gestión de archivos.
- Servicios de inteligencia artificial.
- Facturación e integraciones externas.
- Logs y auditoría.
- Dependencias.
- CI/CD.
- Infraestructura de despliegue.
- Secretos y variables de entorno.
- Datos de clientes, usuarios, materiales, proformas, pedidos y facturación.

---

## 3. Principios de respuesta

La respuesta ante incidentes debe seguir estos principios:

1. Contener antes de modificar evidencia innecesariamente.
2. Priorizar la protección de datos y cuentas.
3. Reducir el alcance del incidente.
4. Mantener trazabilidad de las acciones realizadas.
5. Evitar cambios improvisados directamente sobre producción cuando exista una alternativa controlada.
6. Revocar credenciales comprometidas.
7. Verificar el alcance real antes de declarar el incidente resuelto.
8. Documentar las decisiones y evidencias.
9. Restaurar el servicio de forma controlada.
10. Incorporar las lecciones aprendidas al ciclo de calidad y seguridad.

---

## 4. Definición de incidente

Un incidente de seguridad es un evento confirmado o razonablemente sospechado que puede afectar la seguridad del sistema.

Ejemplos:

- Acceso no autorizado.
- Compromiso de una cuenta.
- Exposición de credenciales.
- Acceso entre tenants.
- Manipulación no autorizada de datos.
- SQL Injection.
- XSS con impacto real.
- CSRF con impacto real.
- Robo o reutilización indebida de tokens.
- Exposición de información sensible.
- Modificación no autorizada de facturas.
- Manipulación de inventario.
- Compromiso de un proveedor externo.
- Malware o archivo malicioso.
- Ataques de denegación de servicio.
- Compromiso de infraestructura.
- Exposición accidental de secretos en repositorios o artefactos.

No todo evento anómalo constituye necesariamente un incidente. Debe analizarse su contexto y evidencia.

---

## 5. Eventos de seguridad

Se debe diferenciar entre evento e incidente.

Un evento puede ser:

- Un intento fallido de autenticación.
- Una solicitud rechazada.
- Un error de validación.
- Una alerta de SonarCloud.
- Una vulnerabilidad reportada por una dependencia.
- Una alerta de DAST.
- Un error de proveedor externo.

Un evento se convierte en incidente cuando existe evidencia suficiente de que se produjo, o existe una sospecha razonable de que pudo producirse, una afectación de seguridad que requiere respuesta.

---

## 6. Clasificación

Los incidentes pueden clasificarse de forma inicial según su impacto:

| Nivel | Descripción |
|---|---|
| Crítico | Compromiso significativo de datos, autenticación, aislamiento multi-tenant o infraestructura |
| Alto | Afectación importante de seguridad o disponibilidad |
| Medio | Incidente con alcance limitado o impacto controlable |
| Bajo | Evento de seguridad con impacto reducido |
| Informativo | Evento que requiere registro o seguimiento, pero no constituye un incidente confirmado |

La clasificación inicial puede cambiar conforme avance la investigación.

---

## 7. Ciclo de respuesta

El proceso general es:

```text
Detección
   ↓
Registro
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
   ↓
Lecciones aprendidas
```

Cada etapa debe dejar evidencia suficiente para reconstruir las acciones realizadas.

---

## 8. Detección

Los incidentes pueden detectarse mediante:

- Logs de aplicación.
- Auditoría.
- Alertas de infraestructura.
- Pruebas de seguridad.
- SonarCloud.
- Análisis de dependencias.
- DAST.
- Pruebas automatizadas.
- Reportes de usuarios.
- Reportes de desarrolladores.
- Alertas de proveedores externos.
- Comportamientos anómalos.
- Fallos inesperados de autenticación.
- Accesos no autorizados.

La detección debe generar un registro inicial sin modificar innecesariamente los datos que puedan servir como evidencia.

---

## 9. Registro inicial

El registro inicial debe contener:

- Fecha y hora.
- Persona o mecanismo que detectó el evento.
- Componente afectado.
- Descripción.
- Tipo de incidente.
- Severidad inicial.
- Evidencia disponible.
- Acciones iniciales realizadas.
- Estado.

No deben incluirse secretos, contraseñas, tokens completos ni información sensible innecesaria.

---

## 10. Contención

La contención busca reducir el impacto mientras se investiga la causa.

Dependiendo del incidente, puede incluir:

- Revocar sesiones.
- Revocar tokens.
- Bloquear credenciales comprometidas.
- Deshabilitar temporalmente una cuenta.
- Restringir un endpoint.
- Deshabilitar temporalmente una funcionalidad comprometida.
- Limitar tráfico.
- Aislar un componente.
- Rotar credenciales.
- Suspender temporalmente una integración externa.
- Detener un proceso comprometido.

La contención debe ser proporcional al riesgo y debe evitar destruir evidencia relevante.

---

## 11. Compromiso de cuentas

Cuando exista sospecha de compromiso de una cuenta se debe considerar:

1. Identificar la cuenta afectada.
2. Revisar sesiones activas.
3. Revocar tokens y sesiones cuando corresponda.
4. Forzar cambio de contraseña si existe evidencia de compromiso de credenciales.
5. Revisar actividad reciente.
6. Identificar recursos accedidos.
7. Determinar si existieron cambios no autorizados.
8. Revisar posibles cuentas relacionadas.
9. Registrar las acciones tomadas.

La investigación debe determinar si el compromiso se limitó a una cuenta o si existe evidencia de expansión.

---

## 12. Compromiso de tokens

Ante la exposición o sospecha de compromiso de tokens:

- Identificar el tipo de token.
- Determinar su periodo de validez.
- Revocar el identificador correspondiente cuando sea posible.
- Invalidar sesiones relacionadas.
- Rotar credenciales cuando corresponda.
- Revisar actividad asociada.
- Investigar el origen de la exposición.
- Evitar registrar el token completo en logs o reportes.

La arquitectura utiliza mecanismos de blacklist para tokens y sesiones, por lo que estos mecanismos deben formar parte de la respuesta cuando corresponda.

---

## 13. Compromiso de secretos

Si una clave, contraseña, token o credencial se expone:

```text
Detectar exposición
       ↓
Identificar secreto
       ↓
Revocar
       ↓
Rotar
       ↓
Investigar alcance
       ↓
Eliminar exposición
       ↓
Verificar
```

La eliminación del secreto del archivo actual no elimina necesariamente su exposición histórica. También debe revisarse:

- Historial Git.
- Pull requests.
- Logs.
- Artefactos CI/CD.
- Backups.
- Variables de entorno.
- Sistemas de almacenamiento.
- Capturas o documentación.

---

## 14. Incidentes de multi-tenancy

Un acceso entre empresas constituye un incidente de alta prioridad debido al riesgo de exposición cruzada de información.

La investigación debe determinar:

- Tenant afectado.
- Usuario involucrado.
- Recurso accedido.
- Endpoint utilizado.
- Consulta o repositorio involucrado.
- Datos expuestos.
- Tiempo de exposición.
- Otros tenants potencialmente afectados.
- Existencia de modificaciones.
- Causa raíz.

La respuesta debe incluir una revisión de los controles de aislamiento y pruebas específicas para evitar recurrencia.

---

## 15. Incidentes de base de datos

Ante una sospecha de acceso o modificación no autorizada:

1. Identificar las tablas afectadas.
2. Determinar el intervalo temporal.
3. Revisar logs y auditoría.
4. Identificar operaciones realizadas.
5. Determinar si hubo lectura, modificación o eliminación.
6. Evaluar integridad de los datos.
7. Contener el acceso.
8. Restaurar desde backup únicamente cuando sea necesario y después de evaluar el impacto.
9. Verificar integridad.
10. Documentar el resultado.

No debe restaurarse automáticamente una copia de seguridad sin determinar primero si contiene datos posteriores al incidente que deban conservarse.

---

## 16. Incidentes de Redis

La investigación debe considerar especialmente información relacionada con:

- Sesiones.
- Tokens.
- Blacklist.
- Rate limiting.
- Datos temporales.

Si Redis fuese comprometido, se debe evaluar si existe impacto sobre autenticación, revocación de tokens o disponibilidad.

Cuando corresponda, se deben invalidar sesiones y tokens afectados y revisar la configuración de acceso.

---

## 17. Incidentes relacionados con IA

Los incidentes relacionados con servicios de IA deben analizar:

- Imagen enviada.
- Información enviada al proveedor.
- Prompt.
- Credenciales utilizadas.
- Resultado recibido.
- URL generada.
- Logs.
- Tiempo de exposición.
- Proveedor involucrado.
- Cuotas o límites.
- Posible información sensible.

También debe verificarse si el incidente se originó en el sistema propio o en un proveedor externo.

---

## 18. Incidentes de disponibilidad

Ante una pérdida de disponibilidad se debe determinar si existe:

- Ataque de denegación de servicio.
- Consumo excesivo de recursos.
- Error de aplicación.
- Fallo de base de datos.
- Fallo de Redis.
- Problema de infraestructura.
- Dependencia externa no disponible.
- Configuración incorrecta.

La recuperación debe priorizar la restauración controlada del servicio sin ocultar la causa del incidente.

---

## 19. Investigación

La investigación debe buscar responder:

- ¿Qué ocurrió?
- ¿Cuándo ocurrió?
- ¿Cómo ocurrió?
- ¿Qué componente fue afectado?
- ¿Qué cuentas participaron?
- ¿Qué datos fueron afectados?
- ¿Qué tenants fueron afectados?
- ¿Qué controles fallaron?
- ¿Qué evidencia existe?
- ¿El incidente continúa activo?
- ¿Qué acciones de contención fueron realizadas?
- ¿Cuál fue la causa raíz?

Las conclusiones deben distinguir hechos comprobados de hipótesis pendientes de verificación.

---

## 20. Evidencia

La evidencia puede incluir:

- Logs.
- Registros de auditoría.
- Resultados de pruebas.
- Reportes de SonarCloud.
- Reportes de DAST.
- Historial Git.
- Pull requests.
- Commits.
- Configuración.
- Registros de CI/CD.
- Información de sesiones.
- Eventos de infraestructura.
- Backups.

La evidencia debe conservarse de forma que no sea modificada accidentalmente durante la investigación.

---

## 21. Erradicación

La erradicación busca eliminar la causa del incidente.

Puede incluir:

- Corregir vulnerabilidades.
- Eliminar código malicioso.
- Actualizar dependencias vulnerables.
- Revocar credenciales.
- Rotar secretos.
- Corregir configuraciones.
- Reparar controles de autorización.
- Corregir aislamiento multi-tenant.
- Eliminar archivos maliciosos.
- Deshabilitar integraciones comprometidas.
- Migrar componentes legacy inseguros.

La solución debe corregir la causa y no limitarse a ocultar los síntomas observados.

---

## 22. Recuperación

La recuperación debe realizarse de forma controlada.

Puede incluir:

- Restauración de servicios.
- Restauración de datos.
- Reinicio controlado de componentes.
- Renovación de credenciales.
- Rehabilitación progresiva de funcionalidades.
- Monitoreo posterior.
- Validación funcional.
- Validación de seguridad.

Antes de declarar recuperado el sistema se debe verificar que los controles de seguridad relevantes estén funcionando.

---

## 23. Verificación posterior

Después de la recuperación deben ejecutarse las pruebas correspondientes.

Según el incidente pueden incluir:

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas E2E.
- Pruebas de autorización.
- Pruebas multi-tenant.
- Pruebas de autenticación.
- DAST.
- Análisis estático.
- Análisis de dependencias.
- Pruebas de rendimiento.
- Validación de integridad de datos.

El conjunto de pruebas debe adaptarse al tipo y alcance del incidente.

---

## 24. Comunicación

La comunicación del incidente debe basarse en información verificada.

El registro interno debe distinguir:

- Hechos confirmados.
- Información pendiente de verificar.
- Impacto conocido.
- Impacto potencial.
- Acciones realizadas.
- Próximas acciones.

No se deben divulgar públicamente secretos, credenciales, tokens, vulnerabilidades explotables sin tratamiento adecuado ni información personal innecesaria.

Cuando existan obligaciones legales o contractuales de notificación, deben revisarse antes de emitir comunicaciones externas.

---

## 25. Cierre

Un incidente puede cerrarse cuando:

- La amenaza fue contenida.
- La causa fue identificada o existe una explicación suficiente.
- Las acciones de erradicación fueron aplicadas.
- El sistema fue recuperado.
- Las pruebas posteriores fueron satisfactorias.
- El impacto fue documentado.
- El riesgo residual fue evaluado.
- Las acciones pendientes fueron registradas.
- La evidencia fue conservada.
- Se documentaron las lecciones aprendidas.

El cierre no implica necesariamente que toda la deuda técnica asociada haya sido eliminada.

---

## 26. Lecciones aprendidas

Después de un incidente se debe revisar:

- Causa raíz.
- Control que falló.
- Control que permitió detectar el incidente.
- Tiempo de detección.
- Tiempo de contención.
- Tiempo de recuperación.
- Cobertura de pruebas.
- Calidad de logs.
- Arquitectura.
- Configuración.
- Dependencias.
- CI/CD.
- Documentación.
- Procedimientos operativos.

Las mejoras resultantes deben incorporarse a la planificación técnica.

---

## 27. Relación con deuda técnica

Cuando un incidente revele una deficiencia estructural, debe registrarse como deuda técnica cuando corresponda.

Ejemplos:

- Duplicación de controles de seguridad.
- Arquitectura legacy.
- Ausencia de pruebas.
- Falta de aislamiento a nivel de repositorio.
- Validación distribuida.
- Configuración manual.
- Falta de automatización.
- Dependencias obsoletas.
- Observabilidad insuficiente.

Una corrección que resuelva una causa común puede reducir simultáneamente vulnerabilidades, duplicación y riesgo operativo.

---

## 28. Registro mínimo del incidente

Cada incidente debería mantener como mínimo:

```text
ID
Fecha y hora de detección
Origen de detección
Tipo
Severidad
Componente afectado
Descripción
Impacto
Evidencia
Acciones de contención
Causa raíz
Acciones de erradicación
Acciones de recuperación
Pruebas posteriores
Riesgo residual
Estado
Fecha de cierre
Lecciones aprendidas
Cambios asociados
```

---

## 29. Estado actual

El proyecto cuenta con mecanismos de autenticación, sesiones, revocación de tokens, auditoría, logging, validación, controles HTTP y pruebas automatizadas que forman parte de la base sobre la cual debe construirse la respuesta ante incidentes.

La madurez completa del proceso depende de la integración progresiva de pruebas de seguridad, DAST, análisis de dependencias, observabilidad, recuperación y automatización dentro del ciclo CI/CD.

Los procedimientos descritos deben considerarse un marco operativo que debe verificarse y ajustarse conforme evolucionen la arquitectura y la infraestructura.

---

## 30. Criterios de aceptación

El proceso de respuesta ante incidentes se considera adecuadamente estructurado cuando:

- Existe un procedimiento documentado.
- Los eventos pueden registrarse.
- Los incidentes pueden clasificarse.
- Existe un proceso de contención.
- Existe un procedimiento para revocar sesiones y credenciales.
- Los incidentes multi-tenant reciben tratamiento específico.
- Se conserva evidencia.
- Se documenta la causa raíz.
- Se verifica la recuperación.
- Se ejecutan pruebas posteriores.
- Se documentan riesgos residuales.
- Se registran lecciones aprendidas.
- Las mejoras se incorporan a la deuda técnica y planificación.
- Las obligaciones de comunicación se revisan cuando correspondan.

---

## 31. Mantenimiento

Este documento debe revisarse cuando:

- Se modifique la arquitectura de autenticación.
- Cambie el modelo multi-tenant.
- Se incorporen nuevos servicios externos.
- Se agreguen proveedores de IA.
- Cambie la infraestructura.
- Se incorporen nuevos mecanismos de observabilidad.
- Se modifique el proceso CI/CD.
- Se produzca un incidente relevante.
- Se identifiquen nuevas categorías de amenazas.
- Se modifiquen las obligaciones legales o contractuales aplicables.

La respuesta ante incidentes debe mantenerse como un proceso continuo y verificable durante todo el ciclo de vida de la plataforma.
