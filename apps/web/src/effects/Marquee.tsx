import { useMotionFlags } from './MotionProvider';

export function Marquee({ text }: { text: string }) {
  const { reducedMotion } = useMotionFlags();
  if (reducedMotion) return <p className="text-sm font-semibold">{text}</p>;
  return (
    <div className="overflow-hidden">
      <p className="marquee whitespace-nowrap text-sm font-semibold">{text}</p>
    </div>
  );
}
