import { useEffect, useRef } from 'react';

export function StarBurst({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const particles = Array.from({ length: 40 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.8) * 6,
      life: 40,
    }));
    let frame = 0;
    function tick() {
      if (!context || !canvas) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;
        context.fillStyle = '#C8452D';
        context.fillRect(particle.x, particle.y, 3, 3);
      }
      if (particles.some((particle) => particle.life > 0)) {
        frame = requestAnimationFrame(tick);
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return <canvas ref={ref} width={240} height={160} aria-hidden className="pointer-events-none absolute inset-0 m-auto" />;
}
