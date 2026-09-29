# Deuda Técnica

## Descripción

Este documento registra y organiza la deuda técnica identificada en la plataforma ERP/SaaS para negocios de carpintería de vidrio y aluminio.

La deuda técnica comprende código legacy, duplicaciones, decisiones provisionales, componentes pendientes de migración, limitaciones de infraestructura, cobertura o pruebas insuficientes en determinadas áreas y otros elementos que pueden incrementar el costo de mantenimiento o evolución del sistema.

El objetivo no es eliminar toda deuda técnica de forma indiscriminada, sino mantenerla identificada, contextualizada y priorizada según su impacto técnico y operativo.

## Objetivo

Establecer un inventario estructurado de deuda técnica que permita:

- conocer su origen y ubicación;
- distinguir deuda activa de código obsoleto;
- priorizar trabajos de refactorización;
- relacionar deuda con seguridad, calidad y rendimiento;
- evitar duplicar esfuerzos;
- reducir progresivamente el acoplamiento;
- facilitar decisiones arquitectónicas;
- conservar evidencia de su evolución.

## Alcance

Este documento contempla deuda relacionada con:

- arquitectura;
- código legacy;
- duplicación;
- pruebas;
- seguridad;
- rendimiento;
- infraestructura;
- dependencias;
- base de datos;
- documentación;
- CI/CD;
- observabilidad;
- integraciones externas.

No todas las alertas de herramientas de análisis estático deben considerarse automáticamente deuda técnica. Cada hallazgo requiere revisión contextual.

## Principios de gestión

La deuda técnica debe gestionarse bajo los siguientes principios:

1. identificar antes de modificar;
2. verificar consumidores antes de eliminar;
3. priorizar por impacto;
4. resolver por flujos y capas cuando sea posible;
5. evitar correcciones mecánicas aisladas;
6. acompañar cambios estructurales con pruebas;
7. verificar regresiones después de eliminar código;
8. actualizar documentación relacionada;
9. conservar evidencia de las correcciones;
10. evitar introducir nueva deuda sin una justificación explícita.

## Clasificación

La deuda técnica puede clasificarse en:

### Deuda arquitectónica

Problemas relacionados con estructura, acoplamiento, responsabilidades o coexistencia de arquitecturas.

### Deuda de código

Código duplicado, obsoleto, complejo o difícil de mantener.

### Deuda de pruebas

Cobertura insuficiente de determinadas áreas, ausencia de pruebas críticas o dificultades para probar componentes.

### Deuda de seguridad

Configuraciones, patrones o componentes que incrementan una superficie de riesgo.

### Deuda de rendimiento

Consultas, procesamiento, renderizado o integración que puedan generar costos de rendimiento.

### Deuda operativa

Limitaciones relacionadas con despliegue, infraestructura, observabilidad o recuperación.

### Deuda documental

Información técnica desactualizada, incompleta o separada del estado real del sistema.

### Deuda de dependencias

Dependencias antiguas, incompatibilidades, cambios pendientes o mantenimiento de paquetes.

## Inventario actual

La deuda técnica actual debe interpretarse junto con el estado de migración del proyecto.

Una parte importante de la deuda identificada está relacionada con la coexistencia entre código legacy y la arquitectura modular actual.

También existen hallazgos provenientes de herramientas de análisis estático que deben analizarse antes de determinar si requieren modificación directa.

## Migración de arquitectura legacy

### Situación

El backend contiene componentes históricos fuera de la estructura modular actual bajo `src/modules` y `src/shared`.

También existen implementaciones antiguas que pueden duplicar responsabilidades ya trasladadas a la arquitectura actual.

### Riesgo

Mantener dos implementaciones funcionalmente equivalentes puede producir:

- duplicación;
- inconsistencias;
- mantenimiento doble;
- confusión sobre la implementación canónica;
- mayor superficie de pruebas;
- mayor superficie de seguridad;
- resultados de análisis estático más difíciles de interpretar.

### Tratamiento

La migración debe realizarse por flujo:

1. identificar la implementación legacy;
2. localizar consumidores;
3. identificar la implementación modular correspondiente;
4. migrar consumidores;
5. ejecutar pruebas;
6. verificar comportamiento;
7. eliminar la implementación legacy sin consumidores;
8. ejecutar nuevamente pruebas;
9. revisar análisis estático;
10. actualizar documentación.

