# Evidencia Técnica

## 1. Propósito

Este documento establece la estructura para recopilar, organizar y conservar evidencia técnica del proyecto ERP/SaaS.

La evidencia debe permitir demostrar de forma trazable el estado real de:

- Funcionalidades.
- Pruebas.
- Calidad.
- Seguridad.
- Rendimiento.
- Integración.
- Arquitectura.
- Base de datos.
- CI/CD.
- Documentación.
- Gestión de deuda técnica.

La evidencia debe representar resultados verificables y no sustituir los resultados reales de las herramientas.

---

## 2. Principio de evidencia

Toda afirmación técnica relevante debe poder relacionarse con una fuente verificable.

El flujo recomendado es:

```text
Requisito
   |
   v
Implementación
   |
   v
Prueba / análisis
   |
   v
Resultado
   |
   v
Evidencia
   |
   v
Trazabilidad
```

No debe registrarse como resultado exitoso aquello que no haya sido ejecutado o verificado.

---

## 3. Tipos de evidencia

La evidencia puede clasificarse en:

| Tipo | Ejemplo |
|---|---|
| Código | Commit, archivo, módulo |
| Prueba | Resultado de Vitest |
| Integración | Ejecución contra servicios reales |
| E2E | Playwright |
| Seguridad | ESLint, SonarCloud, ZAP |
| Rendimiento | Lighthouse, carga, latencia |
| CI/CD | Ejecución de workflow |
| Base de datos | Esquema, migración, restauración |
| Arquitectura | Diagramas, decisiones |
| Operación | Logs, recuperación, configuración |
| Documentación | Documento técnico aprobado |

---

## 4. Evidencia de código

Los cambios relevantes deben poder relacionarse con:

- Archivo.
- Módulo.
- Commit.
- Rama.
- Pull request cuando exista.
- Fecha.
- Motivo del cambio.

El commit debe describir el cambio de forma suficientemente precisa para facilitar su posterior rastreo.

---

## 5. Evidencia de pruebas unitarias

Las pruebas unitarias deben registrar, cuando corresponda:

- Comando ejecutado.
- Fecha.
- Archivos de prueba.
- Cantidad de pruebas.
- Pruebas aprobadas.
- Pruebas fallidas.
- Duración.
- Cobertura.

La cobertura debe interpretarse como una métrica complementaria y no como prueba suficiente de calidad funcional.

---

## 6. Estado conocido de pruebas backend

Como referencia de la línea de trabajo actual, el backend ha alcanzado:

```text
77 archivos de prueba
1734 pruebas
1734 aprobadas
```

La cobertura registrada en la ejecución correspondiente fue aproximadamente:

```text
Statements: 94.54%
Branches:   95.46%
Functions:  95.67%
Lines:      93.92%
```

Estos valores corresponden a una ejecución concreta y deben actualizarse cuando se realicen nuevas ejecuciones.

---

## 7. Estado conocido de pruebas frontend

La ejecución registrada del frontend alcanzó:

```text
50 archivos de prueba
539 pruebas
539 aprobadas
```

La cobertura global registrada fue:

```text
Statements: 27.32%
Branches:   85.63%
Functions:  59.74%
Lines:      27.32%
```

La cobertura global baja no debe interpretarse de manera aislada.

Debe analizarse junto con:

- Distribución de pruebas.
- Componentes críticos.
- Flujos de negocio.
- Pruebas de integración.
- Pruebas E2E.
- Riesgo funcional.

---

## 8. Evidencia de lint

El backend debe conservar evidencia de una ejecución limpia de ESLint cuando corresponda.

El frontend alcanzó una ejecución con:

```text
0 errores
12 advertencias
```

Las advertencias registradas estuvieron principalmente relacionadas con reglas de React Refresh.

Estos resultados corresponden a una ejecución concreta y deben actualizarse si cambia el código o la configuración de lint.

---

## 9. Evidencia de integración

Las pruebas de integración deben demostrar la interacción entre componentes reales o representativos.

Deben considerarse:

- Frontend.
- API.
- Servicios.
- Repositorios.
- MySQL.
- Redis.
- Servicios externos.

La evidencia debe identificar si los servicios dependientes estaban realmente disponibles durante la ejecución.

---

## 10. Evidencia E2E

Las pruebas E2E deben conservar evidencia suficiente para reproducir o investigar el resultado.

Puede incluir:

- Resultado de Playwright.
- HTML report.
- JSON.
- JUnit.
- Capturas.
- Trace.
- Video cuando corresponda.
- Logs.

