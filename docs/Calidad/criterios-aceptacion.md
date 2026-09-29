# Criterios de Aceptación

## 1. Propósito

Este documento establece los criterios utilizados para determinar si una funcionalidad o flujo de la plataforma ERP/SaaS puede considerarse aceptado.

Los criterios relacionan comportamiento funcional, calidad, seguridad, persistencia, pruebas y evidencia.

---

## 2. Alcance

Los criterios aplican a:

- Frontend.
- Backend.
- API.
- Base de datos.
- Redis.
- Autenticación.
- Autorización.
- Multi-tenancy.
- Clientes.
- Materiales.
- Inventario.
- Proformas.
- Pedidos.
- Facturación.
- Proveedores.
- IA.
- Seguridad.
- Rendimiento.
- CI/CD.

---

## 3. Principio general

Una funcionalidad no debe considerarse aceptada únicamente porque su interfaz funcione.

La aceptación debe considerar:

```text
Requisito
   ↓
Implementación
   ↓
Validación
   ↓
Persistencia
   ↓
Seguridad
   ↓
Pruebas
   ↓
Evidencia
```

---

## 4. Criterios funcionales

Una funcionalidad debe:

- Cumplir el comportamiento esperado.
- Validar entradas.
- Procesar reglas de negocio.
- Mostrar resultados correctos.
- Manejar errores.
- Mantener estados coherentes.
- Persistir información cuando corresponda.
- Respetar las relaciones entre entidades.

---

## 5. Criterios de interfaz

El frontend debe:

- Mostrar los elementos requeridos.
- Permitir completar el flujo.
- Indicar estados de carga.
- Mostrar errores controlados.
- Evitar acciones ambiguas.
- Mantener navegación coherente.
- Respetar permisos de interfaz.

La ocultación de una opción en frontend no sustituye la autorización backend.

---

## 6. Criterios de API

Cada endpoint debe:

- Utilizar el método HTTP correspondiente.
- Validar la entrada.
- Aplicar autenticación cuando corresponda.
- Aplicar autorización.
- Respetar el tenant.
- Devolver códigos HTTP coherentes.
- Mantener un contrato estable.
- Evitar exponer información interna.

---

## 7. Criterios de autenticación

Los flujos de autenticación deben comprobar:

- Credenciales válidas.
- Credenciales inválidas.
- Usuario inactivo.
- Sesión.
- Token.
- Expiración.
- Revocación.
- Logout.
- Refresh cuando corresponda.

Una funcionalidad protegida no debe ser aceptada si puede ejecutarse sin la autenticación requerida.

---

## 8. Criterios de autorización

Debe verificarse:

- Rol.
- Empresa.
- Recurso.
- Acción.

Debe comprobarse tanto el acceso permitido como el acceso rechazado.

Un caso positivo por sí solo no demuestra que la autorización sea correcta.

---

## 9. Criterios multi-tenant

Una funcionalidad que utilice datos empresariales debe garantizar:

```text
Empresa A
  ↓
Usuario A
  ↓
Datos A
```

y rechazar:

```text
Usuario A
  ↓
Datos B
```

Debe probarse lectura y, cuando corresponda:

- Creación.
- Modificación.
- Eliminación.
- Búsqueda.
- Relaciones.

---

## 10. Criterios de validación

Los datos de entrada deben validarse en backend.

Deben contemplarse:

- Campos obligatorios.
- Tipos.
- Longitudes.
- Rangos.
- Enumeraciones.
- Identificadores.
- Cantidades.
- Precios.
- Medidas.
- Fechas.
- Archivos.

Los datos inválidos deben producir un resultado controlado.

---

## 11. Criterios de persistencia

Cuando una operación implique almacenamiento, debe verificarse:

- Registro creado o modificado.
- Relaciones.
- Claves foráneas.
- Restricciones.
- Valores calculados.
- Estado.
- Tenant.

Debe evitarse aceptar una operación únicamente porque la interfaz mostró un mensaje de éxito.

---

## 12. Criterios de integridad

