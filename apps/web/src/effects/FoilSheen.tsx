import { useRef, type PointerEvent, type ReactNode } from 'react';
import { useMotionFlags } from './MotionProvider';

export function FoilSheen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const { allowRichMotion } = useMotionFlags();

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (!allowRichMotion) return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const mx = ((event.clientX - box.left) / box.width) * 100;
    const my = ((event.clientY - box.top) / box.height) * 100;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      node.style.setProperty('--mx', `${mx}%`);
      node.style.setProperty('--my', `${my}%`);
    });
  }

  return (
    <div ref={ref} className="foil relative" onPointerMove={onMove}>
      {children}
      {allowRichMotion ? <span aria-hidden className="foil-spot pointer-events-none absolute inset-0" /> : null}
    </div>
  );
}
