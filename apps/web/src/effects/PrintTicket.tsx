import { useEffect, useState } from 'react';
import { StarBurst } from './StarBurst';
import { useMotionFlags } from './MotionProvider';

export function PrintTicket({ confirmed, rank }: { confirmed: boolean; rank: number }) {
  const { reducedMotion } = useMotionFlags();
  const [count, setCount] = useState(reducedMotion ? rank : 0);

  useEffect(() => {
    if (!confirmed || reducedMotion) return;
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= rank) window.clearInterval(timer);
    }, 40);
    return () => window.clearInterval(timer);
  }, [confirmed, rank, reducedMotion]);

  if (!confirmed) return null;

  return (
    <div className="relative" role="status">
      <article className={`ticket p-4 ${reducedMotion ? '' : 'print-ticket'}`}>
        <p className="font-display text-3xl uppercase">
          Nº {String(reducedMotion ? rank : count).padStart(3, '0')}
        </p>
        <p className="text-sm">Tu entrada quedó impresa.</p>
      </article>
      <StarBurst active={confirmed && !reducedMotion} />
    </div>
  );
}
