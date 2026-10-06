import { useEffect, useRef, type ReactNode } from 'react';
import { useMotionFlags } from './MotionProvider';

export function ScrollReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotionFlags();

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion) return;
    node.style.opacity = '0';
    node.style.transform = 'translateY(12px)';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.style.willChange = 'transform, opacity';
        node.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms linear';
        node.style.opacity = '1';
        node.style.transform = 'none';
        observer.disconnect();
        window.setTimeout(() => {
          node.style.willChange = 'auto';
        }, 450);
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