Una prueba E2E no debe marcarse como validada si no fue ejecutada.

---

## 11. Evidencia de autenticación

Los flujos de autenticación deben comprobarse mediante pruebas que cubran, según corresponda:

- Login exitoso.
- Credenciales inválidas.
- Sesión expirada.
- Refresh.
- Logout.
- Revocación.
- Recuperación de contraseña.
- Cambio de contraseña.

La evidencia debe distinguir entre comportamiento implementado y comportamiento pendiente de verificar.

---

## 12. Evidencia de autorización

La evidencia de autorización debe demostrar que:

- Usuarios autenticados pueden ejecutar acciones permitidas.
- Usuarios sin permiso reciben rechazo.
- Las operaciones administrativas están protegidas.
- Los recursos no pueden accederse fuera del contexto autorizado.

Debe incluirse especial atención a escalada de privilegios y acceso entre empresas.

---

## 13. Evidencia de multi-tenancy

La validación multi-tenant debe demostrar que una empresa no puede consultar o modificar datos pertenecientes a otra.

Los casos deben incluir, cuando corresponda:

```text
Empresa A -> datos A -> permitido
Empresa A -> datos B -> rechazado
Empresa B -> datos B -> permitido
Empresa B -> datos A -> rechazado
```

El resultado debe conservarse como evidencia de seguridad funcional.

---

## 14. Evidencia de base de datos

La evidencia de base de datos puede incluir:

- Esquema.
- Tablas.
- Claves primarias.
- Foreign keys.
- Índices.
- Checks.
- Triggers.
- Procedimientos.
- Migraciones.
- Pruebas de integridad.
- Restauraciones.

La evidencia debe distinguir entre estructura documentada y comportamiento efectivamente probado.

---

## 15. Evidencia de inventario

Los flujos de inventario deben comprobar:

- Consulta de stock.
- Modificación.
- Validación de cantidades.
- Persistencia.
- Relaciones con materiales.
- Variantes.
- Concurrencia cuando corresponda.

Cuando exista una operación crítica de stock, debe conservarse evidencia de su comportamiento bajo condiciones normales y de error.

---

## 16. Evidencia de proformas

Debe conservarse evidencia para:

- Creación.
- Cálculo.
- Persistencia.
- Items.
- Detalles.
- Medidas.
- Cantidades.
- Precios.
- Totales.
- Asociación con cliente.
- Asociación con empresa.

Los cálculos deben verificarse mediante casos de prueba reproducibles.

---

## 17. Evidencia de pedidos

La evidencia debe contemplar:

- Creación.
- Relación con proforma.
- Detalles.
- Total.
- Estado.
- Persistencia.
- Actualizaciones.
- Cancelación cuando corresponda.

Los cambios de estado deben comprobarse contra las reglas de negocio.

---

## 18. Evidencia de facturación

La evidencia de facturación debe incluir, cuando corresponda:

- Creación.
- Detalles.
- Totales.
- IVA.
- Estados.
- Secuencias.
- Integración SRI.
- Errores.
- Anulación.
- Autorización.

Las operaciones que generen numeración deben probarse también bajo concurrencia.

---

## 19. Evidencia de IA

Las operaciones de IA deben conservar evidencia de:

- Entrada.
- Validación.
- Modelo utilizado.
- Proveedor.
- Duración.
- Resultado.
- Error.
- Timeout.
- Cuota.

La tabla `ia_requests` proporciona persistencia relacionada con las solicitudes procesadas.

Los errores de proveedores externos deben diferenciarse de errores internos de la aplicación.

---

## 20. Evidencia de seguridad

La evidencia de seguridad puede incluir resultados de:

- ESLint.
- Análisis de dependencias.
- SonarCloud.
- DAST.
- Pruebas de autenticación.
- Pruebas de autorización.
- Pruebas CSRF.
- Pruebas de multi-tenancy.
- Pruebas de validación.
- Pruebas de archivos.
- Pruebas de sesiones.

Cada resultado debe conservar fecha y contexto.

---

## 21. Evidencia SonarCloud

SonarCloud debe utilizarse como fuente de análisis estático y deuda técnica.

La línea base registrada anteriormente incluía:

```text
Open issues: 282
Duplications: 16.0%
Security rating: C
Security issues: 21
Reliability issues: 259
Maintainability: A
```

Estos valores representan una línea base histórica y no deben presentarse como estado actual sin ejecutar un nuevo análisis.

La lista de SonarCloud debe utilizarse como inventario técnico y abordarse por flujos, capas y causas estructurales.

