# Prompt para arquitectura

## Contexto:
Se necesita crear un aplicativo para administrar tickets y se encargue de no dejar ningún ticket sin revisar, si dichos tickets llegan a cierto tiempo límite, deben reasignarse a otro usuario.

## Requerimientos:
Necesito que diseñes la arquitectura de un sistema de administración de tickets usando Node.js.

### El sistema debe permitir:

* Crear y administrar tickets.
* Asignar tickets a usuarios.
* Reasignar automáticamente tickets cuando superen un tiempo límite sin atención o actualización.
* Manejar autenticación y roles básicos.

Quiero que propongas una arquitectura profesional, escalable y mantenible, enfocada en buenas prácticas backend.

### Incluye:

* Estructura de carpetas.
* Patrón arquitectónico recomendado.
* Tecnologías sugeridas.
* Manejo de base de datos.
* Estrategia para tareas automáticas o jobs.
* Manejo de eventos o colas si aplica.
* Separación de responsabilidades.
* Buenas prácticas de seguridad y logging.
* Estrategia para testing.
* Cómo preparar el proyecto para crecimiento futuro.

Nota: No generes todavía la implementación completa. Primero enfócate en definir la arquitectura y justificar las decisiones técnicas.

### Extra context:
- El problema sugiere 2 entidades, para que lo tengas en cuenta en la estructura:
// tabla tickets
tickets( id, priority, created_at, last_response_at, assigned_to, status )

// tabla users
users( id, email, manager_id ) 
- Se pretende usar SQL Server como base de datos


--- 


# Prompt implementación Lógica Autenticación

## Rol:
Actua como un desarrollador senior con enfoque en nodeJs

## Contexto: 
Para este proyecto se requiere un sistema de atuenticación, actualmente se tiene solo la estructura/arquitectura del mismo, el proyecto ejecuta pero actualmente no tiene ninguna implementación lógica, principalmente,es necesario comenzar con la autenticación. 

## Requerimientos:
- Autenticación JWT con access token corto (~30 min) + refresh token rotativo persistido (revocable en logout).
- Roles: ADMIN, AGENT, USER. Middleware de autorización por ruta. Diseñar la matriz de permisos explícita (quién crea, asigna, reasigna, cierra).
- Hashing de contraseñas con argon2.
- Validación de toda entrada con Zod en el borde (previene inyección y datos corruptos).
- Helmet (headers seguros), CORS restringido, rate limiting (especialmente en login → anti brute-force).
- Secrets en variables de entorno validadas al arranque (con Zod); nunca en el repo. Usar un secrets manager en producción.
- HTTPS terminado en reverse proxy/load balancer.
- Principio de mínimo privilegio en el usuario de base de datos.



# Prompt para Manejo de base de datos

## Contexto: 
Se requiere crear el modelo de base de datos del proyecto, tanto para la autenticación como para el manejo de tickets.

## Modelo de datos (esquema lógico):

- users — id, email, password_hash, role, created_at.
- tickets — id, title, description, status (OPEN, IN_PROGRESS, RESOLVED, CLOSED), priority, assignee_id (FK), created_at, updated_at, last_activity_at, sla_due_at.
- ticket_assignments (histórico) — ticket_id, from_user, to_user, reason (MANUAL, AUTO_REASSIGN), created_at. → Auditoría completa de quién tuvo el ticket y por qué cambió.
- ticket_events (opcional, event sourcing ligero) — registro inmutable de cambios.

## anotaciones importantes:

- last_activity_at es el campo central para detectar tickets "abandonados". Se actualiza con cada comentario, cambio de estado o interacción.
- sla_due_at materializa el tiempo límite. Calcularlo y guardarlo (en lugar de solo leer updated_at + límite) permite indexar y consultar eficientemente "qué tickets vencieron".
- Índices: sobre (status, sla_due_at) y assignee_id. La query del job de reasignación debe ser indexada para no degradarse con millones de tickets.
- Migraciones versionadas con Prisma Migrate, nunca cambios manuales en producción.
- Soft deletes (deleted_at) en tickets para no perder historia.

## Contexto adicional:
Algunas de las entidades ya fueron implementadas porque inicialmente se crearon las tablas de autenticación, solo implementa los modelos de las que no se hayan creado

---

# Prompt de tareas automáticas
## Contexto
Se requiere crear un siste de tareas automáticas que se encargue de actualizar los tickets que llegaron a su límite de espera

# Definición del requerimiento
Jobs diferidos por ticket (BullMQ delayed jobs)
Cuando se crea o actualiza un ticket, se programa un job diferido en BullMQ con delay = tiempo_límite:


Ticket creado/actualizado
   → encolar job "check-reassignment" con delay = SLA
   → al ejecutarse: ¿el last_activity_at sigue siendo el mismo?
        sí → reasignar (no hubo actividad)
        no → descartar (hubo actividad, ya se reprogramó otro job)


## Lógica de reasignación:

- El job solo dispara; la regla de a quién reasignar vive en un ReassignmentStrategy (patrón Strategy): round-robin, menos-cargado, por skill/categoría. Esto permite cambiar la política sin tocar la infraestructura.
- Idempotencia y locking: usar un lock distribuido en Redis o SELECT ... FOR UPDATE SKIP LOCKED en sql server para que dos workers no reasignen el mismo ticket simultáneamente.
- Cada reasignación registra fila en ticket_assignments y emite evento TicketReassigned.
- Escalado/tope: límite de reasignaciones automáticas; tras N intentos, escalar a un supervisor/cola especial en lugar de un ciclo infinito.

---

# Prompt para Manejo de eventos y colas
Event bus interno (desacoplamiento): los UseCases emiten eventos de dominio (TicketCreated, TicketAssigned, TicketReassigned, SLABreached). Suscriptores reaccionan sin que el caso de uso los conozca:

Notificar por email/Slack al nuevo asignado.
Registrar auditoría.
Programar/reprogramar el job de reasignación.
Por qué: evita que assign-ticket.usecase dependa directamente del servicio de email o del scheduler. Añadir un canal de notificación nuevo = añadir un suscriptor, sin tocar la lógica de asignación (principio Open/Closed).

Colas (BullMQ):

Cola reassignment — jobs diferidos.
Cola notifications — envío de correos con reintentos y backoff exponencial.
Empezar con event bus en proceso (EventEmitter/mediator). Si se requiere comunicación entre servicios futuros, migrar a un broker externo (RabbitMQ / Kafka) reemplazando solo la implementación del bus.

# Estrategia de testing
Pirámide de tests:

Nivel	Qué prueba	Herramienta
Unit	Reglas de dominio (transiciones de estado, cálculo SLA, estrategia de reasignación). Repos en memoria. Rápidos, sin I/O.	Vitest/Jest
Integration	UseCases contra DB real efímera + repos Prisma. Verifica queries, transacciones y locking.	Testcontainers (Postgres/Redis)
E2E	Flujo HTTP completo: login → crear ticket → asignar → simular vencimiento → verificar reasignación.	Supertest
Énfasis especial: la lógica de reasignación debe tener tests deterministas. Clave: inyectar el reloj (Clock abstraído) en lugar de usar Date.now() directo, para simular el paso del tiempo sin esperas reales. Probar concurrencia (dos workers, un ticket) y idempotencia.

Cobertura mínima en la capa de dominio (lo crítico), no perseguir 100% global.
Tests en CI obligatorios antes de merge.