No debe eliminarse un componente únicamente por estar ubicado en una ruta antigua.

## Duplicación de código

### Situación

El análisis de calidad ha identificado niveles elevados de duplicación en diferentes áreas del proyecto.

Existen duplicaciones asociadas, entre otros casos, con implementaciones legacy y sus equivalentes actuales.

### Riesgo

La duplicación puede provocar:

- correcciones repetidas;
- divergencia de comportamiento;
- incremento del costo de mantenimiento;
- mayor dificultad para aplicar cambios de seguridad;
- aumento del tamaño efectivo del sistema.

### Tratamiento

La prioridad debe ser identificar la causa de la duplicación.

Cuando dos implementaciones representan una migración incompleta, la solución preferente puede ser consolidar la arquitectura en lugar de crear una abstracción adicional.

No toda similitud textual debe eliminarse mediante abstracciones. Una abstracción incorrecta puede incrementar el acoplamiento.

## Cobertura y pruebas

### Estado

El backend dispone de una cobertura elevada y una suite amplia de pruebas automatizadas.

El frontend dispone de pruebas unitarias, aunque su cobertura global es considerablemente menor debido al tamaño y amplitud del código fuente incluido en el cálculo.

### Deuda identificada

La cobertura global no debe utilizarse como único criterio para determinar la calidad del frontend.

La deuda de pruebas debe identificarse principalmente en:

- flujos críticos sin pruebas;
- reglas de negocio;
- errores;
- autorización;
- multi-tenancy;
- integraciones;
- concurrencia;
- procesos E2E.

### Tratamiento

Priorizar pruebas que reduzcan riesgo funcional y regresiones, en lugar de incrementar porcentajes de cobertura sin relación con el riesgo del sistema.

## Seguridad

### Situación

El análisis estático ha identificado hallazgos relacionados con seguridad y calidad.

Entre los patrones observados se encuentran usos de generación pseudoaleatoria mediante `Math.random()`, límites de contenido en determinados endpoints y posibles problemas de inyección en registros de logs.

### Tratamiento

Cada hallazgo debe analizarse en su contexto.

Para un hallazgo de seguridad se debe determinar:

- si el código está activo;
- si el dato controlado por el usuario puede alcanzar el punto afectado;
- si existe exposición externa;
- si el valor generado requiere aleatoriedad criptográfica;
- si el componente pertenece a código legacy;
- si existe una solución arquitectónica que elimine el código afectado.

No debe aplicarse una corrección genérica a todos los usos de una misma función sin analizar su finalidad.

## Código legacy y seguridad

La eliminación de código legacy puede resolver simultáneamente:

- duplicación;
- mantenibilidad;
- vulnerabilidades potenciales;
- alertas de análisis estático;
- complejidad de pruebas.

Por esta razón, cuando un hallazgo pertenece a una implementación que será eliminada como parte de una migración, debe evaluarse primero la consolidación arquitectónica.

## Rendimiento

### Deuda potencial

Las áreas que requieren evaluación de rendimiento incluyen:

- consultas de base de datos;
- operaciones con grandes volúmenes de datos;
- renderizado frontend;
- llamadas a servicios externos;
- generación de documentos;
- operaciones de IA;
- concurrencia.

### Tratamiento

Las optimizaciones deben basarse en mediciones.

Antes de introducir una optimización debe identificarse el cuello de botella.

Después del cambio debe verificarse que:

- el rendimiento mejoró o se mantuvo;
- no aumentó la complejidad innecesariamente;
- no se introdujeron regresiones;
- las pruebas continúan funcionando.

## Base de datos

### Situación

La base de datos posee restricciones, claves foráneas, índices, triggers y procedimientos documentados.

### Deuda potencial

Las modificaciones futuras deben considerar:

- consistencia entre esquema y código;
- evolución de índices;
- migraciones reproducibles;
- integridad referencial;
- operaciones concurrentes;
- rendimiento de consultas;
- compatibilidad entre versiones.

### Tratamiento

No deben realizarse cambios estructurales directamente sobre una base de datos productiva sin un procedimiento reproducible de migración y verificación.

## Triggers