Una funcionalidad debe mantener:

- Integridad referencial.
- Restricciones de unicidad.
- Restricciones de dominio.
- Relaciones correctas.
- Estados válidos.

Las operaciones parciales deben revertirse cuando las reglas transaccionales lo requieran.

---

## 13. Criterios de transacción

Las operaciones críticas que modifiquen múltiples registros deben evaluarse mediante:

```text
Inicio
  ↓
Operaciones
  ↓
Validación
  ↓
Commit
```

Ante un error:

```text
Error
  ↓
Rollback
  ↓
Estado consistente
```

---

## 14. Criterios de inventario

Una funcionalidad relacionada con inventario debe comprobar:

- Material correcto.
- Empresa correcta.
- Cantidad válida.
- Stock válido.
- Precio cuando corresponda.
- Estado.
- Persistencia.
- Concurrencia cuando sea relevante.

No debe aceptarse una operación que produzca stock inconsistente.

---

## 15. Criterios de proformas

Una proforma debe comprobar:

- Cliente.
- Empresa.
- Usuario.
- Trabajo.
- Material.
- Medidas.
- Cantidad.
- Precio.
- Subtotal.
- Total.
- Persistencia.

Los cálculos deben coincidir con las reglas de negocio definidas.

---

## 16. Criterios de pedidos

Un pedido debe mantener correctamente sus relaciones con:

- Empresa.
- Usuario.
- Proforma cuando corresponda.
- Detalles.
- Materiales.

Debe verificarse:

- Estado.
- Total.
- Cantidades.
- Persistencia.

---

## 17. Criterios de facturación

Una funcionalidad de facturación debe comprobar:

- Empresa.
- Usuario.
- Detalles.
- Cantidades.
- Precios.
- Descuentos.
- IVA.
- Totales.
- Estado.
- Secuencia.
- Integridad.

Las operaciones sensibles deben contar con autorización y trazabilidad.

---

## 18. Criterios de sesión

Las operaciones autenticadas deben mantener correctamente el contexto de sesión.

Debe verificarse:

- Credencial válida.
- Token válido.
- Sesión existente.
- Token revocado.
- Expiración.
- Logout.

El sistema no debe mantener acceso después de una revocación que corresponda.

---

## 19. Criterios de seguridad

La funcionalidad debe evaluarse frente a:

- SQL Injection.
- XSS.
- CSRF.
- Acceso no autorizado.
- Escalada de privilegios.
- Acceso cruzado entre empresas.
- Exposición de secretos.
- Log Injection.
- Abuso de recursos.

Los riesgos relevantes deben ser corregidos, mitigados o registrados como deuda técnica justificada.

---

## 20. Criterios de errores

Los errores deben:

- Ser controlados.
- Utilizar códigos HTTP adecuados.
- Mostrar información útil al usuario.
- Evitar detalles internos innecesarios.
- Ser registrables cuando corresponda.
- No exponer secretos.

Un error esperado no debe provocar una caída completa del flujo.

---

## 21. Criterios de frontend

Debe comprobarse:

- Renderizado.
- Navegación.
- Formularios.
- Estados de carga.
- Estados vacíos.
- Errores.
- Accesibilidad básica.
- Integración con API.

La funcionalidad debe comportarse correctamente con respuestas exitosas y fallidas.

---

## 22. Criterios de backend

Debe comprobarse:

- Ruta.
- Middleware.
- Validación.
- Servicio.
- Repositorio.
- Persistencia.
- Manejo de errores.
- Autorización.
- Multi-tenancy.

La implementación no debe depender exclusivamente del comportamiento del frontend.

---

## 23. Criterios de pruebas unitarias

Las reglas de negocio críticas deben contar con pruebas unitarias cuando sean apropiadas.

Las pruebas deben verificar:

- Casos válidos.
- Casos inválidos.
- Límites.
- Errores.
- Reglas de cálculo.
- Transformaciones.

---

## 24. Criterios de integración

Las funcionalidades que dependan de múltiples componentes deben contar con pruebas de integración apropiadas.