---

## 22. Evidencia de seguridad dinámica

DAST debe utilizarse para identificar vulnerabilidades observables durante la ejecución.

Los resultados deben registrar:

- Herramienta.
- Versión.
- URL objetivo.
- Entorno.
- Fecha.
- Configuración relevante.
- Hallazgos.
- Severidad.
- Estado.
- Evidencia.
- Acción correctiva.

No debe ejecutarse contra producción sin autorización y preparación adecuada.

---

## 23. Evidencia de rendimiento

Las pruebas de rendimiento deben conservar:

- Herramienta.
- Entorno.
- Fecha.
- Configuración.
- Carga.
- Concurrencia.
- Duración.
- Latencia.
- Throughput.
- Errores.

Las mediciones deben compararse con una línea base definida.

---

## 24. Línea base frontend

Una medición Lighthouse registrada previamente produjo:

```text
Performance:     98
Accessibility:  100
Best Practices: 100
SEO:             100
LCP:           2.45 s
CLS:               0
INP:             56 ms
```

Estos valores corresponden a una medición concreta.

No deben interpretarse como garantía permanente de rendimiento.

---

## 25. Evidencia CI/CD

Cada workflow relevante debe conservar evidencia de:

- Commit.
- Rama.
- Workflow.
- Job.
- Node.js.
- Dependencias.
- Lint.
- Tests.
- Coverage.
- Artefactos.
- Resultado.

El objetivo es demostrar que las verificaciones pueden ejecutarse de manera reproducible.

---

## 26. Artefactos

Los artefactos de CI pueden incluir:

- Reportes de cobertura.
- Reportes de pruebas.
- Reportes E2E.
- Logs.
- Resultados de análisis.
- Informes de seguridad.

Los artefactos deben conservarse durante un periodo coherente con las necesidades del proyecto.

---

## 27. Evidencia de migración legacy

La migración de arquitectura legacy debe conservar evidencia de:

1. Componente identificado.
2. Consumidores encontrados.
3. Reemplazo seleccionado.
4. Referencias migradas.
5. Pruebas ejecutadas.
6. Ausencia de dependencias restantes.
7. Eliminación.
8. Nueva ejecución de pruebas.
9. Reducción de duplicación.

No debe eliminarse un componente únicamente porque SonarCloud lo identifique como duplicado.

---

## 28. Evidencia de cambios de base de datos

Cada cambio estructural debe relacionarse con:

- Migración.
- Modificación de esquema.
- Pruebas.
- Backup previo cuando corresponda.
- Verificación posterior.
- Rollback cuando exista.

Los cambios destructivos requieren especial atención.

---

## 29. Evidencia de recuperación

Las pruebas de backup y recuperación deben registrar:

- Backup utilizado.
- Fecha.
- Entorno.
- Punto de recuperación.
- Tiempo de restauración.
- Validaciones.
- Resultado.
- Problemas encontrados.

La existencia de un backup sin prueba de restauración no demuestra capacidad de recuperación.

---

## 30. Evidencia de documentación

Los documentos técnicos deben relacionarse con las áreas correspondientes:

```text
Arquitectura
     |
     +--> C4
     +--> Diagramas
     +--> Decisiones

Calidad
     |
     +--> Pruebas
     +--> Integración
     +--> E2E
     +--> Rendimiento

Seguridad
     |
     +--> Threat model
     +--> Política
     +--> Vulnerabilidades
     +--> Incidentes
```

La documentación debe reflejar el estado real del sistema.

---

## 31. Matriz de evidencia

Una matriz mínima puede utilizar la siguiente estructura:

| Elemento | Implementación | Prueba | Resultado | Evidencia | Estado |
|---|---|---|---|---|---|
| Autenticación | Backend/frontend | Unit/Integration/E2E | Verificar | Reporte | En verificación |
| Multi-tenancy | Backend/DB | Integration/E2E | Verificar | Reporte | En verificación |
| Inventario | Módulo/DB | Unit/Integration | Verificar | Reporte | En verificación |
| Proformas | Módulo/DB | Unit/Integration/E2E | Verificar | Reporte | En verificación |
| Pedidos | Módulo/DB | Unit/Integration/E2E | Verificar | Reporte | En verificación |
| Facturación | Módulo/DB | Integration/E2E | Verificar | Reporte | En verificación |
| IA | Servicio externo | Integration | Verificar | Reporte | En verificación |
| Seguridad | Backend/frontend | Static/DAST | Verificar | Reporte | En verificación |
| Rendimiento | Frontend/API | Performance | Verificar | Medición | En verificación |
| CI/CD | Workflows | CI | Verificar | Run | En verificación |

