import { formatEther } from 'viem';

export function shortAddress(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function padRank(rank: number, total?: number): string {
  const padded = rank.toString().padStart(3, '0');
  return total !== undefined ? `Nº ${padded} de ${total}` : `Nº ${padded}`;
}

export function formatMON(wei: bigint): string {
  const value = formatEther(wei);
  const num = Number(value);
  if (num === 0) return '0';
  if (num < 0.001) return '<0.001';
  return num.toFixed(3);
}

export function formatSignedAt(unixSeconds: bigint): string {
  const date = new Date(Number(unixSeconds) * 1000);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDeadline(unixSeconds: bigint): string {
  const date = new Date(Number(unixSeconds) * 1000);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(unixSeconds: bigint): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.ceil((Number(unixSeconds) - now) / 86400);
}

export function poolStatusLabel(status: number): string {
  return ['Abierto', 'Hito declarado', 'Aprobado', 'Rechazado', 'Reclamado'][status] ?? 'Desconocido';
}

export function levelName(weight: number): string {
  if (weight >= 5) return 'Fundador';
  if (weight >= 3) return 'Pionero';
  if (weight >= 2) return 'Temprano';
  return 'Fiel';
}
