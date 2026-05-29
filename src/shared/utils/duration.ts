/**
 * Convierte una duración estilo "30m", "7d", "15s", "1h" a milisegundos.
 * Útil para los TTL de tokens definidos como string en la configuración.
 */
const UNIT_MS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(`Duración inválida: "${value}" (usa formatos como 30m, 1h, 7d)`);
  }
  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof UNIT_MS;
  return amount * UNIT_MS[unit];
}