Los estados deben actualizarse únicamente después de obtener evidencia.

---

## 32. Estados

Se recomienda utilizar:

| Estado | Significado |
|---|---|
| `Pendiente` | No existe evidencia suficiente |
| `En verificación` | La validación está en proceso |
| `Verificado` | Existe evidencia reproducible |
| `Fallido` | La verificación encontró un problema |
| `Bloqueado` | No puede verificarse por una dependencia externa |
| `No aplica` | El control no corresponde |

---

## 33. Evidencia y deuda técnica

Un hallazgo de deuda técnica debe relacionarse con:

- Causa.
- Impacto.
- Ubicación.
- Riesgo.
- Acción.
- Prueba.
- Resultado.

Resolver una advertencia de forma superficial no debe considerarse tratamiento completo si la causa arquitectónica permanece.

---

## 34. Evidencia de regresión

Cuando un cambio corrija un defecto, debe conservarse evidencia de:

```text
Defecto
  |
  v
Prueba que reproduce
  |
  v
Corrección
  |
  v
Prueba aprobada
  |
  v
Regresión
```

Esto permite demostrar que la corrección no fue únicamente visual o manual.

---

## 35. Evidencia de fallos

Los resultados fallidos también constituyen evidencia.

Deben conservarse cuando permitan:

- Diagnosticar una causa.
- Demostrar una limitación.
- Justificar una deuda técnica.
- Documentar un bloqueo.
- Comparar una regresión.

No debe eliminarse un resultado fallido únicamente para obtener una presentación más favorable.

---

## 36. Reproducibilidad

Una evidencia técnica debe contener suficiente contexto para repetir el procedimiento cuando sea posible.

Debe incluir:

- Comando.
- Versión.
- Entorno.
- Configuración relevante.
- Datos de prueba.
- Fecha.
- Resultado.

Los valores sensibles deben omitirse o anonimizarse.

---

## 37. Datos sensibles

La evidencia no debe contener:

- Contraseñas.
- Tokens activos.
- Claves privadas.
- Secretos.
- Cookies de sesión.
- Datos personales innecesarios.

Cuando una captura o log contenga información sensible, debe anonimizarse antes de almacenarse.

---

## 38. Organización

La evidencia puede organizarse por categoría:

```text
docs/
└── Evidencia/
    └── evidence.md
```

Los reportes generados por herramientas pueden mantenerse como artefactos de CI/CD o en el mecanismo de almacenamiento definido para el proyecto.

No se deben duplicar innecesariamente artefactos grandes dentro del repositorio.

---

## 39. Automatización

La generación de evidencia repetitiva debe automatizarse cuando sea viable.

Ejemplos:

- Resultados de tests.
- Cobertura.
- Lint.
- Reportes E2E.
- Resultados de CI.
- Análisis estático.

La automatización debe producir evidencia sin sobrescribir decisiones arquitectónicas o análisis humanos.

---

## 40. Criterios de aceptación

La gestión de evidencia se considera adecuada cuando:

- Los resultados pueden rastrearse hasta una ejecución.
- Los comandos utilizados están identificados.
- Los resultados históricos pueden diferenciarse de los actuales.
- Los artefactos sensibles están protegidos.
- Los fallos relevantes no se ocultan.
- Las funcionalidades críticas tienen evidencia.
- Las pruebas y análisis se relacionan con requisitos o riesgos.
- Los cambios importantes conservan trazabilidad.

---

## 41. Estado actual

Existe evidencia técnica parcial de:

- Pruebas backend.
- Pruebas frontend.
- Cobertura.
- ESLint.
- CI.
- Lighthouse.
- SonarCloud.
- Arquitectura.
- Base de datos.
- Seguridad documental.

La evidencia de integración real, E2E completo, carga, DAST, restauración y otros controles debe actualizarse conforme se ejecuten las verificaciones correspondientes.

---

## 42. Mantenimiento

Este documento debe actualizarse cuando:

- Se incorpore una nueva herramienta de calidad.
- Cambien los workflows.
- Se modifique la arquitectura.
- Se agreguen pruebas.
- Se realicen nuevas mediciones.
- Se ejecuten análisis de seguridad.
- Se realicen pruebas de recuperación.
- Se modifique la estrategia de despliegue.

La fecha y contexto de cada medición deben conservarse para evitar confundir líneas base históricas con resultados actuales.
