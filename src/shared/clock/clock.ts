/**
 * Reloj inyectable.
 *
 * El dominio NUNCA debe llamar a `new Date()` / `Date.now()` directamente:
 * la lógica de SLA y reasignación depende del tiempo, y para testearla de forma
 * determinista necesitamos poder simular el avance del reloj.
 *
 * En producción se usa SystemClock; en tests, un FakeClock controlable.
 */
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
