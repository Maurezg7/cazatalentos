import { useRef, type PointerEvent, type ReactNode } from 'react';
import { motionTokens } from './tokens';
import { useMotionFlags } from './MotionProvider';

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { allowRichMotion, touch } = useMotionFlags();

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (!allowRichMotion || touch) return;
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    node.style.willChange = 'transform';
    node.style.transform = `perspective(800px) rotateX(${(-py * motionTokens.tiltMax).toFixed(2)}deg) rotateY(${(px * motionTokens.tiltMax).toFixed(2)}deg)`;
  }

  function onLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.transform = '';
    node.style.willChange = 'auto';
  }

  return (
    <div
      ref={ref}
      className={`${allowRichMotion && touch ? 'animate-[float_4s_ease-in-out_infinite]' : ''} ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  );
}
