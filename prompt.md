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