Deben verificarse las interacciones entre:

- API.
- Servicios.
- Repositorios.
- MySQL.
- Redis.
- Servicios externos.

---

## 25. Criterios E2E

Los flujos críticos deben contar con pruebas E2E cuando corresponda.

El flujo debe demostrar:

```text
Interacción del usuario
        ↓
Frontend
        ↓
API
        ↓
Persistencia
        ↓
Resultado
```

No todas las funciones internas requieren una prueba E2E independiente.

---

## 26. Criterios de rendimiento

La aceptación debe considerar rendimiento cuando la funcionalidad pueda afectar significativamente:

- Latencia.
- CPU.
- Memoria.
- Base de datos.
- Redis.
- Transferencia.
- Concurrencia.

Los umbrales deben basarse en mediciones y requisitos reales.

No deben inventarse objetivos de rendimiento sin evidencia.

---

## 27. Criterios de concurrencia

Las operaciones susceptibles a ejecución simultánea deben evaluarse cuando exista riesgo de:

- Duplicación.
- Pérdida de actualización.
- Stock incorrecto.
- Secuencias duplicadas.
- Estados inconsistentes.

La aceptación debe considerar simultáneamente rendimiento e integridad.

---

## 28. Criterios para IA

Las funcionalidades de IA deben comprobar:

- Entrada.
- Validación.
- Archivo.
- Prompt.
- Proveedor.
- Respuesta.
- Timeout.
- Error.
- Cuota.
- Persistencia de solicitud.

Los errores de proveedores externos deben manejarse sin comprometer la estabilidad del sistema.

---

## 29. Criterios de dependencias externas

Cuando una funcionalidad dependa de un tercero, deben contemplarse:

- Disponibilidad.
- Timeout.
- Error HTTP.
- Autenticación.
- Cuota.
- Respuesta inválida.
- Recuperación.

No debe considerarse aceptada una integración únicamente porque funcione bajo condiciones ideales.

---

## 30. Criterios de documentación

Una funcionalidad relevante debe actualizar la documentación correspondiente.

Puede requerir cambios en:

- API.
- Arquitectura.
- Base de datos.
- Seguridad.
- Pruebas.
- Flujos.
- Decisiones técnicas.
- Troubleshooting.

La documentación no debe afirmar comportamientos que no estén respaldados por la implementación.

---

## 31. Criterios de CI/CD

Los cambios deben pasar por las verificaciones definidas para el proyecto.

Actualmente se consideran:

- Instalación reproducible.
- ESLint.
- Pruebas.
- Cobertura.
- Artefactos.

Las verificaciones adicionales deben incorporarse conforme exista infraestructura reproducible para ellas.

---

## 32. Criterios de calidad de código

El código debe:

- Respetar las reglas de lint.
- Evitar errores conocidos.
- Mantener responsabilidades claras.
- Evitar duplicación innecesaria.
- Mantener pruebas relevantes.
- Evitar introducir arquitectura legacy adicional.

Los hallazgos de calidad deben evaluarse según su impacto real.

---

## 33. Criterios de arquitectura

Una funcionalidad nueva debe integrarse en la arquitectura vigente.

Debe evitarse:

- Crear nuevos módulos legacy.
- Duplicar controladores.
- Duplicar servicios.
- Duplicar repositorios.
- Duplicar validadores.
- Crear rutas paralelas sin justificación.

Las excepciones deben documentarse.

---

## 34. Criterios de seguridad documental

Los controles de seguridad relevantes deben poder relacionarse con:

- Requisito.
- Implementación.
- Prueba.
- Evidencia.

La existencia de un documento de seguridad no debe interpretarse como evidencia de que el control ya está implementado.

---

## 35. Criterios de regresión

Después de cambios relevantes deben ejecutarse las pruebas afectadas.

El conjunto puede incluir:

- Unitarias.
- Integración.
- E2E.
- Seguridad.
- Rendimiento.

La selección debe depender del impacto del cambio.

---

