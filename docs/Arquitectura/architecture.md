# Arquitectura del sistema

## Propósito

Este documento describe la arquitectura técnica actual del proyecto ERP SaaS para negocios de carpintería de vidrio y aluminio.

Su objetivo es documentar la organización del sistema, las responsabilidades de sus principales capas, la arquitectura modular del backend y la estrategia de consolidación de la arquitectura.

## Arquitectura general

El sistema está compuesto por un frontend web, un backend API y servicios de persistencia y apoyo.

```text
┌──────────────────────────────────────────────┐
│                  FRONTEND                    │
│                                              │
│ React + Vite + React Query + Axios           │
│                                              │
│ Components / Hooks / Context / Services      │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTP / REST
                       ▼
┌──────────────────────────────────────────────┐
│                  BACKEND                     │
│                                              │
│ Node.js + Express                            │
│                                              │
│ Modules / Controllers / Services / Repositories
└─────────────────┬──────────────────┬─────────┘
                  │                  │
                  ▼                  ▼
         ┌────────────────┐  ┌────────────────┐
         │     MySQL      │  │     Redis      │
         │                │  │                │
         │ Persistencia   │  │ Estado temporal │
         │ Integridad     │  │ y mecanismos   │
         │ Relacional     │  │ de autenticación│
         └────────────────┘  └────────────────┘
