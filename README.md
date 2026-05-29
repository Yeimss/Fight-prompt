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

## Autenticación (implementada)

JWT con **access token (~30 min)** + **refresh token rotativo persistido** (revocable
en logout, con detección de reúso). Contraseñas con **argon2id**. Entrada validada
con **Zod**, seguridad con **helmet**, **CORS** restringido y **rate limit** (estricto
en login). Secretos validados al arranque (fail-fast).

### Matriz de permisos (RBAC)

| Acción                 | ADMIN | AGENT | USER |
|------------------------|:-----:|:-----:|:----:|
| Gestionar usuarios     |   ✓   |       |      |
| Crear ticket           |   ✓   |   ✓   |  ✓   |
| Ver todos los tickets  |   ✓   |   ✓   |      |
| Ver tickets propios    |   ✓   |   ✓   |  ✓   |
| Asignar ticket         |   ✓   |   ✓   |      |
| Reasignar (manual)     |   ✓   |   ✓   |      |
| Cerrar ticket          |   ✓   |   ✓   |      |
| Comentar / actualizar  |   ✓   |   ✓   |  ✓   |

> La reasignación **automática** por SLA la ejecuta el worker, no un usuario.

### Endpoints

| Método | Ruta                    | Auth        | Descripción                         |
|--------|-------------------------|-------------|-------------------------------------|
| POST   | `/api/v1/auth/login`    | público     | Login → access + refresh (5 req/min)|
| POST   | `/api/v1/auth/refresh`  | público     | Rota el refresh y emite nuevo par   |
| POST   | `/api/v1/auth/logout`   | público     | Revoca el refresh token             |
| POST   | `/api/v1/users`         | ADMIN       | Crear usuario                       |
| GET    | `/api/v1/users/me`      | autenticado | Datos del usuario actual            |

### Admin inicial (seed)

```bash
npm run seed   # crea admin@tickets.local / ChangeMe_123! (cámbialo)
```

> Producción: usar un secrets manager para los `JWT_*`, terminar **HTTPS** en el
> reverse proxy/load balancer (la app confía en `X-Forwarded-*` vía `trustProxy`),
> servir el refresh token en cookie `httpOnly` y usar un usuario de BD de
> **mínimo privilegio** (no `sa`).

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | API en modo watch |
| `npm run worker` | Proceso de workers BullMQ |
| `npm run prisma:migrate` | Crea/aplica migraciones |
| `npm run prisma:studio` | Explorador de datos |
| `npm test` | Ejecuta la batería de tests |
