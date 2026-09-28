# Deuda técnica

## Descripción

Este documento registra la deuda técnica identificada en el proyecto y establece criterios para su clasificación, priorización, seguimiento y reducción.

La deuda técnica comprende decisiones, estructuras o implementaciones que pueden incrementar el costo de mantenimiento, dificultar la evolución del sistema o aumentar el riesgo de regresiones.

## Objetivo

Mantener una visión estructurada de la deuda técnica para evitar que los problemas identificados se gestionen únicamente como incidencias aisladas.

## Alcance

La deuda técnica puede relacionarse con:

- Arquitectura.
- Código legacy.
- Duplicación.
- Pruebas.
- Seguridad.
- Rendimiento.
- Base de datos.
- Dependencias.
- CI/CD.
- Documentación.
- Observabilidad.

## Criterios de clasificación

La deuda técnica se clasifica según:

### Arquitectura

Problemas relacionados con responsabilidades, acoplamiento, modularización o coexistencia de arquitecturas.

### Código legacy

Componentes que pertenecen a estructuras anteriores y que todavía poseen consumidores o dependencias.

### Duplicación

Código o estructuras repetidas que dificultan el mantenimiento y pueden provocar divergencias entre implementaciones.

### Testing

Áreas con cobertura insuficiente, ausencia de pruebas para flujos relevantes o pruebas que no validan adecuadamente determinados comportamientos.

### Seguridad

Problemas relacionados con validación, exposición de información, autenticación, autorización, configuración o controles de seguridad.

### Rendimiento

Problemas relacionados con consultas, procesamiento, consumo de recursos, concurrencia o tiempos de respuesta.

### Base de datos

Problemas relacionados con estructura, integridad, consultas, índices, migraciones o consistencia de datos.

### CI/CD

Problemas relacionados con automatización, reproducibilidad, validaciones o generación de evidencia.

### Documentación

Información técnica ausente, desactualizada o insuficiente para comprender y mantener el sistema.

### Observabilidad

Ausencia o insuficiencia de registros, métricas, trazabilidad o mecanismos para diagnosticar problemas.

## Priorización

La deuda técnica debe priorizarse considerando:

- Impacto funcional.
- Riesgo de seguridad.
- Riesgo de pérdida o inconsistencia de datos.
- Probabilidad de regresión.
- Complejidad de mantenimiento.
- Cantidad de componentes afectados.
- Dependencias existentes.
- Beneficio de resolver varias categorías simultáneamente.

No se debe priorizar únicamente por la cantidad de advertencias producidas por una herramienta de análisis.

## Estrategia de tratamiento

La deuda técnica se aborda por flujos y capas cuando esto permite resolver varios problemas relacionados mediante un mismo cambio.

El proceso general es:

1. Identificar el problema.
2. Determinar su causa.
3. Identificar componentes afectados.
4. Evaluar dependencias.
5. Definir una estrategia de corrección.
6. Aplicar el cambio.
7. Ejecutar las pruebas correspondientes.
8. Verificar que no existan regresiones.
9. Actualizar la documentación.
10. Registrar el resultado.

## Arquitectura legacy

La coexistencia entre componentes legacy y la arquitectura modular constituye una fuente de deuda técnica.

La estrategia adoptada es migrar progresivamente los consumidores hacia las implementaciones actuales antes de eliminar componentes obsoletos.

No se debe eliminar código legacy únicamente porque una herramienta de análisis detecte duplicación.

## Duplicación

La duplicación debe analizarse para determinar si corresponde a:

- Componentes legacy y actuales.
- Código realmente repetido.
- Implementaciones que requieren una abstracción común.
- Código generado o necesario por razones específicas.
- Estructuras que deben mantenerse separadas por responsabilidad.

La reducción de duplicación debe evitar abstraer componentes que no comparten realmente una responsabilidad estable.

## Pruebas

La cobertura se utiliza como indicador para identificar áreas que requieren mayor validación.

Una cobertura elevada no sustituye las pruebas de comportamiento, integración, concurrencia, seguridad o end-to-end.

Los flujos críticos deben priorizarse según su impacto funcional y técnico.

## Seguridad

Los hallazgos de seguridad deben analizarse en su contexto antes de aplicar una corrección.

La existencia de una regla de análisis no implica automáticamente que todos los hallazgos tengan la misma causa, impacto o tratamiento.

Las correcciones deben validarse mediante pruebas para evitar introducir regresiones.

## Rendimiento

Los problemas de rendimiento deben identificarse mediante mediciones y no únicamente mediante suposiciones.

Cuando corresponda, deben evaluarse:

- Tiempo de respuesta.
- Consultas a base de datos.
- Consumo de memoria.
- Uso de CPU.
- Concurrencia.
- Tamaño de respuestas.
- Operaciones externas.

## Base de datos

La deuda relacionada con la base de datos debe tratarse considerando simultáneamente:

- Integridad referencial.
- Índices.
- Consultas.
- Transacciones.
- Concurrencia.
- Migraciones.
- Compatibilidad con los datos existentes.

Los cambios estructurales deben validarse antes de aplicarse sobre datos persistentes.

## Dependencias

Las dependencias deben mantenerse en versiones compatibles con el proyecto y actualizarse de manera controlada.

Una actualización de dependencia debe comprobar:

- Compatibilidad.
- Pruebas automatizadas.
- Cambios de comportamiento.
- Vulnerabilidades conocidas.
- Impacto sobre el proceso de construcción.

## CI/CD

Las validaciones automatizadas deben evolucionar junto con la arquitectura.

La deuda del pipeline puede incluir:

- Validaciones faltantes.
- Falta de reproducibilidad.
- Ausencia de artefactos.
- Configuración de permisos excesivos.
- Dependencias desactualizadas en workflows.
- Ausencia de controles de seguridad.

## Documentación

La documentación forma parte del mantenimiento técnico.

Cuando una decisión arquitectónica o modificación relevante cambia el comportamiento del sistema, la documentación correspondiente debe actualizarse.

## Registro de deuda

| Área | Estado | Estrategia |
|---|---|---|
| Arquitectura legacy | En tratamiento | Migración progresiva |
| Duplicación | En tratamiento | Analizar por flujos y capas |
| Testing | En evolución | Ampliar pruebas de integración, E2E y rendimiento |
| Seguridad | En evolución | Analizar y corregir hallazgos contextualizados |
| CI/CD | En evolución | Incorporar progresivamente nuevas validaciones |
| Docker | Pendiente | Establecer entorno reproducible |
| Documentación | En tratamiento | Mantener documentación técnica por dominio |

## Relación con SonarCloud

SonarCloud se utiliza como fuente de información para identificar problemas de calidad, mantenibilidad y seguridad.

Sus resultados deben utilizarse como inventario técnico y no como sustituto del análisis arquitectónico.

Los hallazgos deben agruparse cuando múltiples incidencias provengan de una misma causa estructural.

## Eliminación de deuda

Una deuda técnica puede considerarse resuelta cuando:

- Se ha corregido la causa identificada.
- Las referencias obsoletas han sido eliminadas cuando corresponda.
- Las pruebas relevantes son satisfactorias.
- No existen regresiones conocidas.
- La documentación ha sido actualizada cuando resulte necesario.
- Las herramientas de análisis reflejan el cambio cuando sea aplicable.

## Seguimiento

El estado de la deuda debe actualizarse conforme avance la migración y las validaciones del proyecto.

Los elementos resueltos deben conservarse como historial cuando permitan comprender decisiones o cambios relevantes de la arquitectura.
