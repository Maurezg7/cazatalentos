import type { ReactNode } from 'react';

export function TicketCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={`ticket rounded-2xl p-4 text-ink dark:text-cream ${className}`}>{children}</article>;
}