## 36. Criterios de aceptación de cambios

Un cambio puede considerarse aceptable cuando:

- Cumple el requisito.
- No introduce una regresión conocida.
- Tiene pruebas apropiadas.
- Respeta seguridad.
- Respeta multi-tenancy.
- Mantiene integridad de datos.
- La documentación relevante está actualizada.
- La evidencia está disponible.

---

## 37. Criterios para deuda técnica

Si una condición no puede corregirse inmediatamente, debe:

- Identificarse.
- Documentarse.
- Evaluarse.
- Asignarse una prioridad.
- Definirse un tratamiento.
- Registrar el impacto.

No debe ocultarse una deficiencia simplemente marcando la funcionalidad como aceptada.

---

## 38. Evidencia requerida

Dependiendo del cambio, la evidencia puede incluir:

- Resultado de pruebas.
- Cobertura.
- Reportes de CI.
- Capturas.
- Reportes E2E.
- Logs.
- Resultados de Lighthouse.
- Análisis estático.
- Pruebas de integración.
- Mediciones de rendimiento.

La evidencia debe corresponder al criterio que pretende demostrar.

---

## 39. Estado de aceptación

Los criterios pueden clasificarse como:

| Estado | Significado |
|---|---|
| Cumplido | Existe implementación y evidencia suficiente |
| En verificación | Existe implementación, pero falta completar evidencia |
| Pendiente | El requisito aún no ha sido verificado |
| No conforme | El resultado no cumple el criterio |
| Exento | Se justificó que el criterio no aplica |

No debe utilizarse `Cumplido` únicamente porque exista código relacionado.

---

## 40. Criterios para liberación

Antes de una liberación deben verificarse como mínimo:

- Funcionalidad crítica.
- Autenticación.
- Autorización.
- Multi-tenancy.
- Persistencia.
- Pruebas.
- Seguridad.
- Errores conocidos.
- CI.
- Documentación relevante.

Los criterios específicos de cada release deben quedar registrados en la evidencia correspondiente.

---

## 41. Criterios de rechazo

Una funcionalidad debe permanecer sin aceptar cuando exista alguno de los siguientes problemas críticos:

- Acceso no autorizado.
- Fuga entre empresas.
- Corrupción de datos.
- Pérdida de información.
- Operación crítica sin validación.
- Error que impida completar el flujo.
- Credenciales expuestas.
- Regresión funcional crítica.
- Fallo de integridad.

Los problemas no críticos deben evaluarse según impacto y riesgo.

---

## 42. Estado actual

El proyecto dispone de pruebas unitarias backend y frontend, CI, estrategia de integración, estrategia E2E y estrategia de rendimiento documentadas.

La aceptación final de cada funcionalidad debe determinarse mediante la evidencia disponible y no únicamente mediante la existencia de documentación.

La cobertura de integración, E2E, rendimiento y seguridad continúa ampliándose conforme se dispone de infraestructura y ejecuciones reproducibles.

---

## 43. Criterios de aceptación del proyecto

La plataforma debe poder demostrar, mediante evidencia:

- Cumplimiento funcional.
- Integridad de datos.
- Aislamiento multi-tenant.
- Autenticación.
- Autorización.
- Seguridad.
- Pruebas automatizadas.
- Integración.
- Flujos E2E.
- Rendimiento medido.
- CI/CD.
- Trazabilidad.
- Gestión de deuda técnica.

La aceptación global debe construirse a partir de la evidencia de cada componente y flujo crítico.

---

## 44. Mantenimiento

Este documento debe actualizarse cuando:

- Se agreguen requisitos.
- Se modifiquen reglas de negocio.
- Se agreguen módulos.
- Cambien los criterios de seguridad.
- Cambie la arquitectura.
- Se incorporen nuevas pruebas.
- Se modifique CI/CD.
- Se establezcan nuevas métricas.
- Se detecten nuevas categorías de riesgo.

Cada cambio significativo debe determinar si requiere nuevos criterios de aceptación o modificaciones de los existentes.
