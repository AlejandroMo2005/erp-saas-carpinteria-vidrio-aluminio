# Observabilidad

## 1. Propósito

Este documento define los principios y mecanismos de observabilidad de la plataforma ERP/SaaS.

La observabilidad permite conocer el estado interno del sistema a partir de señales operativas como logs, métricas, health checks, errores, tiempos de respuesta, eventos de seguridad y comportamiento de los servicios.

Su objetivo es facilitar la detección, diagnóstico y seguimiento de incidentes sin depender exclusivamente de la inspección manual del código o de la base de datos.

## 2. Alcance

La observabilidad contempla:

- frontend;
- backend;
- MySQL;
- Redis;
- servicios externos;
- inteligencia artificial;
- autenticación;
- autorización;
- multi-tenancy;
- rendimiento;
- errores;
- logs;
- health checks;
- auditoría;
- infraestructura;
- CI/CD;
- despliegues;
- recuperación ante fallos.

## 3. Principios

La observabilidad debe cumplir los siguientes principios:

- registrar información suficiente para diagnosticar problemas;
- evitar registrar secretos o información sensible innecesaria;
- diferenciar errores de aplicación, infraestructura y servicios externos;
- relacionar eventos con usuarios y empresas cuando sea necesario;
- mantener separación entre logs operativos y auditoría;
- conservar trazabilidad entre despliegues e incidentes;
- evitar generar información excesiva que dificulte el análisis;
- utilizar señales objetivas para evaluar el estado del sistema.

## 4. Señales principales

La plataforma debe considerar tres señales principales:

```text
Logs
  +
Métricas
  +
Health checks