Los triggers actuales forman parte de la lógica de actualización de determinados totales.

Esta lógica debe permanecer documentada porque introduce comportamiento que no se encuentra únicamente en el código de aplicación.

Antes de modificar o eliminar un trigger se deben identificar:

- operaciones que lo activan;
- tablas afectadas;
- efectos secundarios;
- pruebas relacionadas;
- dependencia del código de aplicación.

## Integraciones externas

Las integraciones con proveedores externos, especialmente servicios de IA y servicios relacionados con facturación, introducen deuda potencial asociada con:

- disponibilidad;
- cambios de API;
- límites;
- costos;
- credenciales;
- tiempos de respuesta;
- formatos de respuesta.

### Tratamiento

Las integraciones deben aislarse mediante servicios específicos y contar con manejo de errores adecuado.

Los cambios de proveedor no deben obligar a modificar innecesariamente las reglas centrales del dominio.

## Dependencias

Las dependencias del proyecto representan una fuente continua de deuda potencial.

Antes de actualizar una dependencia se debe revisar:

- compatibilidad con Node.js;
- compatibilidad con el resto del proyecto;
- cambios de API;
- vulnerabilidades;
- comportamiento de build;
- pruebas;
- impacto en CI/CD.

Las actualizaciones masivas deben evitarse cuando dificulten identificar la causa de una regresión.

## CI/CD

### Situación

El proyecto dispone de automatización para instalación reproducible, linting, pruebas, cobertura y generación de artefactos.

### Deuda potencial

La evolución futura del pipeline puede requerir integrar progresivamente:

- pruebas de integración;
- pruebas E2E;
- rendimiento;
- análisis DAST;
- análisis estático;
- validaciones de infraestructura;
- generación de evidencia.

Estas incorporaciones deben realizarse de forma incremental y sin ocultar fallos mediante exclusiones injustificadas.

## Docker y reproducibilidad

El proyecto contempla Docker como parte de la estrategia de reproducibilidad y despliegue, pero la existencia de la documentación no debe interpretarse como evidencia de que ya existan Dockerfiles o una configuración Compose funcional.

La deuda relacionada con contenedores debe considerarse pendiente hasta que exista una implementación verificable.

## Observabilidad

La observabilidad dispone de logging, auditoría y mecanismos de diagnóstico documentados.

La deuda futura puede incluir:

- correlación más completa entre operaciones;
- métricas adicionales;
- alertas;
- seguimiento de operaciones externas;
- métricas de rendimiento;
- trazabilidad de flujos críticos.

Las mejoras deben priorizar información que facilite detectar y resolver problemas reales.

## Documentación

La documentación técnica debe considerarse deuda cuando:

- describe componentes inexistentes;
- omite componentes relevantes;
- utiliza rutas antiguas;
- documenta comportamientos no verificables;
- no refleja cambios arquitectónicos;
- contradice el código o el esquema de base de datos.

La documentación debe actualizarse como parte del cambio técnico y no únicamente al final de un ciclo de desarrollo.

## Priorización

La deuda técnica debe priorizarse considerando:

### Impacto

Qué parte del sistema afecta.

### Riesgo

Qué probabilidad existe de provocar fallos, vulnerabilidades o regresiones.

### Frecuencia

Con qué frecuencia se modifica o ejecuta el componente afectado.

### Costo de mantenimiento

Cuánto esfuerzo adicional requiere conservar la situación actual.

### Dependencias

Cuántos componentes dependen de la deuda.

### Facilidad de resolución

Qué tan viable es resolverla sin introducir nuevos riesgos.

### Valor arquitectónico

Si su resolución permite eliminar simultáneamente varias fuentes de deuda.

## Priorización por flujos

Cuando varias alertas pertenecen a la misma causa estructural, deben abordarse como un único flujo de trabajo.

Por ejemplo, una migración de un módulo legacy puede resolver simultáneamente:

- duplicación;
- problemas de mantenibilidad;
- pruebas duplicadas;
- alertas de seguridad;
- inconsistencias arquitectónicas.

Este enfoque evita invertir esfuerzo en corregir individualmente síntomas producidos por una misma causa.

## SonarCloud como fuente de evidencia

SonarCloud debe utilizarse como fuente de información para localizar problemas de calidad y seguridad.

