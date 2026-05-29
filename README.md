# Sistema de Administración de Tickets

Backend en **Node.js + TypeScript** para administrar tickets con **reasignación
automática por SLA**: ningún ticket queda sin revisar — si supera el tiempo
límite sin atención/actualización, se reasigna a otro usuario.

> Estado: **scaffolding / estructura inicial**. La lógica de negocio está
> esbozada con comentarios `Pendiente de implementación` en cada archivo.

## Stack

| Área | Tecnología |
|------|-----------|
| Runtime | Node.js 20+ / TypeScript |
| HTTP | Fastify |
| Base de datos | **SQL Server** (vía Prisma, provider `sqlserver`) |
| Cache / Colas | Redis + BullMQ |
| Auth | JWT (access + refresh) + RBAC |
| Validación | Zod |
| Logging | Pino (estructurado) |
| Testing | Vitest + Supertest + Testcontainers |

## Patrón

Monolito **modular** con **Clean Architecture** (domain / application /
infrastructure). El dominio no depende de frameworks ni de la base de datos,
lo que lo hace testeable y permite extraer módulos a microservicios a futuro.

## Estructura

```
src/
├── modules/            # tickets, users, auth (cada uno: domain/application/infrastructure)
├── shared/             # config, logger, errors, middlewares, events, clock
├── jobs/               # colas BullMQ + jobs de reasignación + proceso worker
├── infrastructure/     # cliente Prisma (SQL Server) + bootstrap del servidor
├── app.ts              # composición de dependencias
└── main.ts             # entry point del API
prisma/schema.prisma    # modelo de datos (SQL Server)
tests/                  # unit · integration · e2e
```

## Reasignación automática (resumen)

1. **Job diferido por ticket** (BullMQ delayed): al crear/actualizar un ticket
   se programa una verificación con `delay = SLA`. Si no hubo actividad, reasigna.
2. **Job de barrido periódico**: red de seguridad que consulta tickets vencidos
   y los reasigna, garantizando que ninguno quede olvidado.
3. La **estrategia** (a quién reasignar) es intercambiable (round-robin,
   menos cargado, por skill). Tras `MAX_AUTO_REASSIGNMENTS` se **escala**.

## Puesta en marcha

```bash
# 1. Variables de entorno
copy .env.example .env          # Windows
# cp .env.example .env          # Linux/Mac

# 2. Levantar SQL Server + Redis
docker compose up -d

# 3. Dependencias
npm install

# 4. Migraciones y cliente Prisma
npm run prisma:migrate

# 5. Desarrollo (en terminales separadas)
npm run dev       # API
npm run worker    # Worker de jobs

# Tests
npm test
```

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | API en modo watch |
| `npm run worker` | Proceso de workers BullMQ |
| `npm run prisma:migrate` | Crea/aplica migraciones |
| `npm run prisma:studio` | Explorador de datos |
| `npm test` | Ejecuta la batería de tests |
