/**
 * Converte uma duração curta (ex: "15m", "30d", "3600s") em segundos.
 * Aceita sufixos: s (segundos), m (minutos), h (horas), d (dias).
 * Valor inválido cai no fallback (default 900s = 15min).
 */
export function parseDurationToSeconds(value: string, fallbackSeconds = 900): number {
  const m = /^(\d+)([smhd])$/.exec(value.trim());
  if (!m) return fallbackSeconds;

  const n = Number(m[1]);
  switch (m[2]) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    default:
      return fallbackSeconds;
  }
}