Sus resultados no deben considerarse automáticamente como una lista de tareas independientes.

Antes de corregir un issue se debe determinar:

1. qué código lo genera;
2. si el código está activo;
3. si existe una implementación duplicada;
4. si el código será eliminado;
5. si existe riesgo real;
6. qué pruebas cubren el comportamiento;
7. qué otros problemas puede resolver el mismo cambio.

## Estado del análisis estático

El análisis disponible ha identificado deuda en diferentes dimensiones:

- duplicación;
- confiabilidad;
- seguridad;
- mantenibilidad.

Los valores de estas métricas pueden cambiar después de migraciones, eliminaciones de legacy y nuevas ejecuciones del análisis.

Por este motivo, los valores numéricos de una ejecución concreta deben conservarse como evidencia de esa ejecución y no tratarse como valores permanentes del proyecto.

## Corrección de deuda

Cada corrección significativa debería seguir un flujo similar:

1. definir el problema;
2. identificar su causa;
3. localizar consumidores;
4. establecer el cambio mínimo seguro;
5. crear o ajustar pruebas;
6. realizar el cambio;
7. ejecutar las pruebas;
8. ejecutar linting y análisis correspondiente;
9. revisar regresiones;
10. actualizar documentación;
11. registrar el resultado.

## Criterios para cerrar deuda

Un elemento puede considerarse cerrado cuando:

- el problema fue eliminado o mitigado;
- los consumidores fueron migrados cuando correspondía;
- las pruebas relevantes pasan;
- no existen regresiones conocidas;
- la documentación fue actualizada;
- la solución puede mantenerse de forma coherente con la arquitectura.

Una alerta que desaparece de una herramienta no implica automáticamente que el problema conceptual haya sido resuelto.

## Deuda aceptada

No toda deuda debe eliminarse inmediatamente.

Puede mantenerse temporalmente cuando:

- su riesgo sea conocido;
- exista una razón técnica;
- la eliminación inmediata introduzca mayor riesgo;
- exista una planificación posterior;
- se documente la razón.

La deuda aceptada debe revisarse periódicamente.

## Deuda introducida por cambios

Los nuevos cambios deben evitar:

- duplicar lógica existente;
- crear nuevas rutas legacy;
- introducir dependencias innecesarias;
- omitir pruebas de flujos críticos;
- registrar información sensible;
- introducir configuraciones no documentadas;
- crear soluciones temporales sin registrar su contexto.

Cuando una solución temporal sea necesaria, debe quedar identificada como tal.

## Indicadores de evolución

La evolución de la deuda técnica puede evaluarse mediante:

- cantidad de componentes legacy restantes;
- duplicación detectada;
- issues abiertos;
- vulnerabilidades;
- cobertura de flujos críticos;
- cantidad de pruebas;
- resultados de CI;
- resultados de análisis estático;
- incidencias relacionadas con componentes de deuda.

Estos indicadores deben utilizarse para observar tendencias y no como objetivos aislados.

## Relación con otras áreas

La deuda técnica debe revisarse conjuntamente con:

- arquitectura;
- decisiones técnicas;
- API;
- base de datos;
- seguridad;
- IA;
- observabilidad;
- CI/CD;
- despliegue;
- pruebas;
- solución de problemas.

Una modificación en cualquiera de estas áreas puede crear, reducir o transformar deuda técnica.

## Estado actual

El proyecto se encuentra en una etapa de consolidación arquitectónica.

La prioridad técnica es reducir progresivamente la coexistencia entre implementaciones legacy y la arquitectura modular, mientras se mantienen pruebas y controles de calidad.

La deuda debe abordarse mediante cambios que mejoren simultáneamente la estructura del sistema, la mantenibilidad, la seguridad y la capacidad de prueba cuando sea posible.

## Mantenimiento

Este documento debe actualizarse cuando:

- se identifique nueva deuda relevante;
- se cierre una deuda existente;
- cambie la arquitectura;
- se elimine código legacy;
- cambien las dependencias principales;
- aparezcan nuevos riesgos;
- cambien las herramientas de calidad;
- una deuda aceptada deje de ser válida.

El inventario debe reflejar el estado real del proyecto y no convertirse en un registro histórico desconectado del código.
